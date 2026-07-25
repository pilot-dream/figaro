import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { fetchBarbers } from '@/lib/api'
import type { User } from '@/types'
import { useBookingStore } from '@/stores/booking.store'
import { Check, UserCheck, Star, Sparkles } from 'lucide-react'

export function StepBarber() {
  const [barbers, setBarbers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedBarber, setSelectedBarber, setStep } = useBookingStore()

  useEffect(() => {
    fetchBarbers().then((data) => {
      setBarbers(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">2. Escolha o Barbeiro</h3>
        <p className="text-xs text-figaro-text-secondary mt-1">
          Escolha o profissional de sua preferência ou opte por qualquer horário livre.
        </p>
      </div>

      {/* Option: Any Barber */}
      <GlassCard
        variant="interactive"
        onClick={() => setSelectedBarber(null)}
        className={`flex items-center justify-between border-2 transition-all p-5 ${
          selectedBarber === null
            ? 'border-[var(--color-figaro-blue)] bg-[var(--color-figaro-blue)]/10 shadow-lg shadow-[rgba(17,175,250,0.15)]'
            : 'border-glass-border'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-figaro-blue)]/30 to-[var(--color-figaro-amber)]/20 flex items-center justify-center border border-white/20">
            <Sparkles className="w-6 h-6 text-[var(--color-figaro-blue)]" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Sem Preferência</h4>
            <p className="text-xs text-figaro-text-secondary">
              Maior variedade de horários livres disponíveis.
            </p>
          </div>
        </div>
        <div
          className={`w-6 h-6 rounded-lg border flex items-center justify-center ${
            selectedBarber === null
              ? 'bg-[var(--color-figaro-blue)] border-[var(--color-figaro-blue)] text-white'
              : 'border-white/20'
          }`}
        >
          {selectedBarber === null && <Check className="w-4 h-4" />}
        </div>
      </GlassCard>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/10" />
        <span className="flex-shrink mx-4 text-xs font-semibold text-figaro-text-secondary uppercase tracking-widest">
          Ou escolha um Barbeiro
        </span>
        <div className="flex-grow border-t border-white/10" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="h-24 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {barbers.map((barber) => {
            const isSelected = selectedBarber?.id === barber.id
            return (
              <GlassCard
                key={barber.id}
                variant="interactive"
                onClick={() => setSelectedBarber(barber)}
                className={`border-2 transition-all p-5 text-center flex flex-col items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-[var(--color-figaro-blue)] bg-[var(--color-figaro-blue)]/10 shadow-lg shadow-[rgba(17,175,250,0.15)]'
                    : 'border-glass-border'
                }`}
              >
                <img
                  src={barber.avatarUrl}
                  alt={barber.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-glass-border shadow-md"
                />
                <div>
                  <h4 className="font-semibold text-white text-sm">{barber.name}</h4>
                  {barber.specialty && (
                    <p className="text-xs font-semibold text-[var(--color-figaro-amber)] mt-0.5">{barber.specialty}</p>
                  )}
                  <p className="text-xs text-figaro-text-secondary line-clamp-2 mt-1">{barber.notes}</p>
                </div>

                <div className="flex items-center gap-1 text-xs text-[var(--color-figaro-amber)]">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-white text-xs font-bold">5.0</span>
                </div>

                <div
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-[var(--color-figaro-blue)] text-white'
                      : 'bg-white/5 text-figaro-text-secondary'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" /> Selecionado
                    </>
                  ) : (
                    'Escolher este'
                  )}
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={() => setStep(1)}>
          Voltar
        </Button>
        <Button onClick={() => setStep(3)}>Avançar para Data/Horário</Button>
      </div>
    </div>
  )
}
