import { useBookingStore } from '@/stores/booking.store'
import { Check } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Serviços' },
  { id: 2, label: 'Barbeiro' },
  { id: 3, label: 'Data & Hora' },
  { id: 4, label: 'Confirmação' },
]

export function BookingProgress() {
  const { step, setStep } = useBookingStore()

  return (
    <div className="w-full space-y-2 py-4">
      <div className="flex items-center justify-between">
        {STEPS.map((s, idx) => {
          const isCompleted = step > s.id
          const isCurrent = step === s.id
          return (
            <div key={s.id} className="flex items-center gap-2">
              <button
                disabled={s.id > step}
                onClick={() => setStep(s.id as 1 | 2 | 3 | 4)}
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[var(--color-figaro-mint)] text-slate-950'
                    : isCurrent
                    ? 'bg-[var(--color-figaro-blue)] text-white ring-4 ring-[var(--color-figaro-blue)]/20 shadow-lg'
                    : 'bg-white/10 text-figaro-text-secondary'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : s.id}
              </button>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isCurrent ? 'text-white font-semibold' : 'text-figaro-text-secondary'
                }`}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className="w-6 sm:w-12 h-0.5 bg-white/10 mx-1 rounded-full hidden sm:block" />
              )}
            </div>
          )
        })}
      </div>
      {/* Mobile step label indicator */}
      <div className="sm:hidden text-center text-xs font-bold text-[var(--color-figaro-blue)] uppercase tracking-wider">
        Etapa {step} de 4: {STEPS.find((s) => s.id === step)?.label}
      </div>
    </div>
  )
}
