import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

/**
 * GET /api/dashboard/summary?period=today|week|month&branchId=uuid
 * 
 * Se o OWNER é uma MATRIZ (tem filiais) e não passa branchId:
 *   → Agrega agendamentos de TODAS as filiais + da matriz.
 * Se passa branchId:
 *   → Filtra apenas por aquela unidade específica.
 */
router.get('/summary', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    const { period = 'today', branchId } = req.query

    if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Acesso restrito a Owners e Managers' })
    }

    // Se for MANAGER, força o escopo apenas para a própria filial (ownerId dele)
    const effectiveBranchId = user.role === 'MANAGER' ? user.ownerId : branchId

    // Calcula a data de início com base no período
    const now = new Date()
    let startDate = new Date()
    
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'week') {
      const day = startDate.getDay()
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1)
      startDate = new Date(startDate.setDate(diff))
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'month') {
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
    }

    // Identifica todos os IDs de barbeiros que pertencem ao escopo da consulta
    let barberIds: string[] = []

    if (effectiveBranchId && typeof effectiveBranchId === 'string') {
      // Escopo: uma filial específica — buscar todos os barbeiros daquela filial
      const branchBarbers = await prisma.user.findMany({
        where: {
          ownerId: effectiveBranchId,
          role: { in: ['BARBER', 'MANAGER'] }
        },
        select: { id: true }
      })
      barberIds = [effectiveBranchId, ...branchBarbers.map(b => b.id)]
    } else {
      // Escopo: matriz inteira (rede) — inclui a própria matriz + todas as filiais
      const branches = await prisma.user.findMany({
        where: { parentId: user.id, role: 'OWNER' },
        select: { id: true }
      })

      const allOwnerIds = [user.id, ...branches.map(b => b.id)]

      // Buscar todos os barbeiros/managers de todas as unidades da rede
      const allBarbers = await prisma.user.findMany({
        where: {
          ownerId: { in: allOwnerIds },
          role: { in: ['BARBER', 'MANAGER'] }
        },
        select: { id: true }
      })

      barberIds = [...allOwnerIds, ...allBarbers.map(b => b.id)]
    }

    // Busca os agendamentos do escopo filtrado
    const appointments = await prisma.appointment.findMany({
      where: {
        barberId: { in: barberIds },
        status: { in: ['COMPLETED', 'CONFIRMED'] },
        startTime: { gte: startDate }
      },
      include: {
        barber: true
      }
    })

    let grossRevenue = 0
    let totalCommissions = 0
    const barberBreakdownMap: Record<string, {
      barberId: string
      barberName: string
      avatarUrl: string | null
      branchName: string | null
      totalRevenue: number
      commissionType: string
      commissionValue: number
      commissionAmount: number
      appointmentCount: number
    }> = {}

    appointments.forEach(app => {
      grossRevenue += app.totalPrice

      const barber = app.barber
      if (!barber) return

      if (!barberBreakdownMap[barber.id]) {
        barberBreakdownMap[barber.id] = {
          barberId: barber.id,
          barberName: barber.name,
          avatarUrl: barber.avatarUrl,
          branchName: barber.branchName,
          totalRevenue: 0,
          commissionType: barber.commissionType,
          commissionValue: barber.commissionValue,
          commissionAmount: 0,
          appointmentCount: 0
        }
      }

      const bData = barberBreakdownMap[barber.id]
      bData.appointmentCount += 1
      bData.totalRevenue += app.totalPrice

      if (barber.role !== 'OWNER') {
        let commissionForThisApp = 0
        if (barber.commissionType === 'PERCENTAGE') {
          commissionForThisApp = app.totalPrice * ((barber.commissionValue || 0) / 100)
        } else if (barber.commissionType === 'FIXED') {
          commissionForThisApp = barber.commissionValue || 0
        }
        
        bData.commissionAmount += commissionForThisApp
        totalCommissions += commissionForThisApp
      }
    })

    const netRevenue = grossRevenue - totalCommissions
    const barberBreakdown = Object.values(barberBreakdownMap).sort((a, b) => b.totalRevenue - a.totalRevenue)

    return res.json({
      grossRevenue,
      totalCommissions,
      netRevenue,
      totalAppointments: appointments.length,
      barberBreakdown
    })

  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/dashboard/branches
 * 
 * Retorna a lista de filiais que pertencem à rede deste OWNER (matriz).
 */
