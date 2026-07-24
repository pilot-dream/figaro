export interface TimeSlot {
  startTime: Date
  endTime: Date
  available: boolean
}

export interface BusinessHours {
  start: string // HH:mm
  end: string   // HH:mm
}

export interface AvailabilityQuery {
  date: string // YYYY-MM-DD
  barberId?: string
  serviceDurationMin: number
}
