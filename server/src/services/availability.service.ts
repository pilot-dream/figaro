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

    let slotInterval = 15
    let dayConfig: any = null
    let barber: any = null

    if (barberId) {
      barber = await prisma.user.findUnique({
        where: { id: barberId },
        select: { businessHours: true, slotInterval: true, googleSyncBusyTimes: true, googleRefreshToken: true }
      })
      
      if (barber) {
        if (barber.slotInterval) slotInterval = barber.slotInterval
        
        if (barber.businessHours && Array.isArray(barber.businessHours)) {
          // Frontend array order: Mon, Tue, Wed, Thu, Fri, Sat, Sun
          // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
          const dayIndexMap: Record<number, number> = {
            1: 0, // Mon
            2: 1, // Tue
            3: 2, // Wed
            4: 3, // Thu
            5: 4, // Fri
            6: 5, // Sat
            0: 6  // Sun
          }
          const jsDay = targetDate.getDay()
          const mappedIndex = dayIndexMap[jsDay]
          dayConfig = barber.businessHours[mappedIndex]
        }
      }
    }
    
    // Fallback if no config
    if (!dayConfig) {
      dayConfig = { active: true, open: '09:00', close: '20:00', lunch: '12:00 - 13:00' }
    }

    if (!dayConfig.active) {
      return [] // Fully booked / closed
    }

    // Generate all possible slots for the day
    const allSlots = this.generateSlots(targetDate, slotInterval, dayConfig.open, dayConfig.close)

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
    if (barber?.googleSyncBusyTimes && barber.googleRefreshToken) {
      const { googleCalendarService } = await import('./googleCalendar.service')
      const busySlots = await googleCalendarService.getBusySlots(barber.googleRefreshToken, date)
      
      googleBusyTimes = busySlots.map(slot => ({
        startTime: new Date(slot.start || ''),
        endTime: new Date(slot.end || '')
      })).filter(slot => !isNaN(slot.startTime.getTime()) && !isNaN(slot.endTime.getTime()))
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

    // Add lunch break to blocked times
    let lunchBlockedTimes: any[] = []
    if (dayConfig.lunch && dayConfig.lunch.includes('-')) {
      const [lunchStart, lunchEnd] = dayConfig.lunch.split('-').map((s: string) => s.trim())
      const [lStartHour, lStartMin] = lunchStart.split(':').map(Number)
      const [lEndHour, lEndMin] = lunchEnd.split(':').map(Number)
      
      const lunchStartTime = new Date(targetDate)
      lunchStartTime.setHours(lStartHour, lStartMin, 0, 0)
      
      const lunchEndTime = new Date(targetDate)
      lunchEndTime.setHours(lEndHour, lEndMin, 0, 0)
      
      lunchBlockedTimes.push({ startTime: lunchStartTime, endTime: lunchEndTime })
    }

    // Combine local blocked times with google busy times and MRR recurring slots
    const allBlockedTimes = [...blockedTimes, ...googleBusyTimes, ...recurringBlockedTimes, ...lunchBlockedTimes]

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
      const businessEndHours = parseInt(dayConfig.close.split(':')[0])
      const businessEndMins = parseInt(dayConfig.close.split(':')[1])
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

  private generateSlots(date: Date, intervalMin: number, openTime: string, closeTime: string): TimeSlot[] {
    const slots: TimeSlot[] = []
    const [startHour, startMin] = openTime.split(':').map(Number)
    const [endHour, endMin] = closeTime.split(':').map(Number)

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
