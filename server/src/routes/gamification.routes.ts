import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

/**
 * GET /api/gamification/config
 * Retorna as configurações de gamificação do tenant (OWNER).
 * Se não existir, cria uma default.
 */
router.get('/config', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    
    // Permitir OWNER, MANAGER e BARBER
    if (user.role !== 'OWNER' && user.role !== 'MANAGER' && user.role !== 'BARBER') {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    const tenantId = (user.role === 'OWNER' || !user.ownerId) ? user.id : user.ownerId

    let config = await prisma.gamificationConfig.findUnique({
      where: { tenantId }
    })

    if (!config) {
      config = await prisma.gamificationConfig.create({
        data: { tenantId }
      })
    }

    res.json(config)
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/gamification/config
 * Atualiza as configurações de gamificação do tenant (OWNER).
 */
router.put('/config', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!
    
    // Permitir OWNER, MANAGER e BARBER
    if (user.role !== 'OWNER' && user.role !== 'MANAGER' && user.role !== 'BARBER') {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    const tenantId = (user.role === 'OWNER' || !user.ownerId) ? user.id : user.ownerId

    const {
      enableBirthdays,
      enableWinBacks,
      enableReferrals,
      pointsPerCurrency,
      signupDiscountValue,
      referralRewardValue
    } = req.body

    console.log('PUT /config called by:', user.id, 'with body:', req.body);
    console.log('Tenant ID resolved to:', tenantId);

    const config = await prisma.gamificationConfig.upsert({
      where: { tenantId: tenantId },
      update: {
        enableBirthdays,
        enableWinBacks,
        enableReferrals,
        pointsPerCurrency,
        signupDiscountValue,
        referralRewardValue
      },
      create: {
        tenantId: tenantId,
        enableBirthdays,
        enableWinBacks,
        enableReferrals,
        pointsPerCurrency,
        signupDiscountValue,
        referralRewardValue
      }
    })

    res.json(config)
  } catch (error) {
    next(error)
  }
})

export default router
