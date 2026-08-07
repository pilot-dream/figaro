import cron from 'node-cron'
import { prisma } from '../lib/prisma'
import { pushService } from '../services/push.service'

/**
 * Função principal que processa os lembretes (Exportada para ser chamada via API no Vercel)
 */
export async function processReminders() {
  try {
    console.log('🔄 Executando varredura de lembretes...')
    const now = new Date()
    
    // Calculate time windows
    const in24hStart = new Date(now.getTime() + 23.75 * 60 * 60 * 1000)
    const in24hEnd = new Date(now.getTime() + 24.25 * 60 * 60 * 1000)
    
    const in2hStart = new Date(now.getTime() + 1.75 * 60 * 60 * 1000)
    const in2hEnd = new Date(now.getTime() + 2.25 * 60 * 60 * 1000)

    // 1. Processar lembretes de 24h
    const appointments24h = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        pushReminder24hSent: false,
        startTime: {
          gte: in24hStart,
          lte: in24hEnd
        }
      },
      include: {
        client: true,
        barber: true,
        services: { include: { service: true } }
      }
    })

    for (const appt of appointments24h) {
      const updateData: any = {}

      // Web Push Notification
      if (!appt.pushReminder24hSent) {
        if (appt.client && appt.client.pushToken) {
          const time = new Date(appt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          const date = new Date(appt.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          try {
            await pushService.sendNotification(
              appt.client.pushToken,
              'Lembrete de Agendamento ✂️',
              `Você tem um horário com ${appt.barber.name} amanhã (${date}) às ${time}.`,
              '/meus-agendamentos'
            )
          } catch (error) {
            console.error(`[Push 24h] Erro ao enviar para o cliente ${appt.clientId}:`, error)
          }
        }
        // Sempre marca como processado para não cair no loop do cron novamente
        updateData.pushReminder24hSent = true
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: updateData
        })
      }
    }

    // 2. Processar lembretes de 2h
    const appointments2h = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        pushReminder2hSent: false,
        startTime: {
          gte: in2hStart,
          lte: in2hEnd
        }
      },
      include: {
        client: true,
        barber: true,
        services: { include: { service: true } }
      }
    })

    for (const appt of appointments2h) {
      const updateData: any = {}

      // Web Push Notification
      if (!appt.pushReminder2hSent) {
        if (appt.client && appt.client.pushToken) {
          const time = new Date(appt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          try {
            await pushService.sendNotification(
              appt.client.pushToken,
              'Seu horário está chegando! ⏳',
              `Seu corte com ${appt.barber.name} é hoje às ${time}. Não se atrase!`,
              '/meus-agendamentos'
            )
          } catch (error) {
            console.error(`[Push 2h] Erro ao enviar para o cliente ${appt.clientId}:`, error)
          }
        }
        // Sempre marca como processado para não cair no loop do cron novamente
        updateData.pushReminder2hSent = true
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: updateData
        })
      }
    }

  } catch (error) {
    console.error('❌ Erro no Cron de Lembretes:', error)
    throw error
  }
}

/**
 * Inicia o Cron Job local para ambientes de desenvolvimento ou VPS tradicionais.
 */
export function startReminderCron() {
  console.log('⏳ Inicializando Cron Job de Lembretes (a cada 15 min)...')

  cron.schedule('*/15 * * * *', async () => {
    await processReminders()
  })
}
