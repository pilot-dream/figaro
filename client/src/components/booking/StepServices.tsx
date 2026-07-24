import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { fetchServices } from '@/lib/api'
import type { Service } from '@/types'
import { useBookingStore, useBookingTotals } from '@/stores/booking.store'
import { Check, Clock, Sparkles } from 'lucide-react'

export function StepServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedServices, toggleService, setStep } = useBookingStore()
  const { totalPrice, totalDuration } = useBookingTotals()

  useEffect(() => {
    fetchServices().then((data) => {
      setServices(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">1. Escolha o(s) Serviço(s)</h3>
        <p className="text-xs text-figaro-text-secondary mt-1">
          Você pode selecionar mais de um serviço para o mesmo horário.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="h-24 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((srv) => {
            const isSelected = selectedServices.some((s) => s.id === srv.id)
            return (
              <GlassCard
                key={srv.id}
                variant="interactive"
                onClick={() => toggleService(srv)}
                className={`flex items-center justify-between border-2 transition-all ${
                  isSelected
                    ? 'border-[var(--color-figaro-blue)] bg-[var(--color-figaro-blue)]/10 shadow-lg shadow-[rgba(17,175,250,0.15)]'
                    : 'border-glass-border'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-1 transition-colors ${
                      isSelected
                        ? 'bg-[var(--color-figaro-blue)] border-[var(--color-figaro-blue)] text-white'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">{srv.name}</h4>
                    <p className="text-xs text-figaro-text-secondary mt-0.5">{srv.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-figaro-amber)] mt-2 font-medium">
                      <Clock className="w-3.5 h-3.5" /> {srv.durationMin} minutos
                    </span>
                  </div>
                </div>
                <div className="text-right pl-4">
                  <span className="text-lg font-bold text-white">R$ {srv.price.toFixed(2)}</span>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      {/* Sticky Bottom Summary Bar */}
      <GlassCard className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40 p-4 border-[var(--color-figaro-blue)]/30 backdrop-blur-2xl flex items-center justify-between shadow-2xl">
        <div>
          <p className="text-[10px] uppercase font-bold text-figaro-text-secondary tracking-wider">Total Selecionado</p>
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-white">R$ {totalPrice.toFixed(2)}</span>
            <span className="text-xs text-[var(--color-figaro-amber)] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {totalDuration} min
            </span>
          </div>
        </div>
        <Button
          disabled={selectedServices.length === 0}
          onClick={() => setStep(2)}
          size="md"
        >
          Avançar para Barbeiro
        </Button>
      </GlassCard>
    </div>
  )
}