router.get('/branches', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!

    if (user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Apenas o dono da rede pode listar filiais' })
    }

    const branches = await prisma.user.findMany({
      where: { parentId: user.id, role: 'OWNER' },
      select: {
        id: true,
        name: true,
        branchName: true,
        slug: true,
        _count: { select: { teamMembers: true, barberSlots: true } }
      },
      orderBy: { name: 'asc' }
    })

    return res.json({
      matriz: {
        id: user.id,
        name: user.name,
        branchName: user.branchName || 'Matriz'
      },
      branches: branches.map(b => ({
        id: b.id,
        name: b.name,
        branchName: b.branchName || b.name,
        slug: b.slug,
        teamCount: b._count.teamMembers,
        appointmentCount: b._count.barberSlots
      }))
    })
  } catch (error) {
    next(error)
  }
})

import { supabaseAdmin } from '../lib/supabaseAdmin'

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

/**
 * POST /api/dashboard/branches
 * 
 * Cria uma nova filial atrelada à matriz e o gerente (MANAGER) dessa filial.
 */
router.post('/branches', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!

    if (user.role !== 'OWNER' || user.subscriptionPlan !== 'ENTERPRISE' || user.parentId) {
      return res.status(403).json({ error: 'Apenas a Matriz pode criar novas filiais.' })
    }

    const { name, branchAddress, managerName, managerEmail, managerPassword } = req.body

    if (!name || !managerName || !managerEmail || !managerPassword) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' })
    }

    // 1. Criar o MANAGER no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: managerEmail,
      password: managerPassword,
      email_confirm: true,
      user_metadata: { name: managerName, role: 'MANAGER' }
    })

    if (authError || !authData.user) {
      console.error('Error creating manager in Supabase:', authError)
      return res.status(400).json({ error: authError?.message || 'Erro ao criar gerente no Supabase' })
    }

    // Gerar slug único para o Manager e para a Filial
    let baseSlugFilial = slugify(name)
    let candidateSlugFilial = baseSlugFilial
    let counterFilial = 1
    while (await prisma.user.findUnique({ where: { slug: candidateSlugFilial } })) {
      candidateSlugFilial = `${baseSlugFilial}-${counterFilial}`
      counterFilial++
    }

    let baseSlugManager = slugify(managerName)
    let candidateSlugManager = baseSlugManager
    let counterManager = 1
    while (await prisma.user.findUnique({ where: { slug: candidateSlugManager } })) {
      candidateSlugManager = `${baseSlugManager}-${counterManager}`
      counterManager++
    }

    // Transação Prisma: Cria o Tenant (Filial) e atualiza o Manager recém criado
    const result = await prisma.$transaction(async (tx) => {
      // 2. Criar o Tenant (Filial) com role OWNER, mas com parentId
      const newBranch = await tx.user.create({
        data: {
          id: crypto.randomUUID(),
          name: name,
          branchName: name,
          branchAddress: branchAddress || null,
          slug: candidateSlugFilial,
          role: 'OWNER', // Arquiteturalmente é um tenant independente
          parentId: user.id, // Vínculo com a matriz
          subscriptionPlan: 'INHERITED', // Não paga, a matriz que paga
          saasStatus: 'ACTIVE',
        }
      })

      // 3. Atualizar o Manager criado no Auth para vincular ao novo Tenant
      await tx.user.update({
        where: { id: authData.user.id },
        data: {
          role: 'MANAGER',
          ownerId: newBranch.id, // O gerente pertence à filial recém-criada
          slug: candidateSlugManager,
          name: managerName
        }
      })

      return newBranch
    })

    return res.json({ success: true, branch: result })

  } catch (error) {
    console.error('Error creating branch:', error)
    next(error)
  }
})

export default router
