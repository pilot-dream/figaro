import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function processAutoCompletes() {
  console.log('[CRON] Iniciando auto-complete de agendamentos passados...')
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const result = await prisma.appointment.updateMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        startTime: { lt: oneHourAgo }
      },
      data: {
        status: 'COMPLETED'
      }
    })

    if (result.count > 0) {
      console.log(`[CRON] ${result.count} agendamentos antigos foram marcados como COMPLETED automaticamente.`)
    } else {
      console.log('[CRON] Nenhum agendamento para auto-completar agora.')
    }
  } catch (error) {
    console.error('[CRON] Erro no auto-complete:', error)
  }
}
