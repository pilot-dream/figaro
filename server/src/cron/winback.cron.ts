import { prisma } from '../lib/prisma'
import { pushService } from '../services/push.service'

/**
 * Busca clientes que não visitam a barbearia há exatamente 30, 60 ou 90 dias
 * e envia uma mensagem de reativação (Win-back) via Push Notification.
 */
export async function processWinbacks() {
  console.log('🔄 Executando varredura de Win-back (Push)...')
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
          pushToken: { not: null },
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
        if (!client.pushToken) continue

        let message = ''
        if (days === 30) {
          message = `Oi ${client.name}, já faz um mês desde o seu último corte. Que tal agendar um horário?`
        } else if (days === 60) {
          message = `${client.name}, seu cabelo já deve estar grande! 😅 Bora dar aquele trato?`
        } else if (days === 90) {
          message = `Estamos sentindo sua falta, ${client.name}! Volte e garanta o seu estilo em dia.`
        }

        await pushService.sendNotification(
          client.pushToken,
          'Saudades de Você! 💈',
          message,
          '/agendar'
        )
      }
    }
  } catch (error) {
    console.error('❌ Erro no Cron de Winback (Push):', error)
  }
}
