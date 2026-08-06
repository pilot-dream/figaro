import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

// GET /api/finance/summary
router.get('/summary', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    const { period = 'today' } = req.query

    // Lógica para filtrar período (simples)
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

    if (user.role === 'BARBER') {
      // BARBER vê apenas sua própria comissão
      const appointments = await prisma.appointment.findMany({
        where: {
          barberId: user.id,
          status: { in: ['COMPLETED', 'CONFIRMED'] },
          startTime: { gte: startDate }
        }
      })

      let myCommission = 0
      appointments.forEach(app => {
        if (user.commissionType === 'PERCENTAGE') {
          myCommission += app.totalPrice * ((user.commissionValue || 0) / 100)
        } else if (user.commissionType === 'FIXED') {
          myCommission += user.commissionValue || 0
        }
      })

      return res.json({
        myCommission,
        totalAppointments: appointments.length
      })
    }

    if (user.role === 'OWNER') {
      // OWNER vê o faturamento total da barbearia
      const appointments = await prisma.appointment.findMany({
        where: {
          status: { in: ['COMPLETED', 'CONFIRMED'] },
          startTime: { gte: startDate },
          barber: {
            OR: [
              { ownerId: user.id },
              { id: user.id }
            ]
          }
        },
        include: {
          barber: true
        }
      })

      let grossRevenue = 0
      let totalCommissions = 0
      
      const barberBreakdownMap: Record<string, any> = {}

      appointments.forEach(app => {
        grossRevenue += app.totalPrice

        const barber = app.barber
        if (!barber) return

        if (!barberBreakdownMap[barber.id]) {
          barberBreakdownMap[barber.id] = {
            barberId: barber.id,
            barberName: barber.name,
            avatarUrl: barber.avatarUrl,
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

        // Owner não tem comissão, os barbeiros sim.
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
      const barberBreakdown = Object.values(barberBreakdownMap).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)

      return res.json({
        grossRevenue,
        totalCommissions,
        netRevenue,
        totalAppointments: appointments.length,
        barberBreakdown
      })
    }

    // Outros papéis não têm acesso ao financeiro
    return res.status(403).json({ error: 'Acesso negado' })

  } catch (error) {
    next(error)
  }
})

export default router

// GET /api/finance/chart-data
router.get('/chart-data', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    const { barberId } = req.query
    
    // Calcula os últimos 7 dias (incluindo hoje)
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d)
    }

    const startDate = new Date(days[0])
    startDate.setHours(0, 0, 0, 0)
    
    const whereClause: any = {
      status: 'COMPLETED',
      startTime: { gte: startDate },
    }

    if (barberId && barberId !== 'all') {
      whereClause.barberId = barberId
    } else if (user.role === 'OWNER') {
      whereClause.barber = {
        OR: [
          { ownerId: user.id },
          { id: user.id }
        ]
      }
    } else if (user.role === 'BARBER') {
      whereClause.barberId = user.id
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
    })

    const shortDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    const chartData = days.map(day => {
      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      const dailyApps = appointments.filter(a => a.startTime >= dayStart && a.startTime <= dayEnd)
      
      // Sempre usa o valor bruto (totalPrice) para bater exatamente com o "Total Faturado" da TabHome
      const dailyRevenue = dailyApps.reduce((acc, a) => acc + a.totalPrice, 0)

      return {
        name: shortDays[day.getDay()],
        faturamento: dailyRevenue
      }
    })

    res.json(chartData)
  } catch (error) {
    next(error)
  }
})
