import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import type { AppointmentStatus } from '@/types'
import { Phone, CheckCircle2, AlertCircle, ChevronDown, MessageSquare, Clock } from 'lucide-react'

export interface DashboardAppointment {
  id: string
  clientId?: string
  clientName: string
  clientPhone: string
  serviceName: string
  startTime: string
  endTime: string
  price: number
  status: AppointmentStatus
  notes?: string
  clientHistory?: string[]
}

interface AppointmentCardProps {
  appointment: DashboardAppointment
  onSelectClient: (appointment: DashboardAppointment) => void
  onStatusChange: (id: string, newStatus: AppointmentStatus) => void
}

export function AppointmentCard({
  appointment,
  onSelectClient,
  onStatusChange,
}: AppointmentCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const statusConfig: Record<
    AppointmentStatus,
    { label: string; bg: string; text: string; border: string; bar: string }
  > = {
    CONFIRMED: {
      label: 'Confirmado',
      bg: 'bg-[#2ED9A0]/15',
      text: 'text-[#2ED9A0]',
      border: 'border-[#2ED9A0]/30',
      bar: 'border-l-[#2ED9A0]',
    },
    COMPLETED: {
      label: 'Concluído',
      bg: 'bg-[#8C97A8]/20',
      text: 'text-[#8C97A8]',
      border: 'border-[#8C97A8]/30',
      bar: 'border-l-[#8C97A8]',
    },
    CANCELLED: {
      label: 'Cancelado',
      bg: 'bg-[#F0553F]/15',
      text: 'text-[#F0553F]',
      border: 'border-[#F0553F]/30',
      bar: 'border-l-[#F0553F]',
    },
    NO_SHOW: {
      label: 'No-Show',
      bg: 'bg-red-500/15',
      text: 'text-red-400',
      border: 'border-red-500/30',
      bar: 'border-l-red-500',
    },
    PENDING: {
      label: 'Pendente',
      bg: 'bg-amber-500/15',
      text: 'text-amber-500',
      border: 'border-amber-500/30',
      bar: 'border-l-[#11AFFA]',
    },
  }

  const currentStatus = statusConfig[appointment.status] || statusConfig.CONFIRMED
  const rawPhoneNumbers = appointment.clientPhone ? appointment.clientPhone.replace(/\D/g, '') : ''

  return (
    <GlassCard
      variant="interactive"
      className={`p-5 space-y-3 transition-all duration-200 border-l-[5px] ${currentStatus.bar} bg-white/[0.04] backdrop-blur-xl border border-white/[0.1] hover:border-white/[0.2] rounded-2xl shadow-lg relative ${
        showStatusMenu ? 'z-[999] overflow-visible shadow-2xl ring-1 ring-amber-500/40' : 'z-10 overflow-hidden'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Tabular Time Badge */}
          <div className="bg-white/10 border border-white/15 text-white font-mono font-black text-sm px-3 py-1.5 rounded-xl shadow-inner flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {appointment.startTime}
          </div>

          <div>
            <div
              onClick={() => onSelectClient(appointment)}
              className="group cursor-pointer flex items-center gap-1.5"
            >
              <h4 className="font-semibold text-[#F2F4F7] text-lg group-hover:text-amber-500 transition-colors">
                {appointment.clientName}
              </h4>
              <MessageSquare className="w-4 h-4 text-figaro-text-secondary group-hover:text-white" />
            </div>
            <p className="text-sm font-medium text-amber-500">
              {appointment.serviceName}
            </p>
          </div>
        </div>

        {/* Status Dropdown Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowStatusMenu(!showStatusMenu)
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
          >
            {currentStatus.label}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showStatusMenu && (
            <>
              {/* Backdrop capture to close dropdown when clicking outside */}
              <div
                className="fixed inset-0 z-40 bg-transparent cursor-default"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowStatusMenu(false)
                }}
              />

              {/* Floating Dropdown Menu */}
              <div className="absolute right-0 top-10 z-[9999] w-44 bg-[#0A0E14] backdrop-blur-2xl rounded-2xl p-1.5 shadow-[0_10px_38px_rgba(0,0,0,0.9)] border border-white/20 space-y-1">
                {(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] as AppointmentStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(appointment.id, st)
                        setShowStatusMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl font-medium text-white hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      {statusConfig[st].label}
                      {appointment.status === st && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 text-xs border-t border-white/5">
        {/* Interactive WhatsApp Direct Link */}
        {rawPhoneNumbers ? (
          <a
            href={`https://wa.me/55${rawPhoneNumbers}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-[#2ED9A0] hover:underline font-semibold text-xs bg-[#2ED9A0]/10 border border-[#2ED9A0]/20 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#2ED9A0]" />
            {appointment.clientPhone}
          </a>
        ) : (
          <span className="text-figaro-text-secondary flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-[var(--color-figaro-amber)]" />
            {appointment.clientPhone}
          </span>
        )}

        <span className="font-mono font-bold text-base text-[#F2F4F7]">
          R$ {appointment.price.toFixed(2)}
        </span>
      </div>

      {appointment.notes && (
        <div className="bg-[var(--color-figaro-amber)]/10 border border-[var(--color-figaro-amber)]/20 px-3 py-1.5 rounded-lg text-[11px] text-[var(--color-figaro-amber)] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{appointment.notes}</span>
        </div>
      )}
    </GlassCard>
  )
}
