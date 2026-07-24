import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { fetchServices, createAppointment, fetchAvailability } from '@/lib/api'
import type { Service, TimeSlot, User } from '@/types'
import { Lock, Check } from 'lucide-react'
import { formatBrasiliaTime } from '@/lib/date'

interface TabBookingProps {
  barber: User
  selectedDate: string
  onAppointmentCreated: () => void
  onOpenBlockModal: () => void
}

export function TabBooking({
  barber,
  selectedDate,
  onAppointmentCreated,
  onOpenBlockModal,
}: TabBookingProps) {
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  
  const [dateStr, setDateStr] = useState(selectedDate)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const totalDuration = selectedServices.reduce((acc, s) => acc + s.durationMin, 0) || 45
  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0)

  useEffect(() => {
    fetchServices().then(setServices)
  }, [])

  useEffect(() => {
    if (!barber) return
    setLoadingSlots(true)
    fetchAvailability(dateStr, totalDuration, barber.id)
      .then(setSlots)
      .finally(() => setLoadingSlots(false))
  }, [dateStr, totalDuration, barber])

  const toggleService = (srv: Service) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === srv.id)
        ? prev.filter((s) => s.id !== srv.id)
        : [...prev, srv]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName || !clientPhone || !selectedSlot) return

    setSubmitting(true)
    try {
      await createAppointment({
        barberId: barber.id,
        serviceIds: selectedServices.map((s) => s.id),
        startTime: selectedSlot.startTime,
        clientName,
        clientPhone,
        notes,
      })
      alert('Encaixe rápido realizado com sucesso!')
      setClientName('')
      setClientPhone('')
      setNotes('')
      setSelectedServices([])
      setSelectedSlot(null)
      onAppointmentCreated()
    } catch {
      alert('Erro ao realizar agendamento manual')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Novo Agendamento Manual</h2>
          <p className="text-xs text-figaro-text-secondary">
            Lançamento rápido de cliente balcão e bloqueio de horários pessoais
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenBlockModal}
          className="flex items-center gap-1.5 border-[var(--color-figaro-amber)]/40 text-[var(--color-figaro-amber)]"
        >
          <Lock className="w-4 h-4" /> Bloquear Horário Pessoal
        </Button>
      </div>

      {/* Manual Booking Form */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Step 1: Services */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-[var(--color-figaro-blue)] tracking-wider block">
            1. Selecione os Serviços
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {services.map((srv) => {
              const isSelected = selectedServices.some((s) => s.id === srv.id)
              return (
                <GlassCard
                  key={srv.id}
                  variant="interactive"
                  onClick={() => toggleService(srv)}
                  className={`p-3.5 flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'border-[var(--color-figaro-blue)] bg-[var(--color-figaro-blue)]/10'
                      : 'border-glass-border'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'bg-[var(--color-figaro-blue)] border-[var(--color-figaro-blue)] text-white'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">{srv.name}</h4>
                      <span className="text-[10px] text-figaro-text-secondary">{srv.durationMin} min</span>
                    </div>
                  </div>
                  <span className="font-bold text-white text-xs">R$ {srv.price.toFixed(2)}</span>
                </GlassCard>
              )
            })}
          </div>
        </div>

        {/* Step 2: Date & Slot Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase text-[var(--color-figaro-blue)] tracking-wider block">
              2. Escolha Data & Horário Livre
            </label>

            <input
              type="date"
              value={dateStr}
              onChange={(e) => {
                setDateStr(e.target.value)
                setSelectedSlot(null)
              }}
              className="bg-white/5 border border-glass-border px-3 py-1 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[var(--color-figaro-blue)] cursor-pointer"
            />
          </div>

          {loadingSlots ? (
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <GlassCard key={i} className="h-9 animate-pulse bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.startTime === slot.startTime
                const timeStr = formatBrasiliaTime(slot.startTime)
                return (
                  <button
                    type="button"
                    key={slot.startTime}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
        </div>

        {/* Step 3: Client Info */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-[var(--color-figaro-blue)] tracking-wider block">
            3. Dados do Cliente
          </label>

          <GlassCard className="p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
                Nome do Cliente *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: João Souza"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs focus:outline-none focus:border-[var(--color-figaro-blue)]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
                WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs focus:outline-none focus:border-[var(--color-figaro-blue)]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
                Observação Interna (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Cliente balcão, pagamento em dinheiro"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs focus:outline-none focus:border-[var(--color-figaro-blue)]"
              />
            </div>
          </GlassCard>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!selectedSlot || !clientName || !clientPhone}
          isLoading={submitting}
        >
          Confirmar Encaixe Rápido (R$ {totalPrice.toFixed(2)})
        </Button>
      </form>
    </div>
  )
}
