import { prisma } from '../lib/prisma'
import { pushService } from '../services/push.service'

/**
 * Busca clientes que fazem aniversário hoje e dispara notificação push.
 */
export async function processBirthdays() {
  console.log('🎂 Executando varredura de Aniversariantes de Hoje (Push)...')
  try {
    // Busca clientes cujo dia e mês de nascimento coincidem com hoje, 
    // que tenham marketingOptIn e que a barbearia permita aniversários.
    const birthdayClients: any[] = await prisma.$queryRaw`
      SELECT u.id, u.name, u.push_token as "pushToken", u.owner_id as "ownerId"
      FROM profiles u
      INNER JOIN profiles owner ON u.owner_id = owner.id
      INNER JOIN gamification_configs gc ON gc.tenant_id = owner.id
      WHERE 
        EXTRACT(MONTH FROM u.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM u.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
        AND u.marketing_opt_in = true
        AND gc.enable_birthdays = true
        AND u.push_token IS NOT NULL
    `

    for (const client of birthdayClients) {
      if (!client.pushToken) continue

      await pushService.sendNotification(
        client.pushToken,
        'Feliz Aniversário! 🎉',
        `Parabéns, ${client.name}! A barbearia te deseja um excelente dia. Que tal agendar um corte para celebrar?`,
        '/agendar'
      )
    }
  } catch (error) {
    console.error('❌ Erro no Cron de Aniversários (Push):', error)
  }
}
