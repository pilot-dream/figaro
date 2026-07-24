import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'
import { fetchClientAppointments, updateAppointmentStatus, fetchBarbers, supabase } from '@/lib/api'
import type { Appointment, User } from '@/types'
import { Calendar, Clock, User as UserIcon, Scissors, XCircle, CheckCircle2, Star, X, ArrowRight, UserCheck } from 'lucide-react'
import { formatBrasiliaTime, formatBrasiliaDate } from '@/lib/date'

export function MyAppointments({ onNewBooking }: { onNewBooking?: () => void }) {
  if (onNewBooking) {
    // optional callback handle
  }
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [barbers, setBarbers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showSelectBarberModal, setShowSelectBarberModal] = useState(false)
  const [showAllBarbers, setShowAllBarbers] = useState(false)
  const [now, setNow] = useState(Date.now())

  const loadAppointments = useCallback(async () => {
    if (!user) return
    try {
      const data = await fetchClientAppointments(user.id, user.phone)
      setAppointments(data)
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const loadBarbersList = useCallback(async () => {
    try {
      const list = await fetchBarbers()
      setBarbers(list)
    } catch (err) {
      console.error('Failed to load barbers:', err)
    }
  }, [])

  useEffect(() => {
    loadAppointments()
    loadBarbersList()
  }, [loadAppointments, loadBarbersList])

  // Supabase Realtime Subscription for Client Appointments
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('client:appointments')
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

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getCountdown = (startTimeIso: string) => {
    const targetTime = new Date(startTimeIso).getTime()
    const diff = targetTime - now
    if (diff <= 0) return 'Horário chegado'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${hours}h ${minutes}m ${seconds}s`
  }

  const handleCancel = async (id: string) => {
    if (confirm('Deseja realmente cancelar este agendamento?')) {
      try {
        await updateAppointmentStatus(id, 'CANCELLED')
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' } : a))
        )
      } catch {
        alert('Erro ao cancelar agendamento')
      }
    }
  }

  const handleSelectBarber = (barberSlug?: string) => {
    if (barberSlug) {
      navigate(`/${barberSlug}`)
    } else {
      navigate('/henrique-navalha')
    }
  }

  const upcoming = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING')
  const history = appointments.filter((a) => a.status !== 'CONFIRMED' && a.status !== 'PENDING')

  // Requirement 1: Filter ONLY recent barbers the client has previously booked with
  const recentBarberIds = Array.from(
    new Set(appointments.map((a) => a.barberId).filter(Boolean))
  )
  const recentBarbers = barbers.filter((b) => recentBarberIds.includes(b.id))

  // If client has previous history with barbers, show ONLY recent ones by default
  const displayedBarbers =
    recentBarbers.length > 0 && !showAllBarbers ? recentBarbers : barbers

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Meus Agendamentos</h2>
          <p className="text-xs text-figaro-text-secondary">Acompanhe seus horários em tempo real no Supabase</p>
        </div>
        <Button size="sm" onClick={() => setShowSelectBarberModal(true)}>
          <Scissors className="w-3.5 h-3.5" /> Novo Agendamento
        </Button>
      </div>

      {/* Upcoming Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-figaro-blue)] flex items-center gap-2">
          <Clock className="w-4 h-4" /> Próximo Atendimento
        </h3>

        {loading ? (
          <GlassCard className="h-28 animate-pulse bg-white/5" />
        ) : upcoming.length === 0 ? (
          <GlassCard className="text-center py-8 space-y-4 border border-white/10">
            <div className="w-12 h-12 rounded-full bg-[var(--color-figaro-blue)]/10 text-[var(--color-figaro-blue)] flex items-center justify-center mx-auto border border-[var(--color-figaro-blue)]/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Você não possui agendamentos ativos no momento.</p>
              <p className="text-xs text-figaro-text-secondary">
                {recentBarbers.length > 0
                  ? 'Agende novamente com um dos seus barbeiros recentes.'
                  : 'Escolha um profissional para realizar seu primeiro agendamento.'}
              </p>
            </div>
            <Button onClick={() => setShowSelectBarberModal(true)}>
              Agendar Horário
            </Button>
          </GlassCard>
        ) : (
          upcoming.map((app) => {
            const serviceName = app.services && app.services.length > 0
              ? app.services.map((s) => s.name).join(' + ')
              : 'Atendimento'
            const barberName = app.barber?.name || 'Barbeiro'
            const dateFormatted = formatBrasiliaDate(app.startTime, { day: '2-digit', month: 'short' })
            const timeFormatted = formatBrasiliaTime(app.startTime)

            return (
              <GlassCard key={app.id} glow className="p-6 space-y-4 border-[var(--color-figaro-blue)]/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-[var(--color-figaro-blue)]" />
                    <h4 className="font-bold text-white text-base">{serviceName}</h4>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-figaro-blue)]/10 text-[var(--color-figaro-blue)] border border-[var(--color-figaro-blue)]/20">
                    {app.status === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
                  </span>
                </div>

                {/* Real-time Countdown Banner */}
                <div className="bg-[var(--color-figaro-blue)]/10 border border-[var(--color-figaro-blue)]/20 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-figaro-text-secondary">Contagem Regressiva:</span>
                  <span className="text-sm font-black text-[var(--color-figaro-blue)] tracking-wider font-mono">
                    {getCountdown(app.startTime)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-figaro-text-primary">
                    <UserIcon className="w-4 h-4 text-[var(--color-figaro-amber)]" />
                    <span className="font-semibold text-white">{barberName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-figaro-text-primary">
                    <Calendar className="w-4 h-4 text-[var(--color-figaro-blue)]" />
                    <span>{dateFormatted} às {timeFormatted}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                  <span className="text-base font-extrabold text-white">R$ {app.totalPrice.toFixed(2)}</span>
                  <Button variant="danger" size="sm" onClick={() => handleCancel(app.id)}>
                    <XCircle className="w-4 h-4" /> Cancelar Horário
                  </Button>
                </div>
              </GlassCard>
            )
          })
        )}
      </div>

      {/* History Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-figaro-text-secondary">
          Histórico Passado
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-figaro-text-secondary italic">Nenhum histórico anterior.</p>
        ) : (
          <div className="space-y-3">
            {history.map((app) => {
              const serviceName = app.services && app.services.length > 0
                ? app.services.map((s) => s.name).join(' + ')
                : 'Atendimento'
              const dateFormatted = formatBrasiliaDate(app.startTime, { day: '2-digit', month: 'short' })

              return (
                <GlassCard key={app.id} className="p-4 flex items-center justify-between opacity-80">
                  <div className="space-y-1">
                    <h5 className="font-semibold text-white text-sm">{serviceName}</h5>
                    <p className="text-xs text-figaro-text-secondary">
                      {app.barber?.name || 'Barbeiro'} • {dateFormatted}
                    </p>
                  </div>
                  <div>
                    {app.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-figaro-mint)] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                      </span>
                    )}
                    {app.status === 'CANCELLED' && (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-figaro-terracotta)] font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Cancelado
                      </span>
                    )}
                  </div>
                </GlassCard>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal for Selecting Recent Barbers */}
      {showSelectBarberModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg p-6 space-y-6 border-[var(--color-figaro-blue)]/40 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[var(--color-figaro-amber)]" />
                  {recentBarbers.length > 0 && !showAllBarbers
                    ? 'Seus Barbeiros Recentes'
                    : 'Escolha o Barbeiro'}
                </h3>
                <p className="text-xs text-figaro-text-secondary mt-0.5">
                  {recentBarbers.length > 0 && !showAllBarbers
                    ? 'Exibindo apenas os profissionais que já atenderam você.'
                    : 'Selecione o profissional com quem deseja agendar seu horário.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSelectBarberModal(false)
                  setShowAllBarbers(false)
                }}
                className="p-1 rounded-full text-figaro-text-secondary hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {displayedBarbers.map((b) => {
                const isRecent = recentBarberIds.includes(b.id)
                return (
                  <GlassCard
                    key={b.id}
                    variant="interactive"
                    onClick={() => {
                      setShowSelectBarberModal(false)
                      setShowAllBarbers(false)
                      handleSelectBarber(b.slug)
                    }}
                    className={`p-4 flex items-center justify-between border transition-all ${
                      isRecent
                        ? 'border-[var(--color-figaro-amber)] bg-[var(--color-figaro-amber)]/10'
                        : 'border-glass-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          b.avatarUrl ||
                          'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'
                        }
                        alt={b.name}
                        className="w-12 h-12 rounded-full object-cover border border-white/20 shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{b.name}</h4>
                          {isRecent && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-[var(--color-figaro-amber)]/20 text-[var(--color-figaro-amber)] border border-[var(--color-figaro-amber)]/30 font-bold uppercase">
                              Seu Barbeiro
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-figaro-text-secondary line-clamp-1">{b.notes || 'Especialista Fígaro'}</p>
                        <div className="flex items-center gap-1 text-[11px] text-[var(--color-figaro-amber)] mt-0.5">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-white font-semibold">5.0</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant={isRecent ? 'amber' : 'primary'}>
                      Agendar <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </GlassCard>
                )
              })}
            </div>

            {recentBarbers.length > 0 && !showAllBarbers && barbers.length > recentBarbers.length && (
              <div className="border-t border-white/10 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllBarbers(true)}
                  className="text-xs text-[var(--color-figaro-blue)] hover:underline font-semibold cursor-pointer"
                >
                  Ver outros profissionais da barbearia ({barbers.length})
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  )
}
