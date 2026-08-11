import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.middleware'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import bcrypt from 'bcryptjs'
import { validateRequest } from '../middleware/validateRequest'
import { createTeamMemberSchema, addTeamMemberByEmailSchema, removeTeamMemberParamsSchema } from '../schemas/team.schema'

const router = Router()
const prisma = new PrismaClient()

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

// GET /api/team
router.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    
    const team = await prisma.user.findMany({
      where: { 
        role: { in: ['BARBER', 'OWNER', 'MANAGER'] },
        ownerId: (user.role === 'OWNER' || user.role === 'MANAGER') ? user.id : user.ownerId
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        specialty: true,
        commissionType: true,
        commissionValue: true,
        notes: true
      },
      orderBy: { name: 'asc' }
    })
    res.json(team)
  } catch (error) {
    next(error)
  }
})

import { supabaseAdmin } from '../lib/supabaseAdmin'

// POST /api/team
router.post('/', requireAuth, validateRequest({ body: createTeamMemberSchema }), async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Apenas donos e gerentes podem adicionar equipe' })
    }

    const { name, email, password, phone, avatarUrl, specialty, role, commissionType, commissionValue } = req.body

    // 1. Criar colaborador no Supabase Auth com senha temporária
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, role: role === 'OWNER' ? 'OWNER' : 'BARBER', avatar_url: avatarUrl }
    })

    if (authError || !authData.user) {
      console.error('Error creating team member in Supabase:', authError)
      return res.status(400).json({ error: authError?.message || 'Erro ao criar conta no Supabase' })
    }

    // 2. Gerar slug único
    let baseSlug = slugify(name)
    let candidateSlug = baseSlug
    let counter = 1
    while (await prisma.user.findUnique({ where: { slug: candidateSlug } })) {
      candidateSlug = `${baseSlug}-${counter}`
      counter++
    }

    // 3. Atualizar Prisma (garantir role e specialty)
    const newUser = await prisma.user.update({
      where: { id: authData.user.id },
      data: {
        role: role === 'OWNER' ? 'OWNER' : 'BARBER', // Manager não pode criar manager ou owner, então forçamos para barber, a não ser que role venha certa (que aqui é contornado pelo front)
        slug: candidateSlug,
        specialty,
        ownerId: user.id, // Vínculo multi-tenant! (funciona tanto para OWNER quanto MANAGER)
        commissionType: commissionType || 'PERCENTAGE',
        commissionValue: Number(commissionValue) || 0
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        specialty: true,
        commissionType: true,
        commissionValue: true
      }
    })

    res.json(newUser)
  } catch (error) {
    console.error('Error in POST /api/team:', error)
    res.status(500).json({ error: 'Erro ao criar membro da equipe' })
  }
})

// PUT /api/team/:id
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params
    const { name, phone, avatarUrl, specialty, role, commissionType, commissionValue } = req.body
    
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        phone,
        avatarUrl,
        specialty,
        commissionType,
        commissionValue: commissionValue !== undefined ? Number(commissionValue) : undefined,
        ...(role && { role })
      }
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar membro da equipe' })
  }
})

// DELETE /api/team/:id
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params
    await prisma.user.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover membro' })
  }
})

// ============================================================
// TEAM MANAGEMENT — Vínculo de Equipe (invite link, add, remove)
// ============================================================

/**
 * GET /api/team/link
 * Retorna o link de convite exclusivo do OWNER logado.
 * O "token" do convite é simplesmente o UUID do OWNER — o frontend
 * monta a URL /registro?invite=<ownerId>.
 */
router.get('/link', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Apenas proprietários e gerentes podem gerar links de convite' })
    }

    // Para MANAGER vinculado a um OWNER, usamos o ownerId como tenant
    const tenantId = user.role === 'OWNER' ? user.id : user.ownerId
    if (!tenantId) {
      return res.status(400).json({ error: 'Vínculo de proprietário não encontrado' })
    }

    res.json({ inviteToken: tenantId })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/team/add
 * Recebe { email }, busca o usuário pelo email no Supabase Auth,
 * e vincula ao OWNER logado atualizando ownerId e role para BARBER.
 */
router.post('/add', requireAuth, validateRequest({ body: addTeamMemberByEmailSchema }), async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Apenas proprietários e gerentes podem vincular barbeiros' })
    }

    const tenantId = user.role === 'OWNER' ? user.id : user.ownerId
    if (!tenantId) {
      return res.status(400).json({ error: 'Vínculo de proprietário não encontrado' })
    }

    const { email } = req.body as { email: string }

    // Buscar o usuário no Supabase Auth pelo email
    const { data: authList, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) {
      console.error('Error listing users from Supabase Auth:', authError)
      return res.status(500).json({ error: 'Erro ao consultar base de usuários' })
    }

    const targetAuthUser = authList.users.find(u => u.email === email)
    if (!targetAuthUser) {
      return res.status(404).json({ error: 'Nenhum usuário encontrado com este e-mail' })
    }

    // Verificar se o perfil já existe no banco
    const targetProfile = await prisma.user.findUnique({ where: { id: targetAuthUser.id } })
    if (!targetProfile) {
      return res.status(404).json({ error: 'Perfil do usuário não encontrado no banco de dados' })
    }

    // Verificar se já está vinculado a outro OWNER
    if (targetProfile.ownerId && targetProfile.ownerId !== tenantId) {
      return res.status(409).json({ error: 'Este barbeiro já está vinculado a outra barbearia' })
    }

    if (targetProfile.ownerId === tenantId) {
      return res.status(409).json({ error: 'Este profissional já faz parte da sua equipe' })
    }

    // Gerar slug se não existir
    let slug = targetProfile.slug
    if (!slug) {
      let baseSlug = slugify(targetProfile.name)
      let candidateSlug = baseSlug
      let counter = 1
      while (await prisma.user.findUnique({ where: { slug: candidateSlug } })) {
        candidateSlug = `${baseSlug}-${counter}`
        counter++
      }
      slug = candidateSlug
    }

    // Vincular: atualiza ownerId e promove para BARBER se for CLIENT
    const updatedUser = await prisma.user.update({
      where: { id: targetAuthUser.id },
      data: {
        ownerId: tenantId,
        role: targetProfile.role === 'CLIENT' ? 'BARBER' : targetProfile.role,
        slug,
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        specialty: true,
        phone: true,
      }
    })

    res.json(updatedUser)
  } catch (error) {
    console.error('Error in POST /api/team/add:', error)
    next(error)
  }
})

/**
 * DELETE /api/team/remove/:barberId
 * Desvincula um barbeiro da equipe, setando ownerId = null.
 * Não deleta a conta — apenas remove o vínculo.
 */
router.delete('/remove/:barberId', requireAuth, validateRequest({ params: removeTeamMemberParamsSchema }), async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Apenas proprietários e gerentes podem remover membros da equipe' })
    }

    const tenantId = user.role === 'OWNER' ? user.id : user.ownerId
    const { barberId } = req.params

    // Verificar se o barbeiro realmente pertence a este tenant
    const barber = await prisma.user.findUnique({ where: { id: barberId } })
    if (!barber || barber.ownerId !== tenantId) {
      return res.status(404).json({ error: 'Barbeiro não encontrado na sua equipe' })
    }

    // Impedir que o OWNER remova a si mesmo
    if (barberId === user.id) {
      return res.status(400).json({ error: 'Você não pode remover a si mesmo da equipe' })
    }

    await prisma.user.update({
      where: { id: barberId },
      data: { ownerId: null }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/team/remove:', error)
    next(error)
  }
})

export default router
