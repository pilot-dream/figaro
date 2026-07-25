import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/stores/toast.store'
import { useConfirmStore } from '@/stores/confirm.store'
import { useAuthStore } from '@/stores/auth.store'
import { fetchClientAppointments, updateAppointmentStatus, fetchBarbers, supabase } from '@/lib/api'
import type { Appointment, User } from '@/types'
import { Calendar, Clock, Scissors, XCircle, CheckCircle2, Star, X, ArrowRight, UserCheck, RotateCw } from 'lucide-react'
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
    const confirmed = await useConfirmStore.getState().requestConfirm({
      message: 'Deseja realmente cancelar este agendamento?',
      confirmText: 'Sim, cancelar'
    })
    if (confirmed) {
      try {
        await updateAppointmentStatus(id, 'CANCELLED')
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' } : a))
        )
      } catch {
        useToastStore.getState().addToast('Erro ao cancelar agendamento', 'error')
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
          <div className="h-40 animate-pulse bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl" />
        ) : upcoming.length === 0 ? (
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[#11AFFA]/10 text-[#11AFFA] border border-[#11AFFA]/30 shadow-[0_0_15px_rgba(17,175,250,0.3)] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="space-y-2 mb-6">
              <h3 className="text-lg font-bold text-white">Você não possui agendamentos ativos no momento.</h3>
              <p className="text-sm text-[#8C97A8]">
                {recentBarbers.length > 0
                  ? 'Agende novamente com um dos seus barbeiros recentes.'
                  : 'Escolha um profissional para realizar seu primeiro agendamento.'}
              </p>
            </div>
            <button 
              onClick={() => setShowSelectBarberModal(true)}
              className="bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-bold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(17,175,250,0.4)] transition-all w-full md:w-auto"
            >
              Agendar Horário
            </button>
          </div>
        ) : (
          upcoming.map((app) => {
            const serviceName = app.services && app.services.length > 0
              ? app.services.map((s) => s.name).join(' + ')
              : 'Atendimento'
            const barberName = app.barber?.name || 'Barbeiro'
            const dateFormatted = formatBrasiliaDate(app.startTime, { day: '2-digit', month: 'short' })
            const timeFormatted = formatBrasiliaTime(app.startTime)

            return (
              <div 
                key={app.id} 
                className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border border-[#11AFFA]/40 rounded-3xl p-6 shadow-[0_0_30px_rgba(17,175,250,0.15)] relative overflow-hidden space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-white/50" />
                    <span className="text-sm font-medium text-white/80">Próximo Serviço</span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#11AFFA] text-white shadow-[0_0_10px_rgba(17,175,250,0.5)] animate-pulse border border-[#11AFFA]/50">
                    {app.status === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full border-2 border-[#11AFFA] p-0.5 shadow-[0_0_15px_rgba(17,175,250,0.3)]">
                    <img 
                      src={app.barber?.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'} 
                      alt={barberName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">{barberName}</h4>
                    <p className="text-sm text-[#11AFFA] font-semibold">{serviceName}</p>
                    <p className="text-xs text-[#8C97A8] font-medium mt-0.5">R$ {app.totalPrice.toFixed(2)}</p>
                  </div>
                </div>

                {/* Real-time Countdown & Date Time */}
                <div className="bg-black/30 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center gap-1">
                  <div className="text-2xl font-black text-white font-mono tracking-wide drop-shadow-md">
                    {dateFormatted} - {timeFormatted}
                  </div>
                  <div className="text-xs font-semibold text-[#8C97A8] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Faltam: <span className="text-[#11AFFA]">{getCountdown(app.startTime)}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button 
                    onClick={() => handleSelectBarber(app.barber?.slug)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl px-4 py-2.5 text-sm border border-white/10 transition-colors"
                  >
                    Reagendar / Alterar
                  </button>
                  <button 
                    onClick={() => handleCancel(app.id)}
                    className="text-[#F0553F] hover:bg-[#F0553F]/10 font-medium rounded-xl px-4 py-2.5 text-sm transition-colors border border-transparent hover:border-[#F0553F]/20"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
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
          <p className="text-xs text-[#8C97A8] italic">Nenhum histórico anterior.</p>
        ) : (
          <div className="space-y-3">
            {history.map((app) => {
              const serviceName = app.services && app.services.length > 0
                ? app.services.map((s) => s.name).join(' + ')
                : 'Atendimento'
              const dateFormatted = formatBrasiliaDate(app.startTime, { day: '2-digit', month: 'short' })

              return (
                <div 
                  key={app.id} 
                  className="bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <h5 className="font-semibold text-white text-sm">{serviceName}</h5>
                    <p className="text-xs text-[#8C97A8]">
                      {app.barber?.name || 'Barbeiro'} • {dateFormatted}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#2ED9A0] bg-[#2ED9A0]/10 border border-[#2ED9A0]/20 font-bold px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Concluído
                      </span>
                    )}
                    {app.status === 'CANCELLED' && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#F0553F] bg-[#F0553F]/10 border border-[#F0553F]/20 font-bold px-2 py-1 rounded-full">
                        <XCircle className="w-3 h-3" /> Cancelado
                      </span>
                    )}
                    <button 
                      onClick={() => handleSelectBarber(app.barber?.slug)}
                      className="text-[#11AFFA] hover:bg-[#11AFFA]/10 p-2 rounded-xl transition-all opacity-70 group-hover:opacity-100"
                      title="Agendar novamente"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
