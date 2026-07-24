import { useBookingStore } from '@/stores/booking.store'
import { BookingProgress } from '@/components/booking/BookingProgress'
import { StepServices } from '@/components/booking/StepServices'
import { StepBarber } from '@/components/booking/StepBarber'
import { StepDateTime } from '@/components/booking/StepDateTime'
import { StepConfirmation } from '@/components/booking/StepConfirmation'
import { ProfileSwitcher } from '@/components/ui/ProfileSwitcher'
import { ArrowLeft, Scissors } from 'lucide-react'

interface BookingPageProps {
  onBackToHome: () => void
  onFinishBooking: () => void
}

export function BookingPage({ onBackToHome, onFinishBooking }: BookingPageProps) {
  const { step } = useBookingStore()

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-white/10 pb-4">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-figaro-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </button>
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-[var(--color-figaro-blue)]" />
          <span className="text-xs font-bold tracking-widest uppercase text-white">FÍGARO</span>
        </div>
        <ProfileSwitcher />
      </div>

      {/* Progress Bar */}
      <BookingProgress />

      {/* Step Render */}
      <div className="mt-4 ios-transition transition-all duration-300">
        {step === 1 && <StepServices />}
        {step === 2 && <StepBarber />}
        {step === 3 && <StepDateTime />}
        {step === 4 && <StepConfirmation onComplete={onFinishBooking} />}
      </div>
    </div>
  )
}
