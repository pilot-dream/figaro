import { supabase } from '@/lib/supabase'
import type { Service, User, TimeSlot, Appointment, AppointmentStatus } from '@/types'

export { supabase }

export const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:3001/api");

// ==========================================
// STORAGE API
// ==========================================
export async function uploadAvatar(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { 
        upsert: true,
        cacheControl: '31536000' // 1 ano de cache agressivo para fotos de perfil
      })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError.message)
      return null
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  } catch (error) {
    console.error('Error in uploadAvatar:', error)
    return null
  }
}

export async function uploadImage(file: File, bucketName: string = 'avatars'): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `images/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { 
        upsert: true,
        cacheControl: '31536000'
      })

    if (uploadError) {
      console.error('Error uploading image:', uploadError.message)
      return null
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
    return data.publicUrl
  } catch (error) {
    console.error('Error in uploadImage:', error)
    return null
  }
}

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
    imageUrl: row.image_url || undefined,
  }
}

export async function saveService(service: Partial<Service>): Promise<Service> {
  const isNew = !service.id || service.id.startsWith('srv-')
  
  const payload = {
    barber_id: service.barberId,
    name: service.name,
    description: service.description,
    duration_min: service.durationMin,
    price: service.price,
    is_active: service.isActive,
    sort_order: service.sortOrder,
    image_url: service.imageUrl,
  }

  let query = supabase.from('services')
  
  if (isNew) {
    // Insert
    const { data, error } = await query.insert(payload).select('*').single()
    if (error) throw new Error(error.message)
    return mapServiceFromDb(data)
  } else {
    // Update
    const { data, error } = await query.update(payload).eq('id', service.id).select('*').single()
    if (error) throw new Error(error.message)
    return mapServiceFromDb(data)
  }
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ==========================================
// BARBERS API
// ==========================================
export async function fetchBarbers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['BARBER', 'OWNER'])

  if (error) {
    console.error('Error fetching barbers:', error.message)
    return []
  }

  return (data || []).map(mapUserFromDb)
}

export async function fetchMyTeam(): Promise<User[]> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  if (!token) return []
  try {
    const res = await fetch(`${API_URL}/team`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!res.ok) throw new Error('Falha ao buscar equipe')
    return res.json()
  } catch (err) {
    console.error(err)
    return []
  }
}

// ==========================================
// TEAM MANAGEMENT API (Invite, Add, Remove)
// ==========================================

/** Busca o token de convite (UUID do OWNER) para montar o link */
export async function fetchTeamInviteLink(): Promise<string> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  if (!token) throw new Error('Não autenticado')

  const res = await fetch(`${API_URL}/team/link`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Falha ao buscar link de convite')
  }

  const data: { inviteToken: string } = await res.json()
  return data.inviteToken
}

/** Vincula um barbeiro existente pelo email */
export async function addTeamMemberByEmail(email: string): Promise<User> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  if (!token) throw new Error('Não autenticado')

  const res = await fetch(`${API_URL}/team/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ email })
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Falha ao vincular barbeiro')
  }

  return res.json()
}

