import { GlassCard } from '@/components/ui/GlassCard'
import { AppointmentCard, type DashboardAppointment } from '@/components/dashboard/AppointmentCard'
import type { AppointmentStatus } from '@/types'
import { Calendar as CalendarIcon, Scissors, Filter, Lock } from 'lucide-react'
import { useState } from 'react'

interface TabScheduleProps {
  appointments: DashboardAppointment[]
  selectedDate: string
  onDateChange: (date: string) => void
  onSelectClient: (app: DashboardAppointment) => void
  onStatusChange: (id: string, status: AppointmentStatus) => void
  onOpenBlockModal?: () => void
}

export function TabSchedule({
  appointments,
  selectedDate,
  onDateChange,
  onSelectClient,
  onStatusChange,
  onOpenBlockModal,
}: TabScheduleProps) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  const filteredAppointments = appointments.filter((app) => {
    if (filterStatus === 'ALL') return true
    return app.status === filterStatus
  })

  // Sort by startTime
  const sorted = [...filteredAppointments].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )

  const filterOptions: { id: string; label: string }[] = [
    { id: 'ALL', label: 'Todos' },
    { id: 'CONFIRMED', label: 'Confirmados' },
    { id: 'COMPLETED', label: 'Concluídos' },
    { id: 'CANCELLED', label: 'Cancelados' },
  ]

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Agenda do Dia</h2>
          <p className="text-xs text-figaro-text-sec">
            Linha do tempo e gestão de status dos seus agendamentos
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {onOpenBlockModal && (
            <button
              onClick={onOpenBlockModal}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold bg-white/5 border border-white/10 text-figaro-text-sec hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              Bloquear
            </button>
          )}
          
          <Filter className="w-4 h-4 text-figaro-text-sec mr-1 hidden sm:inline" />
          {filterOptions.map((opt) => {
            const isActive = filterStatus === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setFilterStatus(opt.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-figaro-gold-base text-white shadow-figaro-gold-base/30 font-semibold border border-figaro-gold-base'
                    : 'bg-white/[0.05] text-figaro-text-sec hover:text-white border border-white/10 backdrop-blur-md'
                }`}
              >
                {opt.label}
              </button>
            )
          })}

          {/* Styled Date Picker Pill Inline */}
          <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-inner">
            <CalendarIcon className="w-4 h-4 text-figaro-gold-base drop-shadow-figaro-gold-base/30" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Schedule Timeline List */}
      {sorted.length === 0 ? (
        <GlassCard className="p-12 text-center space-y-4 border border-white/10 max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-figaro-gold-base border border-figaro-gold-base flex items-center justify-center mx-auto text-figaro-gold-base shadow-figaro-gold-base/30">
            <Scissors className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Nenhum agendamento para esta data</h3>
            <p className="text-xs text-figaro-text-sec">
              Não foram encontrados agendamentos registrados no filtro selecionado.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {sorted.map((app) => (
            <AppointmentCard
              key={app.id}
              appointment={app}
              onSelectClient={onSelectClient}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
