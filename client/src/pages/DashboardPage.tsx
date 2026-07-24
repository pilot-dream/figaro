import { useEffect, useState, useCallback } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuthStore } from '@/stores/auth.store'
import { type DashboardAppointment } from '@/components/dashboard/AppointmentCard'
import { ClientSheet } from '@/components/dashboard/ClientSheet'
import { BlockTimeModal } from '@/components/dashboard/BlockTimeModal'
import { BarberBottomNav, type BarberTab } from '@/components/dashboard/BarberBottomNav'

import { TabHome } from '@/components/dashboard/tabs/TabHome'
import { TabSchedule } from '@/components/dashboard/tabs/TabSchedule'
import { TabFinancial } from '@/components/dashboard/tabs/TabFinancial'
import { TabBooking } from '@/components/dashboard/tabs/TabBooking'
import { TabSettings } from '@/components/dashboard/tabs/TabSettings'

import type { AppointmentStatus } from '@/types'
import { fetchBarberAppointments, updateAppointmentStatus, createBlockedTime, supabase } from '@/lib/api'
import { getBrasiliaTodayStr } from '@/lib/date'

export function DashboardPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<BarberTab>('home')
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(getBrasiliaTodayStr())
  const [selectedClient, setSelectedClient] = useState<DashboardAppointment | null>(null)
  const [showBlockModal, setShowBlockModal] = useState(false)

  const loadAppointments = useCallback(async () => {
    if (!user) return
    try {
      const data = await fetchBarberAppointments(user.id, selectedDate)
      setAppointments(data.map(mapToDashboardAppointment))
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setLoading(false)
    }
  }, [user, selectedDate])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  // Realtime updates from Supabase
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('public:appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          loadAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, loadAppointments])

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(id, newStatus)
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      )
    } catch {
      alert('Erro ao atualizar status')
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <GlassCard className="p-8 animate-pulse bg-white/5 space-y-3">
          <div className="w-16 h-16 rounded-full bg-white/10 mx-auto" />
          <div className="h-4 w-32 bg-white/10 mx-auto rounded" />
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex items-center justify-between bg-white/5 border border-glass-border p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <img
            src={
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'
            }
            alt={user?.name}
            className="w-12 h-12 rounded-full object-cover border border-[var(--color-figaro-blue)] shadow-md"
          />
          <div>
            <span className="text-[10px] font-bold text-[var(--color-figaro-amber)] uppercase tracking-wider">
              Painel do Barbeiro
            </span>
            <h1 className="text-lg font-black text-white">{user?.name || 'Barbeiro'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-figaro-mint)] animate-pulse" />
          <span className="text-xs font-semibold text-[var(--color-figaro-mint)] hidden sm:inline">
            Agenda Conectada em Tempo Real
          </span>
        </div>
      </div>

      {/* Render Active Tab Content */}
      {activeTab === 'home' && (
        <TabHome
          appointments={appointments}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onSelectClient={setSelectedClient}
          onStatusChange={handleStatusChange}
        />
      )}

      {activeTab === 'schedule' && (
        <TabSchedule
          appointments={appointments}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onSelectClient={setSelectedClient}
          onStatusChange={handleStatusChange}
        />
      )}

      {activeTab === 'financial' && <TabFinancial appointments={appointments} />}

      {activeTab === 'booking' && user && (
        <TabBooking
          barber={user}
          selectedDate={selectedDate}
          onAppointmentCreated={loadAppointments}
          onOpenBlockModal={() => setShowBlockModal(true)}
        />
      )}

      {activeTab === 'settings' && user && <TabSettings barber={user} />}

      {/* Liquid Glass Bottom Navigation Bar */}
      <BarberBottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Client History Drawer */}
      {selectedClient && (
        <ClientSheet
          appointment={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSaveNotes={loadAppointments}
        />
      )}

      {/* Block Time Modal */}
      {showBlockModal && (
        <BlockTimeModal
          onClose={() => setShowBlockModal(false)}
          onBlock={async (reason, time) => {
            if (user) {
              const times = time.split(' - ')
              const startTime = `${selectedDate}T${times[0] || '12:00'}:00-03:00`
              const endTime = `${selectedDate}T${times[1] || '13:00'}:00-03:00`
              await createBlockedTime(user.id, startTime, endTime, reason)
              loadAppointments()
            }
          }}
        />
      )}
    </div>
  )
}

function mapToDashboardAppointment(app: any): DashboardAppointment {
  const serviceName =
    app.services && app.services.length > 0
      ? app.services.map((s: any) => s.name).join(' + ')
      : 'Corte Tradicional'

  const startTimeStr = app.startTime
    ? new Date(app.startTime).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
    : '09:00'

  const endTimeStr = app.endTime
    ? new Date(app.endTime).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
    : '09:45'

  return {
    id: app.id,
    clientId: app.clientId,
    clientName: app.clientName || 'Cliente',
    clientPhone: app.clientPhone || '(11) 99999-9999',
    serviceName,
    startTime: startTimeStr,
    endTime: endTimeStr,
    price: app.totalPrice || 50,
    status: app.status || 'CONFIRMED',
    notes: app.notes,
    clientHistory: [
      'Corte Degradê + Barba em 12/05',
      'Corte Tradicional em 28/04',
      'Alinhamento de Barba em 10/04',
    ],
  }
}
