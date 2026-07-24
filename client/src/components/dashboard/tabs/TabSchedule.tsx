import { GlassCard } from '@/components/ui/GlassCard'
import { AppointmentCard, type DashboardAppointment } from '@/components/dashboard/AppointmentCard'
import type { AppointmentStatus } from '@/types'
import { Calendar as CalendarIcon, Scissors, Filter } from 'lucide-react'
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
          <p className="text-xs text-[#8C97A8]">
            Linha do tempo e gestão de status dos seus agendamentos
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-[#8C97A8] mr-1 hidden sm:inline" />
          {filterOptions.map((opt) => {
            const isActive = filterStatus === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setFilterStatus(opt.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#11AFFA] text-white shadow-[0_0_15px_rgba(17,175,250,0.4)] font-semibold border border-[#11AFFA]'
                    : 'bg-white/[0.05] text-[#8C97A8] hover:text-white border border-white/10 backdrop-blur-md'
                }`}
              >
                {opt.label}
              </button>
            )
          })}

          {/* Styled Date Picker Pill Inline */}
          <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-inner">
            <CalendarIcon className="w-4 h-4 text-[#11AFFA] drop-shadow-[0_0_8px_rgba(17,175,250,0.8)]" />
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
          <div className="w-16 h-16 rounded-full bg-[#11AFFA]/10 border border-[#11AFFA]/20 flex items-center justify-center mx-auto text-[#11AFFA] shadow-[0_0_15px_rgba(17,175,250,0.2)]">
            <Scissors className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Nenhum agendamento para esta data</h3>
            <p className="text-xs text-[#8C97A8]">
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
