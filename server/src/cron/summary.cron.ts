import { prisma } from '../lib/prisma'
import { pushService } from '../services/push.service'

/**
 * Envia um resumo diário (e financeiro semanal às segundas) para os barbeiros/donos via Push.
 */
export async function processSummaries() {
  console.log('📊 Executando varredura de Resumo Diário para a equipe (Push)...')
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const isMonday = today.getDay() === 1

    // Buscar agendamentos de hoje
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: today,
          lte: endOfDay
        },
        status: { in: ['CONFIRMED', 'PENDING'] }
      },
      include: {
        barber: true
      }
    })

    // Agrupar por barbeiro
    const barberMap = new Map<string, {
      pushToken: string,
      tenantId: string,
      name: string,
      appointmentsCount: number,
      firstApptTime?: string
    }>()

    for (const appt of todayAppointments) {
      if (!appt.barber.pushToken) continue

      const barberId = appt.barber.id
      const tenantId = appt.barber.role === 'OWNER' ? appt.barber.id : appt.barber.ownerId

      if (!tenantId) continue

      if (!barberMap.has(barberId)) {
        barberMap.set(barberId, {
          pushToken: appt.barber.pushToken,
          tenantId: tenantId,
          name: appt.barber.name,
          appointmentsCount: 0
        })
      }

      const data = barberMap.get(barberId)!
      data.appointmentsCount++
      
      const apptTime = new Date(appt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      if (!data.firstApptTime || apptTime < data.firstApptTime) {
        data.firstApptTime = apptTime
      }
    }

    // Enviar mensagens diárias
    for (const [_, data] of barberMap) {
      await pushService.sendNotification(
        data.pushToken,
        'Resumo do Dia 📊',
        `Olá ${data.name}! Você tem ${data.appointmentsCount} agendamentos hoje. O primeiro é às ${data.firstApptTime || '--'}.`,
        '/painel'
      )
    }

    // Se for segunda-feira, envia um fechamento financeiro da semana anterior
    if (isMonday) {
      const startOfLastWeek = new Date(today)
      startOfLastWeek.setDate(today.getDate() - 7)
      const endOfLastWeek = new Date(today)
      endOfLastWeek.setDate(today.getDate() - 1)
      endOfLastWeek.setHours(23, 59, 59, 999)

      const lastWeekAppointments = await prisma.appointment.findMany({
        where: {
          startTime: {
            gte: startOfLastWeek,
            lte: endOfLastWeek
          },
          status: { in: ['COMPLETED', 'PAID'] }
        },
        include: { barber: true }
      })

      const financialMap = new Map<string, { pushToken: string, tenantId: string, revenue: number }>()

      for (const appt of lastWeekAppointments) {
        if (!appt.barber.pushToken) continue

        const tenantId = appt.barber.role === 'OWNER' ? appt.barber.id : appt.barber.ownerId
        if (!tenantId) continue

        if (!financialMap.has(appt.barber.id)) {
          financialMap.set(appt.barber.id, {
            pushToken: appt.barber.pushToken,
            tenantId,
            revenue: 0
          })
        }

        const data = financialMap.get(appt.barber.id)!
        data.revenue += appt.totalPrice
      }

      for (const [_, data] of financialMap) {
        await pushService.sendNotification(
          data.pushToken,
          'Fechamento Semanal 💰',
          `Sua receita da semana passada foi de R$ ${data.revenue.toFixed(2)}. Bom trabalho!`,
          '/painel'
        )
      }
    }

  } catch (error) {
    console.error('❌ Erro no Cron de Resumos (Push):', error)
  }
}
