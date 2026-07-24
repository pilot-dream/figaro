import { useEffect, useState, useCallback } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'
import { AppointmentCard, type DashboardAppointment } from '@/components/dashboard/AppointmentCard'
import { ClientSheet } from '@/components/dashboard/ClientSheet'
import { BlockTimeModal } from '@/components/dashboard/BlockTimeModal'
import type { AppointmentStatus, Appointment } from '@/types'
import {
  fetchBarberAppointments,
  updateAppointmentStatus,
  createAppointment,
  createBlockedTime,
  supabase,
} from '@/lib/api'
import { getBrasiliaTodayStr, formatBrasiliaTime } from '@/lib/date'
import {
  Calendar as CalendarIcon,
  Plus,
  Lock,
  Share2,
  CheckCircle2,
  DollarSign,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(getBrasiliaTodayStr())
  const [selectedClient, setSelectedClient] = useState<DashboardAppointment | null>(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const loadAppointments = useCallback(async () => {
    if (!user) return
    try {
      const data = await fetchBarberAppointments(user.id, selectedDate)
      setAppointments(data.map(mapToDashboardAppointment))
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setLoading(false)
    }
  }, [user, selectedDate])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('public:appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          loadAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, loadAppointments])

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(id, newStatus)
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      )
    } catch {
      alert('Erro ao atualizar status')
    }
  }

  const handleCopyLink = async () => {
    const barberSlug = user?.slug || (user?.name ? user.name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : 'henrique-navalha')
    const publicUrl = `${window.location.origin}/${barberSlug}`

    let success = false

    // 1. Try modern navigator.clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(publicUrl)
        success = true
      } catch (e) {
        console.warn('Clipboard writeText failed, trying fallback:', e)
      }
    }

    // 2. Fallback to execCommand('copy') via temporary textarea
    if (!success) {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = publicUrl
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        textarea.style.top = '-9999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        success = document.execCommand('copy')
        document.body.removeChild(textarea)
      } catch (e) {
        console.warn('execCommand copy failed:', e)
      }
    }

    // 3. Fallback prompt if clipboard access is completely blocked by browser
    if (!success) {
      window.prompt('Copie o link do seu perfil:', publicUrl)
      return
    }

    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleQuickSlot = async () => {
    if (!user) return
    const clientName = prompt('Nome do Cliente para Encaixe Rápido:')
    if (!clientName) return
    const timeStr = prompt('Horário (ex: 15:30):', '15:30') || '15:30'

    try {
      const startTime = new Date(`${selectedDate}T${timeStr}:00-03:00`).toISOString()
      await createAppointment({
        barberId: user.id,
        serviceIds: [],
        startTime,
        clientName,
        clientPhone: '(11) 99999-0000',
        notes: 'Encaixe de Balcão',
      })
      await loadAppointments()
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar encaixe')
    }
  }

  const handleBlockTime = async (reason: string, timeRange: string) => {
    if (!user) return
    const [startStr, endStr] = timeRange.split(' - ')
    const startTime = new Date(`${selectedDate}T${startStr}:00-03:00`).toISOString()
    const endTime = new Date(`${selectedDate}T${endStr}:00-03:00`).toISOString()

    try {
      await createBlockedTime(user.id, startTime, endTime, reason)
      await loadAppointments()
    } catch (err: any) {
      alert(err.message || 'Erro ao bloquear horário')
    }
  }

  const handleSaveClientNotes = () => {
    loadAppointments()
  }

  // Statistics
  const totalRevenue = appointments
    .filter((a) => a.status === 'COMPLETED' || a.status === 'CONFIRMED')
    .reduce((acc, a) => acc + a.price, 0)
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length

  const formattedDateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Agenda Inteligente
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-figaro-amber)]/10 text-[var(--color-figaro-amber)] border border-[var(--color-figaro-amber)]/20 font-mono font-semibold">
              {user?.name || 'Barbeiro'}
            </span>
          </h2>
          <p className="text-xs text-figaro-text-secondary mt-0.5">
            Gerencie atendimentos com sincronização Supabase em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleCopyLink}>
            {copiedLink ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-figaro-mint)]" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            {copiedLink ? 'Link Copiado!' : 'Copiar meu link de agendamento'}
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--color-figaro-blue)]/10 text-[var(--color-figaro-blue)]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-figaro-text-secondary block">
              Faturamento Dia
            </span>
            <span className="text-lg font-black text-white">R$ {totalRevenue.toFixed(0)}</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--color-figaro-mint)]/10 text-[var(--color-figaro-mint)]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-figaro-text-secondary block">
              Atendimentos
            </span>
            <span className="text-lg font-black text-white">{completedCount + confirmedCount} clientes</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--color-figaro-amber)]/10 text-[var(--color-figaro-amber)]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-figaro-text-secondary block">
              Confirmados
            </span>
            <span className="text-lg font-black text-white">{confirmedCount} próximos</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-figaro-text-secondary block">
              Taxa Ocupação
            </span>
            <span className="text-lg font-black text-white">
              {Math.min(100, Math.round(((confirmedCount + completedCount) / 10) * 100))}%
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl glass-panel text-xs font-semibold text-white flex items-center gap-2 border-glass-border">
            <CalendarIcon className="w-4 h-4 text-[var(--color-figaro-blue)]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="amber" onClick={handleQuickSlot}>
            <Plus className="w-4 h-4" /> Encaixe Rápido
          </Button>
          <Button size="sm" variant="danger" onClick={() => setShowBlockModal(true)}>
            <Lock className="w-4 h-4" /> Bloquear Horário
          </Button>
        </div>
      </div>

      {/* Timeline Agenda List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-semibold text-figaro-text-secondary uppercase tracking-wider">
          Horários Agendados — {formattedDateLabel} ({appointments.length})
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="h-20 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <GlassCard className="p-8 text-center space-y-2 border-white/5">
            <p className="text-sm font-semibold text-white">Nenhum atendimento agendado para esta data.</p>
            <p className="text-xs text-figaro-text-secondary">
              Compartilhe seu link público para receber agendamentos de clientes.
            </p>
          </GlassCard>
        ) : (
          appointments.map((app) => (
            <AppointmentCard
              key={app.id}
              appointment={app}
              onSelectClient={(a) => setSelectedClient(a)}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* CRM Client Sheet Modal */}
      <ClientSheet
        appointment={selectedClient}
        onClose={() => setSelectedClient(null)}
        onSaveNotes={handleSaveClientNotes}
      />

      {/* Block Time Modal */}
      {showBlockModal && (
        <BlockTimeModal
          onClose={() => setShowBlockModal(false)}
          onBlock={handleBlockTime}
        />
      )}
    </div>
  )
}

function mapToDashboardAppointment(app: Appointment): DashboardAppointment {
  const startTime = formatBrasiliaTime(app.startTime)
  const endTime = formatBrasiliaTime(app.endTime)

  const serviceName = app.services && app.services.length > 0
    ? app.services.map((s) => s.name).join(' + ')
    : 'Atendimento'

  return {
    id: app.id,
    clientId: app.clientId,
    clientName: app.clientName || 'Cliente',
    clientPhone: app.clientPhone || '(11) 99999-9999',
    serviceName,
    startTime,
    endTime,
    price: app.totalPrice,
    status: app.status,
    notes: app.clientNotes,
  }
}
