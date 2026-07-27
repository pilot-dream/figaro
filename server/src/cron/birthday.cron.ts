import { prisma } from '../lib/prisma'
import { whatsappService } from '../services/whatsapp.service'

/**
 * Busca clientes que fazem aniversário hoje e dispara mensagem via WhatsApp.
 */
export async function processBirthdays() {
  console.log('🎂 Executando varredura de Aniversariantes de Hoje...')
  try {
    // Busca clientes cujo dia e mês de nascimento coincidem com hoje, 
    // que tenham marketingOptIn e que a barbearia permita aniversários.
    // Como Prisma não tem uma função de Date part nativa no findMany, usamos queryRaw.
    const birthdayClients: any[] = await prisma.$queryRaw`
      SELECT u.id, u.name, u.phone, u.owner_id as "ownerId"
      FROM profiles u
      INNER JOIN profiles owner ON u.owner_id = owner.id
      INNER JOIN gamification_configs gc ON gc.tenant_id = owner.id
      WHERE 
        EXTRACT(MONTH FROM u.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM u.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
        AND u.marketing_opt_in = true
        AND gc.enable_birthdays = true
        AND u.phone IS NOT NULL
    `

    for (const client of birthdayClients) {
      if (!client.ownerId || !client.phone) continue

      const variables = {
        client_name: client.name
      }

      await whatsappService.sendTemplateMessage(
        client.ownerId,
        client.phone,
        'HAPPY_BIRTHDAY',
        variables
      )
    }
  } catch (error) {
    console.error('❌ Erro no Cron de Aniversários:', error)
  }
}
