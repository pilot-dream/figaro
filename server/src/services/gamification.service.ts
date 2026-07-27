import { PrismaClient, CustomerTier } from '@prisma/client';

const prisma = new PrismaClient();

export class GamificationService {
  /**
   * Conclui um agendamento e executa o processamento de gamificação e fidelidade de forma atômica.
   * @param appointmentId ID do agendamento a ser concluído.
   */
  async completeAppointment(appointmentId: string) {
    // 1. Busca os dados primários do agendamento
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        barber: {
          include: {
            gamificationConfig: true
          }
        },
        client: true
      }
    });

    if (!appointment) {
      throw new Error('Agendamento não encontrado.');
    }

    if (appointment.status === 'COMPLETED' || appointment.status === 'PAID') {
      throw new Error('Agendamento já está concluído.');
    }

    // Identificar a qual Tenant pertence esta barbearia para ler a GamificationConfig
    // Como barbers podem ter owners, ou ser owners
    let tenantId = appointment.barber.role === 'OWNER' ? appointment.barber.id : appointment.barber.ownerId;
    
    if (!tenantId) {
      throw new Error('Tenant ID não encontrado para esta barbearia.');
    }

    const config = await prisma.gamificationConfig.findUnique({
      where: { tenantId }
    });

    // Fallbacks para as configurações caso o tenant não tenha salvado nada ainda
    const pointsPerCurrency = config?.pointsPerCurrency ?? 1.0;
    const referralRewardValue = config?.referralRewardValue ?? 0;
    const enableReferrals = config?.enableReferrals ?? true;

    // Iniciar a transação
    return await prisma.$transaction(async (tx) => {
      // 1. Atualizar o Agendamento
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' }
      });

      // 2. Se não tem cliente atrelado (guest), não há gamificação para ele
      if (!appointment.clientId || !appointment.client) {
        return { success: true, updatedAppointment };
      }

      const client = appointment.client;
      const now = new Date();
      const totalPrice = appointment.totalPrice;
      const pointsEarned = Math.floor(totalPrice * pointsPerCurrency);

      // Calcular novas métricas
      const isFirstVisit = client.firstVisitAt === null;
      const newVisitCount = client.visitCount + 1;
      const newTotalSpent = client.totalSpent + totalPrice;

      // Definir Tier usando regras vitalícias
      let newTier = client.tier;
      if (newVisitCount >= 12 || newTotalSpent >= 1500) {
        newTier = CustomerTier.NAVALHA_DE_OURO;
      } else if (newVisitCount >= 6 || newTotalSpent >= 800) {
        newTier = CustomerTier.VIP;
      } else if (newVisitCount >= 3 || newTotalSpent >= 300) {
        newTier = CustomerTier.FIEL;
      } else {
        newTier = CustomerTier.NOVATO;
      }

      // 3. Atualizar Perfil do Cliente
      await tx.user.update({
        where: { id: client.id },
        data: {
          visitCount: newVisitCount,
          totalSpent: newTotalSpent,
          pointsBalance: { increment: pointsEarned },
          lastVisitAt: now,
          firstVisitAt: isFirstVisit ? now : client.firstVisitAt,
          tier: newTier
        }
      });

      // 4. Gatilho de Indicação (Referral Reward)
      // O prêmio só é concedido após o PRIMEIRO corte pago.
      if (isFirstVisit && enableReferrals && client.referredById) {
        // Verifica se a indicação ainda está pendente
        const pendingReferral = await tx.referralHistory.findUnique({
          where: { referredId: client.id }
        });

        if (pendingReferral && pendingReferral.status === 'PENDING') {
          // Atualiza status para REWARDED
          await tx.referralHistory.update({
            where: { id: pendingReferral.id },
            data: { 
              status: 'REWARDED',
              rewardedAt: now
            }
          });

          // Dá os pontos de recompensa para o indicador (referrer)
          if (referralRewardValue > 0) {
            await tx.user.update({
              where: { id: pendingReferral.referrerId },
              data: {
                pointsBalance: { increment: referralRewardValue }
              }
            });
          }
        }
      }

      return {
        success: true,
        updatedAppointment,
        gamification: {
          pointsEarned,
          newTier,
          tierUpgraded: newTier !== client.tier,
          isFirstVisit
        }
      };
    });
  }
}
