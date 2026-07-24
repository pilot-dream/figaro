import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'
import { fetchBarberBySlug, fetchAvailability, createAppointment } from '@/lib/api'
import type { User, Service, TimeSlot } from '@/types'
import {
  Clock,
  Check,
  Star,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LogIn,
  UserPlus,
} from 'lucide-react'
import { getBrasiliaTodayStr, getBrasiliaNextDays, formatBrasiliaTime } from '@/lib/date'

export function BarberBookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuthStore()

  const [barber, setBarber] = useState<User | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Booking Flow State
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(getBrasiliaTodayStr())
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Client Info Form (Auto fill when user is logged in)
  const [clientName, setClientName] = useState(user?.name || '')
  const [clientPhone, setClientPhone] = useState(user?.phone || '')
  const [clientNotes, setClientNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Sync user info if auth loads after mount
  useEffect(() => {
    if (user) {
      if (!clientName) setClientName(user.name)
      if (!clientPhone && user.phone) setClientPhone(user.phone)
    }
  }, [user, clientName, clientPhone])

  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0)
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.durationMin, 0)

  // Next 14 days in Brasilia Timezone
  const availableDates = getBrasiliaNextDays(14)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetchBarberBySlug(slug)
      .then((data) => {
        setBarber(data.barber)
        setServices(data.services)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (step === 2 && barber && totalDuration > 0) {
      setSlotsLoading(true)
      fetchAvailability(selectedDate, totalDuration, barber.id)
        .then(setSlots)
        .finally(() => setSlotsLoading(false))
    }
  }, [step, selectedDate, totalDuration, barber])

  const toggleService = (service: Service) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    )
  }

  const handleConfirmAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot || !clientName || !clientPhone || !barber) return

    setSubmitting(true)
    try {
      await createAppointment({
        clientId: user?.id,
        barberId: barber.id,
        serviceIds: selectedServices.map((s) => s.id),
        startTime: selectedSlot.startTime,
        clientName,
        clientPhone,
        notes: clientNotes,
      })
      setCompleted(true)
    } catch {
      alert('Erro ao realizar agendamento')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <GlassCard className="p-8 animate-pulse bg-white/5 space-y-3">
          <div className="w-16 h-16 rounded-full bg-white/10 mx-auto" />
          <div className="h-4 w-32 bg-white/10 mx-auto rounded" />
        </GlassCard>
      </div>
    )
  }

  if (notFound || !barber) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <GlassCard className="p-8 space-y-4 border-[var(--color-figaro-terracotta)]/30">
          <AlertCircle className="w-10 h-10 text-[var(--color-figaro-terracotta)] mx-auto" />
          <h2 className="text-lg font-bold text-white">Barbeiro não encontrado</h2>
          <p className="text-xs text-figaro-text-secondary">
            Verifique o link enviado ou faça login na sua conta.
          </p>
          <Link to="/login">
            <Button size="sm">Ir para Login</Button>
          </Link>
        </GlassCard>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <GlassCard glow className="p-8 text-center space-y-6 border-[var(--color-figaro-mint)]/40">
          <div className="w-16 h-16 rounded-full bg-[var(--color-figaro-mint)]/20 text-[var(--color-figaro-mint)] flex items-center justify-center mx-auto border border-[var(--color-figaro-mint)]/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Agendamento Confirmado!</h2>
            <p className="text-xs text-figaro-text-secondary mt-1">
              Enviamos os detalhes e lembretes para o seu WhatsApp ({clientPhone}).
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left text-xs space-y-2">
            <p className="text-white">
              <strong>Barbeiro:</strong> {barber.name}
            </p>
            <p className="text-white">
              <strong>Data/Hora:</strong>{' '}
              {new Date(selectedSlot!.startTime).toLocaleString('pt-BR')}
            </p>
            <p className="text-white">
              <strong>Valor Total:</strong> R$ {totalPrice.toFixed(2)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {user ? (
              <Link to="/meus-agendamentos">
                <Button className="w-full">Ver Meus Agendamentos</Button>
              </Link>
            ) : (
              <Button
                onClick={() => {
                  setCompleted(false)
                  setStep(1)
                  setSelectedServices([])
                  setSelectedSlot(null)
                }}
                className="w-full"
              >
                Realizar Novo Agendamento
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Barber Public Header Banner */}
      <GlassCard glow className="p-6 relative overflow-hidden border-[var(--color-figaro-blue)]/40">
        <div className="flex items-center gap-4">
          <img
            src={barber.avatarUrl}
            alt={barber.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-[var(--color-figaro-blue)] ring-4 ring-white/10 shadow-xl"
          />
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[var(--color-figaro-amber)]/20 text-[var(--color-figaro-amber)] border border-[var(--color-figaro-amber)]/30">
              Agendamento com Barbeiro
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">{barber.name}</h1>
            <p className="text-xs text-figaro-text-secondary">{barber.notes}</p>
            <div className="flex items-center gap-1 text-xs text-[var(--color-figaro-amber)] pt-1">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-white font-bold">5.0</span> (Barbearia Fígaro)
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Progress Steps Header */}
      <div className="flex items-center justify-between text-xs font-semibold px-2">
        <span className={step >= 1 ? 'text-[var(--color-figaro-blue)]' : 'text-figaro-text-secondary'}>
          1. Serviços
        </span>
        <span className="text-white/20">➔</span>
        <span className={step >= 2 ? 'text-[var(--color-figaro-blue)]' : 'text-figaro-text-secondary'}>
          2. Data & Hora
        </span>
        <span className="text-white/20">➔</span>
        <span className={step === 3 ? 'text-[var(--color-figaro-blue)]' : 'text-figaro-text-secondary'}>
          3. Confirmação
        </span>
      </div>

      {/* STEP 1: Services Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Escolha os Serviços com {barber.name}</h3>
          <div className="space-y-3">
            {services.map((srv) => {
              const isSelected = selectedServices.some((s) => s.id === srv.id)
              return (
                <GlassCard
                  key={srv.id}
                  variant="interactive"
                  onClick={() => toggleService(srv)}
                  className={`flex items-center justify-between border-2 transition-all p-4 ${
                    isSelected
                      ? 'border-[var(--color-figaro-blue)] bg-[var(--color-figaro-blue)]/10'
                      : 'border-glass-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'bg-[var(--color-figaro-blue)] border-[var(--color-figaro-blue)] text-white'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{srv.name}</h4>
                      <p className="text-xs text-figaro-text-secondary">{srv.description}</p>
                      <span className="text-[11px] text-[var(--color-figaro-amber)] flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {srv.durationMin} min
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-white">
                    R$ {srv.price.toFixed(2)}
                  </span>
                </GlassCard>
              )
            })}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-white/10">
            <div>
              <span className="text-[10px] text-figaro-text-secondary uppercase font-bold block">
                Total
              </span>
              <span className="text-xl font-black text-white">R$ {totalPrice.toFixed(2)}</span>
            </div>
            <Button disabled={selectedServices.length === 0} onClick={() => setStep(2)}>
              Avançar para Horários
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Date & Time Slot Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white">Data & Horário Livre</h3>

          {/* Carousel */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {availableDates.map((item) => (
              <button
                key={item.iso}
                onClick={() => {
                  setSelectedDate(item.iso)
                  setSelectedSlot(null)
                }}
                className={`flex-shrink-0 w-16 p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedDate === item.iso
                    ? 'bg-[var(--color-figaro-blue)] border-[var(--color-figaro-blue)] text-white shadow-lg'
                    : 'glass-panel text-figaro-text-secondary hover:text-white'
                }`}
              >
                <span className="block text-[10px] uppercase font-bold">{item.dayName}</span>
                <span className="block text-lg font-black my-0.5">{item.dayNum}</span>
                <span className="block text-[9px] uppercase">{item.month}</span>
              </button>
            ))}
          </div>

          {/* Slots */}
          {slotsLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <GlassCard key={i} className="h-10 animate-pulse bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.startTime === slot.startTime
                const timeStr = formatBrasiliaTime(slot.startTime)
                return (
                  <button
                    key={slot.startTime}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                      !slot.available
                        ? 'opacity-30 border-white/10 bg-white/5 line-through text-figaro-text-secondary'
                        : isSelected
                        ? 'bg-[var(--color-figaro-blue)] border-[var(--color-figaro-blue)] text-white shadow-lg'
                        : 'glass-panel text-white hover:border-[var(--color-figaro-blue)]/50'
                    }`}
                  >
                    {timeStr}
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button disabled={!selectedSlot} onClick={() => setStep(3)}>
              Ir para Confirmação
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Public Confirmation Form */}
      {step === 3 && (
        <form onSubmit={handleConfirmAppointment} className="space-y-6">
          <h3 className="text-lg font-bold text-white">Finalizar Agendamento</h3>

          <GlassCard className="p-4 space-y-2 border-[var(--color-figaro-blue)]/30 text-xs">
            <p className="text-white">
              <strong>Barbeiro:</strong> {barber.name}
            </p>
            <p className="text-white">
              <strong>Data/Hora:</strong>{' '}
              {new Date(selectedSlot!.startTime).toLocaleString('pt-BR')} ({totalDuration} min)
            </p>
            <p className="text-white">
              <strong>Serviços:</strong> {selectedServices.map((s) => s.name).join(', ')}
            </p>
            <p className="text-white font-extrabold text-sm pt-1 border-t border-white/10">
              Valor Total: R$ {totalPrice.toFixed(2)}
            </p>
          </GlassCard>

          {/* User Account Verification / Login Enforcement Banner */}
          {!user ? (
            <GlassCard className="p-6 border-[var(--color-figaro-amber)]/40 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-figaro-amber)]/20 text-[var(--color-figaro-amber)] flex items-center justify-center mx-auto border border-[var(--color-figaro-amber)]/30">
                <LogIn className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">Faça Login para Vincular seu Agendamento</h4>
                <p className="text-xs text-figaro-text-secondary max-w-md mx-auto">
                  Para que você possa acompanhar e gerenciar seus horários em "Meus Agendamentos", entre na sua conta ou crie uma nova conta em poucos segundos.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link to={`/login?redirect=/${slug}`} className="w-full sm:w-auto">
                  <Button variant="secondary" type="button" className="w-full flex items-center justify-center gap-1.5">
                    <LogIn className="w-4 h-4" /> Entrar na minha Conta
                  </Button>
                </Link>
                <Link to={`/registro?redirect=/${slug}`} className="w-full sm:w-auto">
                  <Button type="button" className="w-full flex items-center justify-center gap-1.5">
                    <UserPlus className="w-4 h-4" /> Criar Conta Rápida
                  </Button>
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="bg-[var(--color-figaro-mint)]/10 border border-[var(--color-figaro-mint)]/30 p-3.5 rounded-xl flex items-center justify-between text-xs">
              <span className="text-[var(--color-figaro-mint)] font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                Conectado como <strong className="text-white">{user.name}</strong> ({user.email})
              </span>
              <span className="text-[10px] text-[var(--color-figaro-mint)] font-mono font-bold uppercase border border-[var(--color-figaro-mint)]/30 px-2 py-0.5 rounded">
                VINCULADO
              </span>
            </div>
          )}

          {user && (
            <GlassCard className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Pedro Henrique"
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
                  Seu WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
                  Observação para o barbeiro (opcional)
                </label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Ex: Corte de tesoura..."
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)] resize-none"
                />
              </div>
            </GlassCard>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" type="button" onClick={() => setStep(2)}>
              Voltar
            </Button>
            {user && (
              <Button type="submit" size="lg" isLoading={submitting}>
                Confirmar Agendamento
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
