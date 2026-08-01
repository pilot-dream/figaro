export type Role = 'CLIENT' | 'OWNER' | 'MANAGER' | 'BARBER'

export interface User {
  id: string
  name: string
  slug?: string
  phone?: string
  email?: string
  role: Role
  avatarUrl?: string
  bannerImageUrl?: string
  specialty?: string
  notes?: string
  googleEmail?: string
  googleSyncEnabled?: boolean
  googleSyncBusyTimes?: boolean
  
  whatsappInstanceId?: string
  whatsappStatus?: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'
  whatsappEnabled?: boolean
  whatsappReminder24h?: boolean
  whatsappReminder2h?: boolean
  whatsappTemplateBase?: string

  // Comissionamento e Assinatura
  commissionType?: 'PERCENTAGE' | 'FIXED'
  commissionValue?: number
  subscriptionPlan?: string
  saasStatus?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
  trialEndsAt?: string
  gracePeriodEndsAt?: string
  caktoCustomerId?: string
  caktoSubscriptionId?: string

  // Enterprise: Hierarquia Matriz/Filial
  parentId?: string
  branchName?: string
  
  businessHours?: any
  slotInterval?: number
  loyaltyPoints?: number
  tier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'BLACK'
}

export interface Branch {
  id: string
  name: string
  branchName?: string
  slug?: string
  teamCount?: number
  appointmentCount?: number
}

export interface FinanceSummary {
  grossRevenue: number
  totalCommissions: number
  netRevenue: number
  totalAppointments: number
  barberBreakdown?: BarberFinance[]
  myCommission?: number
}

export interface BarberFinance {
  barberId: string
  barberName: string
  avatarUrl?: string
  totalRevenue: number
  commissionType: string
  commissionValue: number
  commissionAmount: number
  appointmentCount: number
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
  imageUrl?: string
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
  startTime: string // ISO string
  endTime: string // ISO string
  available: boolean
  barberId?: string // assigned barber if any
}

export interface BlockedTime {
  id: string
  barberId: string
  startTime: string
  endTime: string
  reason?: string
}
