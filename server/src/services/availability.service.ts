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
    const targetDate = new Date(date)

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

    // Map through slots and check availability
    return allSlots.map(slot => {
      const slotEnd = new Date(slot.startTime.getTime() + serviceDurationMin * 60000)
      const isAvailable = this.checkSlotAvailability(
        slot.startTime,
        slotEnd,
        appointments,
        blockedTimes
      )
      
      // Also check if slot + service duration exceeds business hours
      const businessEndHours = parseInt(this.businessHours.end.split(':')[0])
      const businessEndMins = parseInt(this.businessHours.end.split(':')[1])
      const businessEnd = new Date(targetDate)
      businessEnd.setHours(businessEndHours, businessEndMins, 0, 0)
      
      return {
        ...slot,
        available: isAvailable && slotEnd <= businessEnd
      }
    }).filter(s => s.available)
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