/** Desvincula um barbeiro da equipe (não deleta a conta) */
export async function removeTeamMember(barberId: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  if (!token) throw new Error('Não autenticado')

  const res = await fetch(`${API_URL}/team/remove/${barberId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Falha ao remover membro da equipe')
  }
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
    specialty: row.specialty || undefined,
    notes: row.notes || undefined,
    googleEmail: row.google_email || undefined,
    googleSyncEnabled: row.google_sync_enabled ?? false,
    googleSyncBusyTimes: row.google_sync_busy_times ?? false,
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
  if (!barberId) return []

  const [year, month, day] = dateStr.split('-').map(Number)
  const targetDate = new Date(year, month - 1, day) // Local time midnight

  // Fetch Barber Config
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_hours, slot_interval')
    .eq('id', barberId)
    .single()

  let slotInterval = 15
  let dayConfig: any = null

  if (profile) {
    if (profile.slot_interval) slotInterval = profile.slot_interval
    
    if (profile.business_hours && Array.isArray(profile.business_hours)) {
      const dayIndexMap: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 }
      const jsDay = targetDate.getDay()
      dayConfig = profile.business_hours[dayIndexMap[jsDay]]
    }
  }

  if (!dayConfig) {
    dayConfig = { active: true, open: '09:00', close: '20:00', lunch: '12:00 - 13:00' }
  }

  if (!dayConfig.active) {
    return [] // Fully booked / closed
  }

  // Generate Base Slots
  const slots: { startTime: Date, endTime: Date, available: boolean }[] = []
  const [startHour, startMin] = dayConfig.open.split(':').map(Number)
  const [endHour, endMin] = dayConfig.close.split(':').map(Number)

  let current = new Date(targetDate)
  current.setHours(startHour, startMin, 0, 0)

  const end = new Date(targetDate)
  end.setHours(endHour, endMin, 0, 0)

  while (current < end) {
    const next = new Date(current.getTime() + slotInterval * 60000)
    slots.push({
      startTime: new Date(current),
      endTime: new Date(next),
      available: true
    })
    current = next
  }

  // Fetch Appointments
  const nextDay = new Date(targetDate)
  nextDay.setDate(nextDay.getDate() + 1)
  
  const { data: appointments } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('barber_id', barberId)
    .gte('start_time', targetDate.toISOString())
    .lt('start_time', nextDay.toISOString())
    .neq('status', 'CANCELLED')

  // Fetch Blocked Times
  const { data: blockedTimes } = await supabase
    .from('blocked_times')
    .select('start_time, end_time')
    .eq('barber_id', barberId)
    .gte('start_time', targetDate.toISOString())
    .lt('start_time', nextDay.toISOString())

  const allBlocks: { start: Date, end: Date }[] = []
  
  if (appointments) {
    appointments.forEach(a => allBlocks.push({ start: new Date(a.start_time), end: new Date(a.end_time) }))
  }
  
  if (blockedTimes) {
    blockedTimes.forEach(b => allBlocks.push({ start: new Date(b.start_time), end: new Date(b.end_time) }))
  }

  // Add Lunch Break
  if (dayConfig.lunch && dayConfig.lunch.includes('-')) {
    const [lunchStart, lunchEnd] = dayConfig.lunch.split('-').map((s: string) => s.trim())
    const [lStartHour, lStartMin] = lunchStart.split(':').map(Number)
    const [lEndHour, lEndMin] = lunchEnd.split(':').map(Number)
    
    const lunchStartTime = new Date(targetDate)
    lunchStartTime.setHours(lStartHour, lStartMin, 0, 0)
    
    const lunchEndTime = new Date(targetDate)
    lunchEndTime.setHours(lEndHour, lEndMin, 0, 0)
    
    allBlocks.push({ start: lunchStartTime, end: lunchEndTime })
  }

  const now = new Date()

  return slots.map(slot => {
    const slotEnd = new Date(slot.startTime.getTime() + rawDurationMin * 60000)
    
    const collides = allBlocks.some(block => 
      (slot.startTime >= block.start && slot.startTime < block.end) ||
      (slotEnd > block.start && slotEnd <= block.end) ||
      (slot.startTime <= block.start && slotEnd >= block.end)
    )

    const businessEnd = new Date(targetDate)
    businessEnd.setHours(endHour, endMin, 0, 0)

    const isPast = slot.startTime < now

    return {
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      available: !collides && slotEnd <= businessEnd && !isPast
    }
  })
}

// ==========================================
// APPOINTMENTS API
// ==========================================
// ==========================================
// APPOINTMENTS API
// ==========================================
export async function createAppointment(data: {
  clientId?: string
  barberId?: string
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

  if (!data.barberId) {
    throw new Error('ID do barbeiro é obrigatório para criar o agendamento.')
  }

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

  // Attempt to sync with Google Calendar via backend API
  try {
    await fetch(`${API_URL}/google/sync-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: app.id,
        barberId: data.barberId,
        summary: `Atendimento Fígaro: ${data.clientName}`,
        description: `Telefone: ${data.clientPhone}\nNotas: ${data.notes || ''}`,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      })
    })
  } catch (err) {
    console.error('Non-fatal error syncing to Google Calendar:', err)
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
  dateStr?: string, // YYYY-MM-DD
  period?: 'today' | 'yesterday' | 'week' | 'month'
): Promise<Appointment[]> {
  let startOfDay: string;
  let endOfDay: string;

  if (period) {
    let startDate = new Date()
    let endDate = new Date()
    
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
    } else if (period === 'yesterday') {
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setHours(23, 59, 59, 999)
    } else if (period === 'week') {
      const day = startDate.getDay()
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1)
      startDate = new Date(startDate.setDate(diff))
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
    } else if (period === 'month') {
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setMonth(startDate.getMonth() + 1)
      endDate.setDate(0)
      endDate.setHours(23, 59, 59, 999)
    }
    startOfDay = startDate.toISOString()
    endOfDay = endDate.toISOString()
  } else if (dateStr) {
    startOfDay = new Date(`${dateStr}T00:00:00-03:00`).toISOString()
    endOfDay = new Date(`${dateStr}T23:59:59-03:00`).toISOString()
  } else {
    const todayStr = new Date().toISOString().split('T')[0]
    startOfDay = new Date(`${todayStr}T00:00:00-03:00`).toISOString()
    endOfDay = new Date(`${todayStr}T23:59:59-03:00`).toISOString()
  }

  let query = supabase
    .from('appointments')
    .select(`
      *,
      client:profiles!client_id(*),
      services:appointment_services(
        service:services(*)
      )
    `)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time', { ascending: true })

  if (barberId !== 'all') {
    query = query.eq('barber_id', barberId)
  }

  const { data, error } = await query

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
    .eq('client_id', clientId)

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

  // Sync cancellation to Google Calendar if status changed to CANCELLED
  if (newStatus === 'CANCELLED') {
    try {
      const { data: appData } = await supabase.from('appointments').select('barber_id, google_event_id').eq('id', appointmentId).single()
      if (appData?.google_event_id) {
        await fetch(`${API_URL}/google/cancel-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barberId: appData.barber_id,
            eventId: appData.google_event_id
          })
        })
      }
    } catch (err) {
      console.error('Non-fatal error canceling Google Calendar event:', err)
    }
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

export async function fetchBarberBlockedTimes(barberId: string, dateStr: string): Promise<any[]> {
  const startOfDay = new Date(`${dateStr}T00:00:00-03:00`).toISOString()
  const endOfDay = new Date(`${dateStr}T23:59:59-03:00`).toISOString()

  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('barber_id', barberId)
    .gte('start_time', startOfDay)
    .lt('start_time', endOfDay)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching blocked times:', error.message)
    return []
  }

  return data || []
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

// ==========================================
// MRR / CLUBE DE ASSINATURAS API
// ==========================================
export async function fetchSubscriptionPlans(): Promise<any[]> {
  const response = await fetch(`${API_URL}/mrr/plans`)
  if (!response.ok) {
    throw new Error('Falha ao buscar planos')
  }
  return response.json()
}

export async function createSubscription(data: {
  barberId: string
  planId: string
  dayOfWeek: number
  time: string
}): Promise<any> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  
  if (!token) throw new Error('Not authenticated')
  const response = await fetch(`${API_URL}/mrr/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Falha ao processar assinatura')
  }
  
  return response.json()
}

export async function createSubscriptionPlan(data: {
  name: string
  price: number
  cutsPerPeriod: number
  description: string
}): Promise<any> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  if (!token) throw new Error('Not authenticated')
  const response = await fetch(`${API_URL}/mrr/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    try {
      const errData = JSON.parse(text)
      throw new Error(`Erro do servidor: ${errData.error || text}`)
    } catch {
      throw new Error(`Erro desconhecido (Status ${response.status}): ${text.substring(0, 100)}`)
    }
  }
  return response.json()
}

export async function fetchSubscribers(): Promise<any[]> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  if (!token) throw new Error('Not authenticated')
  const response = await fetch(`${API_URL}/mrr/subscribers`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) throw new Error('Falha ao buscar assinantes')
  return response.json()
}

export async function updateSubscriberStatus(subscriptionId: string, status: string): Promise<any> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  if (!token) throw new Error('Not authenticated')
  const response = await fetch(`${API_URL}/mrr/subscribers/${subscriptionId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  })
  
  if (!response.ok) throw new Error('Falha ao alterar status')
  return response.json()
}

export async function deleteSubscription(subscriptionId: string): Promise<any> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  if (!token) throw new Error('Not authenticated')
  const response = await fetch(`${API_URL}/mrr/subscribers/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) throw new Error('Falha ao excluir assinatura')
  return response.json()
}

export async function fetchTakenMrrSlots(barberId: string): Promise<{ dayOfWeek: number, time: string }[]> {
  const response = await fetch(`${API_URL}/mrr/taken-slots/${barberId}`)
  
  if (!response.ok) {
    return []
  }
  return response.json()
}

export async function fetchRevenueChartData(barberId: string): Promise<{ name: string, faturamento: number }[]> {
  const { data: session } = await supabase.auth.getSession()
  const token = session?.session?.access_token
  if (!token) throw new Error('Not authenticated')
  const response = await fetch(`${API_URL}/finance/chart-data?barberId=${barberId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (!response.ok) {
    return []
  }
  return response.json()
}
