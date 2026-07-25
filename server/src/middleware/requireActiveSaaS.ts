import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

export async function requireActiveSaaS(req: Request, res: Response, next: NextFunction) {
  try {
    // A requisição já deve ter passado pelo authenticateToken (que popula req.user)
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Buscamos o tenant raiz (OWNER) correspondente ao usuário logado
    // Se o usuário logado FOR o owner, pegamos ele mesmo. Se for BARBER/MANAGER, pegamos o ownerId dele.
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, ownerId: true }
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const tenantId = user.role === 'OWNER' ? req.user.userId : user.ownerId

    if (!tenantId) {
      // Se não tem ownerId e não é Owner, algo está errado na modelagem. Mas deixamos passar por via das dúvidas ou barramos.
      // Assumindo que CLIENTS não chegam aqui (pois esta middleware é para proteger rotas da barbearia)
      return next()
    }

    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      select: { saasStatus: true, trialEndsAt: true, gracePeriodEndsAt: true }
    })

    if (!tenant) return next()

    const now = new Date()

    // Regra 1: CANCELED -> Bloqueio imediato
    if (tenant.saasStatus === 'CANCELED') {
      return res.status(403).json({ error: 'SaaS Blocked: Subscription Canceled', saas_blocked: true })
    }

    // Regra 2: TRIAL expirou -> Bloqueio
    if (tenant.saasStatus === 'TRIAL' && tenant.trialEndsAt && now > tenant.trialEndsAt) {
      return res.status(403).json({ error: 'SaaS Blocked: Trial Expired', saas_blocked: true })
    }

    // Regra 3: PAST_DUE (Pagamento Falhou) e Período de Graça expirou -> Bloqueio
    if (tenant.saasStatus === 'PAST_DUE' && tenant.gracePeriodEndsAt && now > tenant.gracePeriodEndsAt) {
      return res.status(403).json({ error: 'SaaS Blocked: Grace Period Expired', saas_blocked: true })
    }

    // Se chegou aqui, está tudo certo (ACTIVE, ou TRIAL válido, ou PAST_DUE dentro do período de graça)
    next()
  } catch (error) {
    console.error('requireActiveSaaS Error:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
