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

    if (branchId && typeof branchId === 'string') {
      // Escopo: uma filial específica — buscar todos os barbeiros daquela filial
      const branchBarbers = await prisma.user.findMany({
        where: {
          ownerId: branchId,
          role: { in: ['BARBER', 'MANAGER'] }
        },
        select: { id: true }
      })
      barberIds = [branchId, ...branchBarbers.map(b => b.id)]
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

export default router
