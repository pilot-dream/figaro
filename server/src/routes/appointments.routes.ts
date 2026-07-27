import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { validateRequest } from '../middleware/validateRequest'
import { bookingRateLimiter } from '../middleware/security.middleware'
import { createBookingBodySchema, availabilityQuerySchema, barberSlugParamsSchema } from '../schemas/booking.schema'
import { AvailabilityService } from '../services/availability.service'

const router = Router()
const prisma = new PrismaClient()
const availabilityService = new AvailabilityService()

/**
 * POST /api/appointments
 * Rota pública de criação de agendamento com:
 * 1. Rate limiting (5 por IP / 15 min)
 * 2. Validação estrita Zod (body)
 */
router.post(
  '/',
  bookingRateLimiter,
  validateRequest({ body: createBookingBodySchema }),
  async (req, res, next) => {
    try {
      const {
        barberId,
        serviceIds,
        startTime,
        clientId,
        clientName,
        clientPhone,
        notes,
        recurringType,
      } = req.body

      // Buscar serviços selecionados para calcular preço e duração no servidor
      // (Regra de Ouro: Backend como fonte da verdade — recalcular, não confiar no client)
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds }, isActive: true },
      })

      if (services.length === 0) {
        return res.status(400).json({ error: 'Nenhum serviço válido selecionado' })
      }

      const totalPrice = services.reduce((acc, s) => acc + s.price, 0)
      const sumDuration = services.reduce((acc, s) => acc + s.durationMin, 0)
      const totalDuration = Math.ceil((sumDuration > 0 ? sumDuration : 45) / 15) * 15

      const startDate = new Date(startTime)
      const endDate = new Date(startDate.getTime() + totalDuration * 60000)

      // Verificar se o barbeiro existe
      const barber = await prisma.user.findUnique({ where: { id: barberId } })
      if (!barber || barber.role !== 'BARBER') {
        return res.status(404).json({ error: 'Barbeiro não encontrado' })
      }

      // Verificar conflito de horário (double-booking)
      const conflict = await prisma.appointment.findFirst({
        where: {
          barberId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startTime: { lt: endDate },
          endTime: { gt: startDate },
        },
      })

      if (conflict) {
        return res.status(409).json({ error: 'Este horário já está ocupado' })
      }

      // Check MRR recurring slot conflict
      const dayOfWeek = startDate.getDay();
      const recurringSlots = await prisma.recurringSlot.findMany({
        where: {
          barberId,
          dayOfWeek,
          customer: { subscriptions: { some: { status: 'ACTIVE' } } }
        },
        include: { exceptions: { where: { originalDate: startDate.toISOString().split('T')[0] } } }
      });

      for (const rSlot of recurringSlots) {
        if (rSlot.exceptions.length === 0) {
          const [hours, minutes] = rSlot.time.split(':').map(Number);
          const rStart = new Date(startDate);
          rStart.setHours(hours, minutes, 0, 0);
          const rEnd = new Date(rStart.getTime() + 60 * 60000); // 1 hr default block
          
          if (startDate < rEnd && endDate > rStart) {
            return res.status(409).json({ error: 'Horário reservado para assinante do Clube' });
          }
        }
      }

      // Criar agendamento
      const appointment = await prisma.appointment.create({
        data: {
          clientId: clientId || null,
          barberId,
          startTime: startDate,
          endTime: endDate,
          totalPrice,
          status: 'CONFIRMED',
          clientName,
          clientPhone,
          clientNotes: notes || '',
        },
      })

      // Criar relações com serviços
      if (serviceIds.length > 0) {
        await prisma.appointmentService.createMany({
          data: serviceIds.map((serviceId: string) => ({
            appointmentId: appointment.id,
            serviceId,
          })),
        })
      }

      res.status(201).json({
        success: true,
        appointment,
        recurringType, // Retorna ao client para futura implementação backend
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
