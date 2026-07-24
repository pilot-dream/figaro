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
      bg: 'bg-[#2ED9A0]/15',
      text: 'text-[#2ED9A0]',
      border: 'border-[#2ED9A0]/30',
      bar: 'border-l-[#2ED9A0]',
    },
    CANCELLED: {
      label: 'Cancelado',
      bg: 'bg-[var(--color-figaro-terracotta)]/15',
      text: 'text-[var(--color-figaro-terracotta)]',
      border: 'border-[var(--color-figaro-terracotta)]/30',
      bar: 'border-l-[var(--color-figaro-terracotta)]',
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
      bg: 'bg-[var(--color-figaro-amber)]/15',
      text: 'text-[var(--color-figaro-amber)]',
      border: 'border-[var(--color-figaro-amber)]/30',
      bar: 'border-l-[var(--color-figaro-amber)]',
    },
  }

  const currentStatus = statusConfig[appointment.status] || statusConfig.CONFIRMED

  return (
    <GlassCard
      variant="interactive"
      className={`p-5 space-y-3 transition-all duration-200 border-l-[6px] ${currentStatus.bar} ${
        showStatusMenu ? 'relative z-50 shadow-2xl' : 'relative z-10'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Highlighted Time Badge */}
          <div className="bg-[#11AFFA]/15 border border-[#11AFFA]/40 text-[#11AFFA] font-mono font-black text-sm px-3 py-1.5 rounded-xl shadow-[0_0_12px_rgba(17,175,250,0.25)] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {appointment.startTime}
          </div>

          <div>
            <div
              onClick={() => onSelectClient(appointment)}
              className="group cursor-pointer flex items-center gap-1.5"
            >
              <h4 className="font-bold text-white text-base group-hover:text-[var(--color-figaro-blue)] transition-colors">
                {appointment.clientName}
              </h4>
              <MessageSquare className="w-3.5 h-3.5 text-figaro-text-secondary group-hover:text-white" />
            </div>
            <p className="text-xs font-semibold text-[var(--color-figaro-blue)]">
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
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
          >
            {currentStatus.label}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showStatusMenu && (
            <>
              {/* Backdrop capture to close menu when clicking outside */}
              <div
                className="fixed inset-0 z-40 bg-transparent cursor-default"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowStatusMenu(false)
                }}
              />

              {/* Floating Dropdown Menu */}
              <div className="absolute right-0 top-9 z-50 w-40 bg-[#0A0E14]/95 backdrop-blur-xl rounded-xl p-1.5 shadow-2xl border border-white/20 space-y-1">
                {(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] as AppointmentStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(appointment.id, st)
                        setShowStatusMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg font-medium text-white hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      {statusConfig[st].label}
                      {appointment.status === st && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-figaro-blue)]" />
                      )}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 text-xs border-t border-white/5">
        <span className="text-figaro-text-secondary flex items-center gap-1">
          <Phone className="w-3.5 h-3.5 text-[var(--color-figaro-amber)]" />
          {appointment.clientPhone}
        </span>
        <span className="font-extrabold text-white text-sm">R$ {appointment.price.toFixed(2)}</span>
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
