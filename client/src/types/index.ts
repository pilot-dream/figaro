export type Role = 'CLIENT' | 'BARBER' | 'MANAGER'

export interface User {
  id: string
  name: string
  slug?: string
  phone?: string
  email?: string
  role: Role
  avatarUrl?: string
  notes?: string
}

export interface Service {
  id: string
  barberId?: string
  name: string
  description?: string
  durationMin: number
  price: number
  isActive: boolean
  sortOrder: number
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface Appointment {
  id: string
  clientId?: string
  barberId: string
  startTime: string
  endTime: string
  totalPrice: number
  status: AppointmentStatus
  clientName?: string
  clientPhone?: string
  clientNotes?: string
  createdAt?: string
  client?: User
  barber?: User
  services?: Service[]
}

export interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

export interface BlockedTime {
  id: string
  barberId: string
  startTime: string
  endTime: string
  reason?: string
}
