import { supabase } from '@/lib/supabase'
import type { Service, User, TimeSlot, Appointment, AppointmentStatus } from '@/types'

export { supabase }

// ==========================================
// SEED DEFAULT DATA IF SUPABASE TABLES ARE EMPTY
// ==========================================
const DEFAULT_SERVICES = [
  {
    name: 'Corte Figaro Signature',
    description: 'Corte tesoura/máquina com lavagem especial, finalização e massagem capilar.',
    duration_min: 45,
    price: 75.0,
    is_active: true,
    sort_order: 1,
  },
  {
    name: 'Barba Terapia com Toalha Quente',
    description: 'Modelagem de barba com óleo essencial, toalha aquecida e massagem facial.',
    duration_min: 30,
    price: 55.0,
    is_active: true,
    sort_order: 2,
  },
  {
    name: 'Combo Imperial (Corte + Barba)',
    description: 'Experiência completa de corte e barba com alinhamento de sobrancelha cortesia.',
    duration_min: 70,
    price: 115.0,
    is_active: true,
    sort_order: 3,
  },
  {
    name: 'Acabamento & Pezinho',
    description: 'Manutenção de contornos, nuca e nuca limpa com navalha afiada.',
    duration_min: 20,
    price: 30.0,
    is_active: true,
    sort_order: 4,
  },
]

// ==========================================
// SERVICES API
// ==========================================
export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching services:', error.message)
    return []
  }

  // Auto-seed default services if DB table is empty
  if (!data || data.length === 0) {
    const { data: inserted } = await supabase
      .from('services')
      .insert(DEFAULT_SERVICES)
      .select('*')

    if (inserted) {
      return inserted.map(mapServiceFromDb)
    }
  }

  return (data || []).map(mapServiceFromDb)
}

function mapServiceFromDb(row: any): Service {
  return {
    id: row.id,
    barberId: row.barber_id || undefined,
    name: row.name,
    description: row.description || undefined,
    durationMin: row.duration_min,
    price: Number(row.price),
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }
}

// ==========================================
// BARBERS API
// ==========================================
export async function fetchBarbers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'BARBER')

  if (error) {
    console.error('Error fetching barbers:', error.message)
    return []
  }

  return (data || []).map(mapUserFromDb)
}

export async function fetchBarberBySlug(
  slug: string
): Promise<{ barber: User; services: Service[] }> {
  const { data: barberData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !barberData) {
    throw new Error('Barbeiro não encontrado')
  }

  const barber = mapUserFromDb(barberData)
  const services = await fetchServices()

  return { barber, services }
}

function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || undefined,
    phone: row.phone || undefined,
    role: row.role,
    avatarUrl: row.avatar_url || undefined,
    notes: row.notes || undefined,
  }
}

// ==========================================
// AVAILABILITY SLOTS COMPUTATION (BRASÍLIA TIMEZONE UTC-3)
// ==========================================
export async function fetchAvailability(
  dateStr: string, // YYYY-MM-DD
  rawDurationMin: number,
  barberId?: string
): Promise<TimeSlot[]> {
  // Round up service duration to nearest multiple of 15 minutes (e.g., 26m, 38m, 44m -> 45m)
  const durationMin = Math.ceil((rawDurationMin || 45) / 15) * 15

  // ISO with Brasilia Offset (-03:00)
  const startOfDay = new Date(`${dateStr}T00:00:00-03:00`).toISOString()
  const endOfDay = new Date(`${dateStr}T23:59:59-03:00`).toISOString()

  // 1. Fetch appointments for this date
  let query = supabase
    .from('appointments')
    .select('start_time, end_time, status')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .neq('status', 'CANCELLED')

  if (barberId) {
    query = query.eq('barber_id', barberId)
  }

  const { data: appData } = await query

  // 2. Fetch blocked times for this date
  let blockQuery = supabase
    .from('blocked_times')
    .select('start_time, end_time')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)

  if (barberId) {
    blockQuery = blockQuery.eq('barber_id', barberId)
  }

  const { data: blockData } = await blockQuery

  const busyIntervals = [
    ...(appData || []).map((a) => ({
      start: new Date(a.start_time).getTime(),
      end: new Date(a.end_time).getTime(),
    })),
    ...(blockData || []).map((b) => ({
      start: new Date(b.start_time).getTime(),
      end: new Date(b.end_time).getTime(),
    })),
  ]

  // Business Hours 09:00 to 20:00 in Horário de Brasília (-03:00)
  const slots: TimeSlot[] = []
  const baseTime = new Date(`${dateStr}T09:00:00-03:00`).getTime()
  const closeTime = new Date(`${dateStr}T20:00:00-03:00`).getTime()

  let currentCursor = baseTime

  // Generate 15-minute grid slots (09:00, 09:15, 09:30, 09:45, 10:00, 10:15, 10:30...)
  while (currentCursor + durationMin * 60000 <= closeTime) {
    const slotStart = currentCursor
    const slotEnd = slotStart + durationMin * 60000

    // Strict overlap rule: proposed slot [slotStart, slotEnd) overlaps with busy interval [busy.start, busy.end)
    // if slotStart < busy.end AND slotEnd > busy.start
    const isOccupied = busyIntervals.some(
      (busy) => slotStart < busy.end && slotEnd > busy.start
    )

    slots.push({
      startTime: new Date(slotStart).toISOString(),
      endTime: new Date(slotEnd).toISOString(),
      available: !isOccupied,
    })

    // Advance by 15 minutes to guarantee exact 09:45, 10:00, 10:15... grid slots
    currentCursor += 15 * 60000
  }

  return slots
}

