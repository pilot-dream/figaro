import { useEffect, useState, useCallback } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { type DashboardAppointment } from '@/components/dashboard/AppointmentCard'
import { ClientSheet } from '@/components/dashboard/ClientSheet'
import { BlockTimeModal } from '@/components/dashboard/BlockTimeModal'
import { BarberBottomNav, type BarberTab } from '@/components/dashboard/BarberBottomNav'
import { DesktopSidebar } from '@/components/dashboard/DesktopSidebar'
import { TabHome } from '@/components/dashboard/tabs/TabHome'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton'
import { TabSchedule } from '@/components/dashboard/tabs/TabSchedule'
import { TabFinancial } from '@/components/dashboard/tabs/TabFinancial'
import { TabBooking } from '@/components/dashboard/tabs/TabBooking'
import { TabSettings } from '@/components/dashboard/tabs/TabSettings'

import { TabSaaS } from '@/components/dashboard/tabs/TabSaaS'
import { TabNetwork } from '@/components/dashboard/tabs/TabNetwork'

import type { AppointmentStatus } from '@/types'
import { fetchBarberAppointments, fetchSubscribers, updateAppointmentStatus, createBlockedTime, fetchBarberBlockedTimes, supabase } from '@/lib/api'
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
      let allAppointments = data.map(mapToDashboardAppointment)

      // Merge MRR Subscriptions into the Barber Dashboard Agenda
      try {
        const subscribers = await fetchSubscribers()
        const selectedDayOfWeek = new Date(`${selectedDate}T12:00:00-03:00`).getDay()

        const activeSubsForDay = subscribers.filter(sub => 
          sub.dayOfWeek === selectedDayOfWeek && sub.status === 'ACTIVE'
        )

        const mrrAppointments: DashboardAppointment[] = activeSubsForDay.map(sub => {
          const [h, m] = sub.time.split(':').map(Number)
          const endDate = new Date(2000, 0, 1, h + 1, m)
          const endTimeStr = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`

          return {
            id: sub.id,
            clientId: undefined,
            clientName: `${sub.clientName} (Clube)`,
            clientPhone: 'Assinante VIP',
            serviceName: sub.planName,
            startTime: sub.time,
            endTime: endTimeStr,
            price: 0,
            status: 'CONFIRMED' as AppointmentStatus,
            notes: 'Agendamento recorrente automático via Clube Figaro VIP',
            clientHistory: []
          }
        })

        allAppointments = [...allAppointments, ...mrrAppointments]
      } catch (err) {
        console.error('Error fetching subscribers for agenda:', err)
      }

      // Fetch Blocked Times to display on the agenda
      try {
        const blockedTimes = await fetchBarberBlockedTimes(user.id, selectedDate)
        const blockedAppointments: DashboardAppointment[] = blockedTimes.map(block => {
          const startTimeStr = new Date(block.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
          const endTimeStr = new Date(block.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
          
          return {
            id: block.id,
            clientId: undefined,
            clientName: 'Horário Bloqueado',
            clientPhone: '',
            serviceName: block.reason || 'Bloqueio Manual',
            startTime: startTimeStr,
            endTime: endTimeStr,
            price: 0,
            status: 'CANCELLED' as AppointmentStatus, // Using CANCELLED as a way to visually distinct it or we can add BLOCKED if supported. Let's use 'CONFIRMED' but with special styling in the card if we can't change the type. Actually, AppointmentStatus only accepts specific values. We'll use CONFIRMED but the UI handles it by name. Wait, the AppointmentCard might need a way to distinct it. Let's use 'PENDING' or just 'CONFIRMED'.
            notes: 'Horário indisponível para agendamentos.',
            clientHistory: []
          }
        })
        allAppointments = [...allAppointments, ...blockedAppointments]
      } catch (err) {
        console.error('Error fetching blocked times:', err)
      }

      // Sort all appointments by start time
      allAppointments.sort((a, b) => a.startTime.localeCompare(b.startTime))

      setAppointments(allAppointments)
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

  // Listen for custom event from the TrialBadge to navigate to SaaS tab
  useEffect(() => {
    const handleNavToSaaS = () => {
      setActiveTab('saas')
    }
    window.addEventListener('nav-to-saas-tab', handleNavToSaaS)
    return () => window.removeEventListener('nav-to-saas-tab', handleNavToSaaS)
  }, [])

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(id, newStatus)
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      )
    } catch {
      useToastStore.getState().addToast('Erro ao atualizar status', 'error')
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex w-full min-h-[100dvh]">
      {/* Sidebar Desktop */}
      <DesktopSidebar activeTab={activeTab} onChangeTab={setActiveTab} />
      
      {/* Main Content */}
      <div className="flex-1 w-full md:pl-64">
        <div className="space-y-6 pb-28 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

        {/* Render Active Tab Content */}
        {activeTab === 'home' && (
          <TabHome
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
            onOpenBlockModal={() => setShowBlockModal(true)}
          />
        )}

        {activeTab === 'financial' && user && <TabFinancial appointments={appointments} user={user} />}

        {activeTab === 'booking' && user && (
          <TabBooking
            barber={user}
            selectedDate={selectedDate}
            onAppointmentCreated={loadAppointments}
            onOpenBlockModal={() => setShowBlockModal(true)}
          />
        )}

        {activeTab === 'settings' && user && <TabSettings barber={user} />}



        {activeTab === 'saas' && user && <TabSaaS />}

        {activeTab === 'network' && user && <TabNetwork />}


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
      </div>
    </div>
  )
}

export function mapToDashboardAppointment(app: any): DashboardAppointment {
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
