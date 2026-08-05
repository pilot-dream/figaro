import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { fetchAvailability } from '@/lib/api'
import type { TimeSlot } from '@/types'
import { useBookingStore, useBookingTotals } from '@/stores/booking.store'
import { Calendar as CalendarIcon, Clock, Check, AlertCircle, Sparkles } from 'lucide-react'
import { useToastStore } from '@/stores/toast.store'

export function StepDateTime() {
  const {
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    selectedBarber,
    setStep,
  } = useBookingStore()
  const { totalDuration } = useBookingTotals()

  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)

  // Generate next 14 days
  const availableDates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      iso: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('pt-BR', { month: 'short' }),
    }
  })

  useEffect(() => {
    setLoading(true)
    fetchAvailability(selectedDate, totalDuration, selectedBarber?.id).then((data) => {
      setSlots(data)
      setLoading(false)
    })
  }, [selectedDate, totalDuration, selectedBarber])

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">3. Data & Horário Livre</h3>
        <p className="text-xs text-figaro-text-secondary mt-1">
          Slots dinâmicos calculados em tempo real ({totalDuration} min de atendimento).
        </p>
      </div>

      {/* Date selector carousel */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-figaro-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-[var(--color-figaro-blue)]" /> Selecione o Dia
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {availableDates.map((item) => {
            const isSelected = selectedDate === item.iso
            return (
              <button
                key={item.iso}
                onClick={() => setSelectedDate(item.iso)}
                className={`flex-shrink-0 w-16 p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--color-figaro-blue)] border-[var(--color-figaro-blue)] text-white shadow-lg shadow-[rgba(17,175,250,0.25)] scale-105'
                    : 'glass-panel text-figaro-text-secondary hover:text-white hover:border-white/30'
                }`}
              >
                <span className="block text-[10px] uppercase font-bold tracking-wider opacity-80">
                  {item.dayName}
                </span>
                <span className="block text-xl font-extrabold text-white my-0.5">{item.dayNum}</span>
                <span className="block text-[9px] uppercase opacity-70">{item.month}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-figaro-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--color-figaro-amber)]" /> Horários Disponíveis
          </label>
          <button
            onClick={() => setShowWaitlistModal(true)}
            className="text-xs text-[var(--color-figaro-amber)] underline hover:text-[#D4AF37] font-medium"
          >
            Não achou seu horário? Entrar na Lista de Espera
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <GlassCard key={i} className="h-12 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <GlassCard className="text-center py-8 space-y-3">
            <AlertCircle className="w-8 h-8 text-[var(--color-figaro-amber)] mx-auto" />
            <p className="text-sm font-semibold text-white">Nenhum horário livre nesta data.</p>
            <Button size="sm" variant="amber" onClick={() => setShowWaitlistModal(true)}>
              Entrar na Lista de Espera
            </Button>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const isSelected = selectedSlot?.startTime === slot.startTime
              return (
                <button
                  key={slot.startTime}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3 rounded-xl border font-bold text-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                    !slot.available
                      ? 'opacity-30 border-white/10 bg-white/5 line-through cursor-not-allowed text-figaro-text-secondary'
                      : isSelected
                      ? 'bg-[var(--color-figaro-blue)] border-[var(--color-figaro-blue)] text-white shadow-lg shadow-[rgba(17,175,250,0.25)] scale-105'
                      : 'glass-panel text-white hover:border-[var(--color-figaro-blue)]/50'
                  }`}
                >
                  {formatTime(slot.startTime)}
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full p-6 space-y-4 border-[var(--color-figaro-amber)]/40 shadow-2xl">
            <div className="flex items-center gap-2 text-[var(--color-figaro-amber)]">
              <Sparkles className="w-5 h-5" />
              <h4 className="font-bold text-white text-lg">Lista de Espera Inteligente</h4>
            </div>
            <p className="text-xs text-figaro-text-secondary leading-relaxed">
              Receba um alerta instantâneo no WhatsApp caso alguém cancele um horário no dia selecionado.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Seu Nome Completo"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)]"
              />
              <input
                type="tel"
                placeholder="WhatsApp (ex: 11999999999)"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowWaitlistModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="amber"
                onClick={() => {
                  useToastStore.getState().addToast('Você foi adicionado à Lista de Espera!', 'success')
                  setShowWaitlistModal(false)
                }}
              >
                Confirmar na Lista
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={() => setStep(2)}>
          Voltar
        </Button>
        <Button disabled={!selectedSlot} onClick={() => setStep(4)}>
          Avançar para Confirmação
        </Button>
      </div>
    </div>
  )
}
