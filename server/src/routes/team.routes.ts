import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.middleware'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import bcrypt from 'bcryptjs'

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
        role: { in: ['BARBER', 'OWNER'] },
        ownerId: user.role === 'OWNER' ? user.id : user.ownerId
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
router.post('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    if (user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Apenas donos podem adicionar equipe' })
    }

    const { name, email, password, phone, avatarUrl, specialty, role, commissionType, commissionValue } = req.body
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
    }

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
        role: role === 'OWNER' ? 'OWNER' : 'BARBER',
        slug: candidateSlug,
        specialty,
        ownerId: user.id, // Vínculo multi-tenant!
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

export default router
