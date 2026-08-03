import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToastStore } from '@/stores/toast.store'
import { useConfirmStore } from '@/stores/confirm.store'
import { useAuthStore } from '@/stores/auth.store'
import { fetchClientAppointments, updateAppointmentStatus, fetchBarbers, supabase } from '@/lib/api'
import type { Appointment, User } from '@/types'
import { Calendar, Clock, Scissors, XCircle, CheckCircle2, ChevronLeft, UserCheck, X, ArrowRight, Home, Wallet, User as UserIcon } from 'lucide-react'
import { ClientBottomNav } from '@/components/dashboard/ClientBottomNav'
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

  const isOneHourPast = (startTime: string) => {
    const oneHourInMs = 60 * 60 * 1000
    // Using `now` to compare against current time. 
    return new Date(startTime).getTime() + oneHourInMs < now
  }

  const upcoming = appointments.filter((a) => 
    (a.status === 'CONFIRMED' || a.status === 'PENDING') && !isOneHourPast(a.startTime)
  )

  const history = appointments.filter((a) => 
    (a.status !== 'CONFIRMED' && a.status !== 'PENDING') || 
    ((a.status === 'CONFIRMED' || a.status === 'PENDING') && isOneHourPast(a.startTime))
  )

  const displayedBarbers = barbers

  return (
    <div className="min-h-screen w-full bg-[#0A0E14] text-white pb-24 overflow-x-hidden">
      
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center">
        <h1 className="text-2xl font-bold text-white">Meus Agendamentos</h1>
      </div>

      <div className="px-4 mt-2">
        <button 
          onClick={() => setShowSelectBarberModal(true)}
          className="w-full mb-6 bg-gradient-to-r from-amber-200 to-amber-500 text-black font-semibold rounded-xl py-3 text-sm flex justify-center items-center gap-2"
        >
          <Scissors className="w-4 h-4" /> Novo Agendamento
        </button>

        {/* Upcoming Section */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C97A8] mb-4 pl-1">
          Próximo Atendimento
        </h3>

        {loading ? (
          <div className="h-32 animate-pulse bg-white/5 rounded-2xl border border-white/10" />
        ) : upcoming.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center mb-8">
            <Calendar className="w-10 h-10 text-[#8C97A8] mx-auto mb-3" />
            <h3 className="text-white font-bold mb-1">Nenhum agendamento ativo</h3>
            <p className="text-sm text-[#8C97A8]">
              Você não possui horários marcados no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {upcoming.map((app) => {
              const serviceName = app.services && app.services.length > 0
                ? app.services.map((s) => s.name).join(' + ')
                : 'Atendimento'
              const barberName = app.barber?.name || 'Barbeiro'
              const dateFormatted = formatBrasiliaDate(app.startTime, { day: '2-digit', month: 'short' })
              const timeFormatted = formatBrasiliaTime(app.startTime)

              return (
                <div 
                  key={app.id} 
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-white font-bold text-lg">{dateFormatted} às {timeFormatted}</h4>
                      <p className="text-xs text-[#8C97A8] mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Faltam: {getCountdown(app.startTime)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      app.status === 'CONFIRMED' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {app.status === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
                    </span>
                  </div>

                  <div className="bg-[#0A0E14]/50 rounded-xl p-3 mb-4 flex items-center gap-3 border border-white/5">
                    <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden">
                      <img 
                        src={app.barber?.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'} 
                        alt={barberName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h5 className="font-semibold text-white text-sm">{serviceName}</h5>
                      <p className="text-xs text-[#8C97A8]">com {barberName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleSelectBarber(app.barber?.slug)}
                      className="flex-1 border border-white/10 text-gray-300 font-medium rounded-xl py-2.5 text-xs transition-colors hover:bg-white/5"
                    >
                      Reagendar
                    </button>
                    <button 
                      onClick={() => handleCancel(app.id)}
                      className="flex-1 border border-white/10 text-[#F0553F] font-medium rounded-xl py-2.5 text-xs transition-colors hover:bg-[#F0553F]/10"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* History Section */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C97A8] mb-4 pl-1">
          Histórico Passado
        </h3>

        {history.length === 0 ? (
          <p className="text-sm text-[#8C97A8] italic text-center py-4">Nenhum histórico anterior.</p>
        ) : (
          <div className="space-y-4">
            {history.map((app) => {
              const serviceName = app.services && app.services.length > 0
                ? app.services.map((s) => s.name).join(' + ')
                : 'Atendimento'
              const dateFormatted = formatBrasiliaDate(app.startTime, { day: '2-digit', month: 'short' })
              const timeFormatted = formatBrasiliaTime(app.startTime)

              return (
                <div 
                  key={app.id} 
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-semibold text-white text-sm">{serviceName}</h5>
                    <p className="text-xs text-[#8C97A8] mt-0.5">
                      {dateFormatted} às {timeFormatted} • {app.barber?.name || 'Barbeiro'}
                    </p>
                  </div>
                  <div>
                    {(app.status === 'COMPLETED' || isOneHourPast(app.startTime)) && app.status !== 'CANCELLED' && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#2ED9A0] bg-[#2ED9A0]/10 border border-[#2ED9A0]/20 font-bold px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Concluído
                      </span>
                    )}
                    {app.status === 'CANCELLED' && (
                      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#F0553F] bg-[#F0553F]/10 border border-[#F0553F]/20 font-bold px-2 py-1 rounded-full">
                        <XCircle className="w-3 h-3" /> Cancelado
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal for Selecting Recent Barbers - adapted to Full Screen Dark Mode */}
      {showSelectBarberModal && (
        <div className="fixed inset-0 min-h-screen w-full bg-[#0A0E14] z-50 overflow-y-auto pb-24">
          <div className="flex items-center px-4 py-4 mt-2 border-b border-white/10">
            <button
              onClick={() => {
                setShowSelectBarberModal(false)
                setShowAllBarbers(false)
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors mr-4"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h3 className="font-bold text-white text-lg">
                Escolha o Profissional
              </h3>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {displayedBarbers.map((b) => {
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    setShowSelectBarberModal(false)
                    setShowAllBarbers(false)
                    handleSelectBarber(b.slug)
                  }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        b.avatarUrl ||
                        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'
                      }
                      alt={b.name}
                      className="w-14 h-14 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{b.name}</h4>
                      </div>
                      <p className="text-xs text-[#8C97A8] mt-0.5 line-clamp-1">{b.notes || 'Especialista Fígaro'}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              )
            })}


          </div>
        </div>
      )}

      {/* Premium Dark Mode Bottom Nav */}
      <ClientBottomNav onActionClick={() => setShowSelectBarberModal(true)} />
    </div>
  )
}
