import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import type { AppointmentStatus } from '@/types'
import { Phone, CheckCircle2, AlertCircle, ChevronDown, MessageSquare } from 'lucide-react'

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

  const statusConfig: Record<AppointmentStatus, { label: string; bg: string; text: string; border: string }> = {
    CONFIRMED: {
      label: 'Confirmado',
      bg: 'bg-[var(--color-figaro-blue)]/10',
      text: 'text-[var(--color-figaro-blue)]',
      border: 'border-[var(--color-figaro-blue)]/20',
    },
    COMPLETED: {
      label: 'Concluído',
      bg: 'bg-[var(--color-figaro-mint)]/10',
      text: 'text-[var(--color-figaro-mint)]',
      border: 'border-[var(--color-figaro-mint)]/20',
    },
    CANCELLED: {
      label: 'Cancelado',
      bg: 'bg-[var(--color-figaro-terracotta)]/10',
      text: 'text-[var(--color-figaro-terracotta)]',
      border: 'border-[var(--color-figaro-terracotta)]/20',
    },
    NO_SHOW: {
      label: 'No-Show',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/20',
    },
    PENDING: {
      label: 'Pendente',
      bg: 'bg-[var(--color-figaro-amber)]/10',
      text: 'text-[var(--color-figaro-amber)]',
      border: 'border-[var(--color-figaro-amber)]/20',
    },
  }

  const currentStatus = statusConfig[appointment.status]

  return (
    <GlassCard
      variant="interactive"
      className="p-5 space-y-3 relative transition-all duration-200 border-l-4 border-l-[var(--color-figaro-blue)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono font-bold text-sm">
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

        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowStatusMenu(!showStatusMenu)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
          >
            {currentStatus.label}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 top-9 z-30 w-36 glass-panel rounded-xl p-1.5 shadow-2xl border border-glass-border space-y-1">
              {(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] as AppointmentStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatusChange(appointment.id, st)
                      setShowStatusMenu(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg font-medium text-white hover:bg-white/10 flex items-center justify-between"
                  >
                    {statusConfig[st].label}
                    {appointment.status === st && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-figaro-blue)]" />}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 text-xs border-t border-white/5">
        <span className="text-figaro-text-secondary flex items-center gap-1">
          <Phone className="w-3.5 h-3.5 text-[var(--color-figaro-amber)]" />
          {appointment.clientPhone}
        </span>
        <span className="font-extrabold text-white">R$ {appointment.price.toFixed(2)}</span>
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