// ==========================================
// APPOINTMENTS API
// ==========================================
export async function createAppointment(data: {
  clientId?: string
  barberId: string
  serviceIds: string[]
  startTime: string
  clientName: string
  clientPhone: string
  notes?: string
}): Promise<Appointment> {
  const services = await fetchServices()
  const selected = services.filter((s) => data.serviceIds.includes(s.id))
  const totalPrice = selected.reduce((acc, s) => acc + s.price, 0)
  const sumDuration = selected.reduce((acc, s) => acc + s.durationMin, 0)
  const rawDuration = sumDuration > 0 ? sumDuration : 45
  // Round up duration to nearest multiple of 15 minutes (e.g. 26m -> 45m, 38m -> 45m, 44m -> 45m)
  const totalDuration = Math.ceil(rawDuration / 15) * 15

  const startDate = new Date(data.startTime)
  const endDate = new Date(startDate.getTime() + totalDuration * 60000)

  const { data: app, error } = await supabase
    .from('appointments')
    .insert({
      client_id: data.clientId && !data.clientId.startsWith('public-') ? data.clientId : null,
      barber_id: data.barberId,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      total_price: totalPrice,
      status: 'CONFIRMED',
      client_name: data.clientName,
      client_phone: data.clientPhone,
      client_notes: data.notes,
    })
    .select('*')
    .single()

  if (error || !app) {
    throw new Error(error?.message || 'Falha ao criar agendamento no Supabase')
  }

  if (data.serviceIds.length > 0) {
    const relations = data.serviceIds.map((serviceId) => ({
      appointment_id: app.id,
      service_id: serviceId,
    }))
    await supabase.from('appointment_services').insert(relations)
  }

  return {
    id: app.id,
    clientId: app.client_id || undefined,
    barberId: app.barber_id,
    startTime: app.start_time,
    endTime: app.end_time,
    totalPrice: Number(app.total_price),
    status: app.status as AppointmentStatus,
    clientName: app.client_name,
    clientPhone: app.client_phone,
    clientNotes: app.client_notes,
    createdAt: app.created_at,
  }
}

export async function fetchBarberAppointments(
  barberId: string,
  dateStr: string // YYYY-MM-DD
): Promise<Appointment[]> {
  const startOfDay = new Date(`${dateStr}T00:00:00-03:00`).toISOString()
  const endOfDay = new Date(`${dateStr}T23:59:59-03:00`).toISOString()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:profiles!client_id(*),
      services:appointment_services(
        service:services(*)
      )
    `)
    .eq('barber_id', barberId)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching barber appointments:', error.message)
    return []
  }

  return (data || []).map((row) => ({
    id: row.id,
    clientId: row.client_id || undefined,
    barberId: row.barber_id,
    startTime: row.start_time,
    endTime: row.end_time,
    totalPrice: Number(row.total_price),
    status: row.status as AppointmentStatus,
    clientName: row.client_name || row.client?.name || 'Cliente',
    clientPhone: row.client_phone || row.client?.phone || '(11) 99999-9999',
    clientNotes: row.client_notes || row.client?.notes || undefined,
    services: (row.services || []).map((s: any) => mapServiceFromDb(s.service)),
  }))
}

export async function fetchClientAppointments(
  clientId: string,
  clientPhone?: string
): Promise<Appointment[]> {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      barber:profiles!barber_id(*),
      services:appointment_services(
        service:services(*)
      )
    `)

  if (clientPhone) {
    query = query.or(`client_id.eq.${clientId},client_phone.eq.${clientPhone}`)
  } else {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query.order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching client appointments:', error.message)
    return []
  }

  return (data || []).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    barberId: row.barber_id,
    startTime: row.start_time,
    endTime: row.end_time,
    totalPrice: Number(row.total_price),
    status: row.status as AppointmentStatus,
    barber: row.barber ? mapUserFromDb(row.barber) : undefined,
    services: (row.services || []).map((s: any) => mapServiceFromDb(s.service)),
  }))
}

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus
): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ status: newStatus })
    .eq('id', appointmentId)

  if (error) {
    console.error('Error updating appointment status:', error.message)
    throw new Error(error.message)
  }
}

export async function createBlockedTime(
  barberId: string,
  startTime: string,
  endTime: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('blocked_times')
    .insert({
      barber_id: barberId,
      start_time: startTime,
      end_time: endTime,
      reason,
    })

  if (error) {
    console.error('Error creating blocked time:', error.message)
    throw new Error(error.message)
  }
}

export async function updateClientNotes(clientId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ notes })
    .eq('id', clientId)

  if (error) {
    console.error('Error updating client notes:', error.message)
  }
}
