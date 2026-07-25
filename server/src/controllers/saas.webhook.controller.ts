import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export async function handleCaktoWebhook(req: Request, res: Response) {
  try {
    const { event, data } = req.body

    // Simulando payload padrão da Cakto
    // event: 'invoice.paid' | 'payment_failed' | 'subscription.canceled'
    // data.subscription_id: string
    // data.customer_id: string

    if (!data?.subscription_id) {
      return res.status(400).json({ error: 'Missing subscription_id' })
    }

    const tenant = await prisma.user.findFirst({
      where: { caktoSubscriptionId: data.subscription_id }
    })

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found for this subscription' })
    }

    const now = new Date()

    switch (event) {
      case 'invoice.paid':
        // Pagamento aprovado, renova e limpa pendências
        await prisma.user.update({
          where: { id: tenant.id },
          data: { 
            saasStatus: 'ACTIVE',
            gracePeriodEndsAt: null
          }
        })
        break

      case 'payment_failed':
        // Pagamento falhou, entra em PAST_DUE com 5 dias de carência
        const graceEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
        
        await prisma.user.update({
          where: { id: tenant.id },
          data: { 
            saasStatus: 'PAST_DUE',
            gracePeriodEndsAt: graceEnd
          }
        })
        break

      case 'subscription.canceled':
        await prisma.user.update({
          where: { id: tenant.id },
          data: { saasStatus: 'CANCELED' }
        })
        break
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook Cakto Error:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
