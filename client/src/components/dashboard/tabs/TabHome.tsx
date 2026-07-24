import { GlassCard } from '@/components/ui/GlassCard'
import { AppointmentCard, type DashboardAppointment } from '@/components/dashboard/AppointmentCard'
import type { AppointmentStatus } from '@/types'
import { DollarSign, Scissors, Users, Clock, Calendar as CalendarIcon, TrendingUp } from 'lucide-react'

interface TabHomeProps {
  appointments: DashboardAppointment[]
  selectedDate: string
  onDateChange: (date: string) => void
  onSelectClient: (app: DashboardAppointment) => void
  onStatusChange: (id: string, status: AppointmentStatus) => void
}

export function TabHome({
  appointments,
  selectedDate,
  onDateChange,
  onSelectClient,
  onStatusChange,
}: TabHomeProps) {
  // KPI Calculations
  const completed = appointments.filter((a) => a.status === 'COMPLETED')
  const confirmed = appointments.filter((a) => a.status === 'CONFIRMED')
  const pending = appointments.filter((a) => a.status === 'PENDING')

  const totalBilled = completed.reduce((acc, a) => acc + a.price, 0)
  const totalCuts = completed.length + confirmed.length
  const totalClients = new Set(appointments.map((a) => a.clientPhone)).size
  const pendingCount = pending.length + confirmed.length

  const upcomingAppointments = appointments
    .filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING')
    .slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Visão Geral</h2>
          <p className="text-xs text-figaro-text-secondary">
            Resumo de faturamento e desempenho da sua agenda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#11AFFA]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-white/5 border border-glass-border px-3 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#11AFFA] cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Cards Grid with Circular Glass Icon Containers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1: TOTAL FATURADO */}
        <GlassCard glow className="p-4 space-y-3 border-[#11AFFA]/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-figaro-text-secondary tracking-wider">
              Total Faturado
            </span>
            <div className="w-9 h-9 rounded-full bg-[#2ED9A0]/20 border border-[#2ED9A0]/40 flex items-center justify-center text-[#2ED9A0] shadow-[0_0_10px_rgba(46,217,160,0.3)]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#11AFFA] drop-shadow-[0_0_12px_rgba(17,175,250,0.5)]">
            R$ {totalBilled.toFixed(2)}
          </p>
          <span className="text-[10px] text-[#2ED9A0] font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Faturamento confirmado
          </span>
        </GlassCard>

        {/* KPI 2: TOTAL CORTES */}
        <GlassCard className="p-4 space-y-3 border-[#11AFFA]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-figaro-text-secondary tracking-wider">
              Total Cortes
            </span>
            <div className="w-9 h-9 rounded-full bg-[#11AFFA]/20 border border-[#11AFFA]/40 flex items-center justify-center text-[#11AFFA] shadow-[0_0_10px_rgba(17,175,250,0.3)]">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{totalCuts}</p>
          <span className="text-[10px] text-figaro-text-secondary">Agendamentos hoje</span>
        </GlassCard>

        {/* KPI 3: CLIENTES ATENDIDOS */}
        <GlassCard className="p-4 space-y-3 border-[var(--color-figaro-amber)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-figaro-text-secondary tracking-wider">
              Clientes Atendidos
            </span>
            <div className="w-9 h-9 rounded-full bg-[var(--color-figaro-amber)]/20 border border-[var(--color-figaro-amber)]/40 flex items-center justify-center text-[var(--color-figaro-amber)] shadow-[0_0_10px_rgba(242,169,59,0.3)]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{totalClients}</p>
          <span className="text-[10px] text-figaro-text-secondary">Clientes únicos</span>
        </GlassCard>

        {/* KPI 4: A ATENDER */}
        <GlassCard className="p-4 space-y-3 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-figaro-text-secondary tracking-wider">
              A Atender
            </span>
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{pendingCount}</p>
          <span className="text-[10px] text-figaro-text-secondary">Próximos horários</span>
        </GlassCard>
      </div>

      {/* Upcoming Clients Summary */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#11AFFA]" /> Próximos Atendimentos
        </h3>

        {upcomingAppointments.length === 0 ? (
          <GlassCard className="p-8 text-center text-xs text-figaro-text-secondary">
            Nenhum próximo cliente agendado para esta data.
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingAppointments.map((app) => (
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
    </div>
  )
}
