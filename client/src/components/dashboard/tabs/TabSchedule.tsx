import { GlassCard } from '@/components/ui/GlassCard'
import { AppointmentCard, type DashboardAppointment } from '@/components/dashboard/AppointmentCard'
import type { AppointmentStatus } from '@/types'
import { Calendar as CalendarIcon, Clock, Filter } from 'lucide-react'
import { useState } from 'react'

interface TabScheduleProps {
  appointments: DashboardAppointment[]
  selectedDate: string
  onDateChange: (date: string) => void
  onSelectClient: (app: DashboardAppointment) => void
  onStatusChange: (id: string, status: AppointmentStatus) => void
}

export function TabSchedule({
  appointments,
  selectedDate,
  onDateChange,
  onSelectClient,
  onStatusChange,
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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Agenda do Dia</h2>
          <p className="text-xs text-figaro-text-secondary">
            Linha do tempo e gestão de status dos seus agendamentos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white/5 border border-glass-border p-1 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-figaro-text-secondary ml-1.5" />
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-[var(--color-figaro-blue)] text-white'
                  : 'text-figaro-text-secondary hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('CONFIRMED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'CONFIRMED'
                  ? 'bg-[var(--color-figaro-blue)] text-white'
                  : 'text-figaro-text-secondary hover:text-white'
              }`}
            >
              Confirmados
            </button>
            <button
              onClick={() => setFilterStatus('COMPLETED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'COMPLETED'
                  ? 'bg-[var(--color-figaro-mint)] text-white'
                  : 'text-figaro-text-secondary hover:text-white'
              }`}
            >
              Concluídos
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[var(--color-figaro-blue)]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-white/5 border border-glass-border px-3 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[var(--color-figaro-blue)] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Schedule List */}
      {sorted.length === 0 ? (
        <GlassCard className="p-10 text-center space-y-3 border border-white/10">
          <Clock className="w-10 h-10 text-figaro-text-secondary mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-figaro-text-secondary">
            Não há clientes agendados para este filtro ou data.
          </p>
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
