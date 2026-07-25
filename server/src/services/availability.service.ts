import { PrismaClient } from '@prisma/client'
import { TimeSlot, BusinessHours, AvailabilityQuery } from '../types'

const prisma = new PrismaClient()

export class AvailabilityService {
  private readonly businessHours: BusinessHours = {
    start: '09:00',
    end: '20:00'
  }

  async getAvailability(query: AvailabilityQuery): Promise<TimeSlot[]> {
    const { date, barberId, serviceDurationMin } = query
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day); // Ensures midnight in LOCAL time

    // Generate all possible slots for the day
    const allSlots = this.generateSlots(targetDate, 15)

    // Find conflicting appointments
    const whereClause: any = {
      startTime: {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setHours(23, 59, 59, 999))
      },
      status: {
        notIn: ['CANCELLED']
      }
    }

    if (barberId) {
      whereClause.barberId = barberId
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause
    })

    // Find blocked times
    const blockedWhereClause: any = {
      startTime: {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setHours(23, 59, 59, 999))
      }
    }
    if (barberId) {
      blockedWhereClause.barberId = barberId
    }

    const blockedTimes = await prisma.blockedTime.findMany({
      where: blockedWhereClause
    })

    // Fetch Google Calendar busy slots if enabled
    let googleBusyTimes: any[] = []
    if (barberId) {
      const barber = await prisma.user.findUnique({
        where: { id: barberId },
        select: { googleSyncBusyTimes: true, googleRefreshToken: true }
      })

      if (barber?.googleSyncBusyTimes && barber.googleRefreshToken) {
        const { googleCalendarService } = await import('./googleCalendar.service')
        const busySlots = await googleCalendarService.getBusySlots(barber.googleRefreshToken, date)
        
        googleBusyTimes = busySlots.map(slot => ({
          startTime: new Date(slot.start || ''),
          endTime: new Date(slot.end || '')
        })).filter(slot => !isNaN(slot.startTime.getTime()) && !isNaN(slot.endTime.getTime()))
      }
    }

    // Fetch Recurring Slots (MRR) for the day
    const dayOfWeek = targetDate.getDay();
    const dateString = targetDate.toISOString().split('T')[0];
    let recurringBlockedTimes: any[] = [];
    
    if (barberId) {
      const recurringSlots = await prisma.recurringSlot.findMany({
        where: {
          barberId,
          dayOfWeek,
          customer: {
            subscriptions: {
              some: { status: 'ACTIVE' }
            }
          }
        },
        include: {
          exceptions: {
            where: { originalDate: dateString }
          }
        }
      });
      
      for (const rSlot of recurringSlots) {
        const hasException = rSlot.exceptions.length > 0;
        if (!hasException) {
          const [hours, minutes] = rSlot.time.split(':').map(Number);
          const start = new Date(targetDate);
          start.setHours(hours, minutes, 0, 0);
          const end = new Date(start.getTime() + (serviceDurationMin || 60) * 60000);
          recurringBlockedTimes.push({ startTime: start, endTime: end });
        }
      }
      
      const exceptionsRescheduledToToday = await prisma.slotException.findMany({
        where: {
          newDate: dateString,
          status: 'RESCHEDULED',
          recurringSlot: {
            barberId,
            customer: {
              subscriptions: { some: { status: 'ACTIVE' } }
            }
          }
        }
      });
      
      for (const exc of exceptionsRescheduledToToday) {
        if (exc.newTime) {
          const [hours, minutes] = exc.newTime.split(':').map(Number);
          const start = new Date(targetDate);
          start.setHours(hours, minutes, 0, 0);
          const end = new Date(start.getTime() + (serviceDurationMin || 60) * 60000);
          recurringBlockedTimes.push({ startTime: start, endTime: end });
        }
      }
    }

    // Combine local blocked times with google busy times and MRR recurring slots
    const allBlockedTimes = [...blockedTimes, ...googleBusyTimes, ...recurringBlockedTimes]

    const now = new Date()

    // Map through slots and check availability
    return allSlots.map(slot => {
      const slotEnd = new Date(slot.startTime.getTime() + serviceDurationMin * 60000)
      const isAvailable = this.checkSlotAvailability(
        slot.startTime,
        slotEnd,
        appointments,
        allBlockedTimes
      )
      
      // Also check if slot + service duration exceeds business hours
      const businessEndHours = parseInt(this.businessHours.end.split(':')[0])
      const businessEndMins = parseInt(this.businessHours.end.split(':')[1])
      const businessEnd = new Date(targetDate)
      businessEnd.setHours(businessEndHours, businessEndMins, 0, 0)
      
      // Check if slot is in the past
      const isPast = slot.startTime < now

      return {
        ...slot,
        available: isAvailable && slotEnd <= businessEnd && !isPast
      }
    })
  }

  private generateSlots(date: Date, intervalMin: number): TimeSlot[] {
    const slots: TimeSlot[] = []
    const [startHour, startMin] = this.businessHours.start.split(':').map(Number)
    const [endHour, endMin] = this.businessHours.end.split(':').map(Number)

    let current = new Date(date)
    current.setHours(startHour, startMin, 0, 0)

    const end = new Date(date)
    end.setHours(endHour, endMin, 0, 0)

    while (current < end) {
      const next = new Date(current.getTime() + intervalMin * 60000)
      slots.push({
        startTime: new Date(current),
        endTime: new Date(next),
        available: true
      })
      current = next
    }

    return slots
  }

  private checkSlotAvailability(
    slotStart: Date,
    slotEnd: Date,
    appointments: any[],
    blockedTimes: any[]
  ): boolean {
    const collidesWithAppointment = appointments.some(app => 
      (slotStart >= app.startTime && slotStart < app.endTime) ||
      (slotEnd > app.startTime && slotEnd <= app.endTime) ||
      (slotStart <= app.startTime && slotEnd >= app.endTime)
    )

    if (collidesWithAppointment) return false

    const collidesWithBlock = blockedTimes.some(block => 
      (slotStart >= block.startTime && slotStart < block.endTime) ||
      (slotEnd > block.startTime && slotEnd <= block.endTime) ||
      (slotStart <= block.startTime && slotEnd >= block.endTime)
    )

    return !collidesWithBlock
  }
}
