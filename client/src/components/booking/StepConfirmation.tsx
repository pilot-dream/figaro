import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/stores/toast.store'
import { useBookingStore, useBookingTotals } from '@/stores/booking.store'
import { createAppointment } from '@/lib/api'
import { Scissors, Calendar, Clock, User, ShieldCheck, CheckCircle2 } from 'lucide-react'

interface StepConfirmationProps {
  onComplete: () => void
}

export function StepConfirmation({ onComplete }: StepConfirmationProps) {
  const {
    selectedServices,
    selectedBarber,
    selectedDate,
    selectedSlot,
    clientName,
    clientPhone,
    clientNotes,
    payDeposit,
    setClientInfo,
    setStep,
    resetBooking,
  } = useBookingStore()

  const { totalPrice, totalDuration } = useBookingTotals()
  const [submitting, setSubmitting] = useState(false)

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const slotStartStr = selectedSlot
    ? new Date(selectedSlot.startTime).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName || !clientPhone || !selectedSlot) return

    setSubmitting(true)
    try {
      await createAppointment({
        clientId: 'client-1',
        barberId: selectedBarber?.id || selectedSlot.barberId,
        serviceIds: selectedServices.map((s) => s.id),
        startTime: selectedSlot.startTime,
        clientName,
        clientPhone,
        notes: clientNotes,
      })
      useToastStore.getState().addToast('Agendamento confirmado com sucesso! Enviamos os detalhes para o seu WhatsApp.', 'success')
      resetBooking()
      onComplete()
    } catch {
      useToastStore.getState().addToast('Erro ao confirmar agendamento. Tente novamente.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">4. Confirmação do Agendamento</h3>
        <p className="text-xs text-figaro-text-secondary mt-1">
          Revise os detalhes e informe seus dados para finalizar.
        </p>
      </div>

      {/* Booking Ticket Summary Card */}
      <GlassCard glow className="p-6 space-y-4 border-[var(--color-figaro-blue)]/40 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-[var(--color-figaro-blue)]" />
            <span className="font-bold text-white text-base">Resumo do Corte</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-figaro-mint)]/10 text-[var(--color-figaro-mint)] border border-[var(--color-figaro-mint)]/20">
            Pré-Reservado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-figaro-text-secondary block">Serviço(s):</span>
            <ul className="mt-1 font-semibold text-white space-y-1">
              {selectedServices.map((s) => (
                <li key={s.id} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-figaro-blue)]" />
                  {s.name} (R$ {s.price.toFixed(2)})
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-figaro-text-secondary block">Barbeiro:</span>
            <p className="font-semibold text-white mt-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--color-figaro-amber)]" />
              {selectedBarber ? selectedBarber.name : 'Qualquer barbeiro disponível'}
            </p>
          </div>
          <div>
            <span className="text-figaro-text-secondary block">Data:</span>
            <p className="font-semibold text-white mt-1 flex items-center gap-1.5 capitalize">
              <Calendar className="w-3.5 h-3.5 text-[var(--color-figaro-blue)]" />
              {formattedDate}
            </p>
          </div>
          <div>
            <span className="text-figaro-text-secondary block">Horário:</span>
            <p className="font-semibold text-white mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--color-figaro-amber)]" />
              {slotStartStr} ({totalDuration} min)
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-figaro-text-secondary">Valor Total</span>
          <span className="text-2xl font-black text-white">R$ {totalPrice.toFixed(2)}</span>
        </div>
      </GlassCard>

      {/* Client Info Inputs */}
      <GlassCard className="p-6 space-y-4">
        <h4 className="font-semibold text-white text-sm">Seus Dados de Contato</h4>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientInfo({ name: e.target.value })}
              placeholder="Ex: Carlos Silva"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
              WhatsApp * (para lembretes e confirmação)
            </label>
            <input
              type="tel"
              required
              value={clientPhone}
              onChange={(e) => setClientInfo({ phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
              Observações ou Preferências (opcional)
            </label>
            <textarea
              rows={2}
              value={clientNotes}
              onChange={(e) => setClientInfo({ notes: e.target.value })}
              placeholder="Ex: Prefiro tesoura no topo, café sem açúcar..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)] transition-colors resize-none"
            />
          </div>

          {/* Deposit Option */}
          <div
            onClick={() => setClientInfo({ payDeposit: !payDeposit })}
            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              payDeposit
                ? 'border-[var(--color-figaro-mint)] bg-[var(--color-figaro-mint)]/10'
                : 'border-glass-border bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[var(--color-figaro-mint)]" />
              <div>
                <h5 className="font-semibold text-white text-xs">Pagar Sinal Garantido (Opção Pix R$ 20,00)</h5>
                <p className="text-[11px] text-figaro-text-secondary">
                  Garante prioridade total de atendimento e desconto de R$ 5 no total.
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                payDeposit
                  ? 'bg-[var(--color-figaro-mint)] border-[var(--color-figaro-mint)] text-slate-950'
                  : 'border-white/20'
              }`}
            >
              {payDeposit && <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Controls */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" type="button" onClick={() => setStep(3)}>
          Voltar
        </Button>
        <Button type="submit" size="lg" isLoading={submitting}>
          Confirmar Agendamento
        </Button>
      </div>
    </form>
  )
}
