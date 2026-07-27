import cron from 'node-cron'
import { processReminders } from './reminder.cron'
import { processWinbacks } from './winback.cron'
import { processBirthdays } from './birthday.cron'
import { processSummaries } from './summary.cron'

/**
 * Inicializa todos os Cron Jobs no ambiente local / VPS.
 * (No Vercel, essas rotinas são chamadas por API através dos Vercel Cron Jobs)
 */
export function startCronJobs() {
  console.log('🚀 Inicializando Orquestrador de Cron Jobs do Fígaro...')

  // 1. Lembretes (a cada 15 min)
  cron.schedule('*/15 * * * *', async () => {
    await processReminders()
  })

  // 2. Resumo Diário para a equipe (Todos os dias às 07:00)
  cron.schedule('0 7 * * *', async () => {
    await processSummaries()
  })

  // 3. Gatilhos Diários de Clientes (Todos os dias às 09:00)
  // Agrupamos Win-backs e Aniversários na mesma rotina matinal
  cron.schedule('0 9 * * *', async () => {
    await processWinbacks()
    await processBirthdays()
  })
}
