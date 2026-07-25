import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

// GET /api/mrr/plans (Public) - Busca os planos VIP de um barbeiro/barbearia
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        price: 'asc'
      }
    })
    res.json(plans)
  } catch (error) {
    next(error)
  }
})

// POST /api/mrr/plans (Requires Auth) - Owner cria um plano
router.post('/plans', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, price, cutsPerPeriod, description } = req.body

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        price: parseFloat(price),
        cutsPerPeriod: parseInt(cutsPerPeriod, 10),
        description,
        isActive: true
      }
    })

    res.json(plan)
  } catch (error) {
    next(error)
  }
})

// GET /api/mrr/subscribers (Requires Auth) - Owner lista seus assinantes
router.get('/subscribers', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!

    const recurringSlots = await prisma.recurringSlot.findMany({
      where: {
        barberId: user.id
      },
      include: {
        customer: true
      }
    })

    const subscriptions = await prisma.customerSubscription.findMany({
      where: {
        clientId: {
          in: recurringSlots.map(s => s.customerId)
        }
      },
      include: {
        plan: true
      }
    })

    const result = recurringSlots.map(slot => {
      const sub = subscriptions.find(s => s.clientId === slot.customerId)
      return {
        id: slot.id, // using slot id as subscriber item id
        subscriptionId: sub?.id,
        clientName: slot.customer.name || 'Cliente',
        planName: sub?.plan.name || 'Plano',
        dayOfWeek: slot.dayOfWeek,
        time: slot.time,
        status: sub?.status || 'ACTIVE'
      }
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
})

// PUT /api/mrr/subscribers/:id/status (Requires Auth) - Altera o status da assinatura
router.put('/subscribers/:id/status', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    const subscription = await prisma.customerSubscription.findUnique({
      where: { id }
    })
    if (!subscription) return res.status(404).json({ error: 'Assinatura não encontrada' })

    const updated = await prisma.customerSubscription.update({
      where: { id },
      data: { status }
    })
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/mrr/subscribers/:id (Requires Auth) - Excluir assinatura e liberar horário
router.delete('/subscribers/:id', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params
    const subscription = await prisma.customerSubscription.findUnique({
      where: { id }
    })
    if (!subscription) return res.status(404).json({ error: 'Assinatura não encontrada' })

    // Deleta os horários cativos deste cliente
    await prisma.recurringSlot.deleteMany({
      where: {
        customerId: subscription.clientId
      }
    })

    await prisma.customerSubscription.delete({
      where: { id }
    })
    
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// GET /api/mrr/taken-slots/:barberId (Public) - Retorna os horários já ocupados por assinantes
router.get('/taken-slots/:barberId', async (req, res, next) => {
  try {
    const { barberId } = req.params

    const recurringSlots = await prisma.recurringSlot.findMany({
      where: {
        barberId,
        customer: {
          subscriptions: {
            some: { status: { in: ['ACTIVE', 'PAST_DUE'] } }
          }
        }
      },
      select: {
        dayOfWeek: true,
        time: true
      }
    })

    res.json(recurringSlots)
  } catch (error) {
    next(error)
  }
})

// POST /api/mrr/subscribe (Requires Auth) - Assinar plano e travar horário
router.post('/subscribe', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    
    const { barberId, planId, dayOfWeek, time } = req.body

    if (!barberId || !planId || dayOfWeek === undefined || !time) {
      return res.status(400).json({ error: 'Faltam dados obrigatórios' })
    }

    // 0. Verifica conflito de horário MRR
    const existingSlot = await prisma.recurringSlot.findFirst({
      where: {
        barberId,
        dayOfWeek: Number(dayOfWeek),
        time,
        customer: {
          subscriptions: {
            some: { status: { in: ['ACTIVE', 'PAST_DUE'] } }
          }
        }
      }
    })

    if (existingSlot) {
      return res.status(409).json({ error: 'Este horário já está reservado por outro assinante do Clube VIP.' })
    }

    // 1. Cria a assinatura vinculada ao plano
    const subscription = await prisma.customerSubscription.create({
      data: {
        clientId: user.id,
        planId: planId,
        status: 'ACTIVE' // No futuro, isso seria PENDING aguardando webhook do gateway
      }
    })

    // 2. Cria a trava sagrada de horário
    const recurringSlot = await prisma.recurringSlot.create({
      data: {
        customerId: user.id,
        barberId: barberId,
        dayOfWeek: Number(dayOfWeek),
        time: time
      }
    })

    res.json({
      success: true,
      subscription,
      recurringSlot
    })
  } catch (error) {
    next(error)
  }
})

export default router
