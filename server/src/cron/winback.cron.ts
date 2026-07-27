import { prisma } from '../lib/prisma'
import { whatsappService } from '../services/whatsapp.service'

/**
 * Busca clientes que não visitam a barbearia há exatamente 30, 60 ou 90 dias
 * e envia uma mensagem de reativação (Win-back).
 */
export async function processWinbacks() {
  console.log('🔄 Executando varredura de Win-back (Reativação de Clientes)...')
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const daysToCheck = [30, 60, 90]

    for (const days of daysToCheck) {
      const targetDateStart = new Date(today)
      targetDateStart.setDate(targetDateStart.getDate() - days)
      
      const targetDateEnd = new Date(targetDateStart)
      targetDateEnd.setHours(23, 59, 59, 999)

      const inactiveUsers = await prisma.user.findMany({
        where: {
          lastVisitAt: {
            gte: targetDateStart,
            lte: targetDateEnd
          },
          marketingOptIn: true,
          owner: {
            gamificationConfig: {
              enableWinBacks: true
            }
          }
        },
        include: {
          owner: true
        }
      })

      for (const client of inactiveUsers) {
        if (!client.phone || !client.ownerId) continue

        const variables = {
          client_name: client.name,
          days_inactive: days.toString()
        }

        await whatsappService.sendTemplateMessage(
          client.ownerId,
          client.phone,
          `WINBACK_${days}`,
          variables
        )
      }
    }
  } catch (error) {
    console.error('❌ Erro no Cron de Winback:', error)
  }
}
