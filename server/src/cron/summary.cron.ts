import { prisma } from '../lib/prisma'
import { whatsappService } from '../services/whatsapp.service'

/**
 * Envia um resumo diário (e financeiro semanal às segundas) para os barbeiros/donos.
 */
export async function processSummaries() {
  console.log('📊 Executando varredura de Resumo Diário para a equipe...')
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
      phone: string,
      tenantId: string,
      name: string,
      appointmentsCount: number,
      firstApptTime?: string
    }>()

    for (const appt of todayAppointments) {
      if (!appt.barber.phone) continue

      const barberId = appt.barber.id
      const tenantId = appt.barber.role === 'OWNER' ? appt.barber.id : appt.barber.ownerId

      if (!tenantId) continue

      if (!barberMap.has(barberId)) {
        barberMap.set(barberId, {
          phone: appt.barber.phone,
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
      const variables = {
        barber_name: data.name,
        appointment_count: data.appointmentsCount.toString(),
        first_time: data.firstApptTime || '--'
      }

      await whatsappService.sendTemplateMessage(
        data.tenantId,
        data.phone,
        'DAILY_SUMMARY',
        variables
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

      const financialMap = new Map<string, { phone: string, tenantId: string, revenue: number }>()

      for (const appt of lastWeekAppointments) {
        if (!appt.barber.phone) continue

        const tenantId = appt.barber.role === 'OWNER' ? appt.barber.id : appt.barber.ownerId
        if (!tenantId) continue

        if (!financialMap.has(appt.barber.id)) {
          financialMap.set(appt.barber.id, {
            phone: appt.barber.phone,
            tenantId,
            revenue: 0
          })
        }

        const data = financialMap.get(appt.barber.id)!
        data.revenue += appt.totalPrice
      }

      for (const [_, data] of financialMap) {
        const variables = {
          revenue: data.revenue.toFixed(2)
        }

        await whatsappService.sendTemplateMessage(
          data.tenantId,
          data.phone,
          'WEEKLY_FINANCIAL',
          variables
        )
      }
    }

  } catch (error) {
    console.error('❌ Erro no Cron de Resumos:', error)
  }
}
