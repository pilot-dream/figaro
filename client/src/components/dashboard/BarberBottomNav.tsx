import { Home, Calendar, Wallet, Scissors, Settings, Crown, Building2, Users } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

export type BarberTab = 'home' | 'schedule' | 'financial' | 'booking' | 'settings' | 'subscriptions' | 'saas' | 'network' | 'team'

interface BarberBottomNavProps {
  activeTab: BarberTab
  onChangeTab: (tab: BarberTab) => void
}

export function BarberBottomNav({ activeTab, onChangeTab }: BarberBottomNavProps) {
  // We strictly show 5 tabs for the bottom nav as requested
  const tabs = [
    { id: 'home' as BarberTab, label: 'Início', icon: Home },
    { id: 'schedule' as BarberTab, label: 'Agenda', icon: Calendar },
    { id: 'booking' as BarberTab, label: 'Agendar', icon: Scissors }, // Center
    { id: 'financial' as BarberTab, label: 'Carteira', icon: Wallet },
    { id: 'settings' as BarberTab, label: 'Perfil', icon: Settings },
  ]

  const { user } = useAuthStore()

  if (user?.role === 'OWNER') {
    tabs.push({ id: 'subscriptions', label: 'Clube', icon: Crown })
  }



  // Se o usuário for OWNER e plano ENTERPRISE, adicionamos a aba Rede
  if (user?.role === 'OWNER' && user?.subscriptionPlan === 'ENTERPRISE') {
    tabs.push({ id: 'network', label: 'Rede', icon: Building2 })
  }
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2 md:hidden">
      <nav className="bg-figaro-black/85 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/80 flex items-center justify-between px-6 py-1.5 max-w-lg mx-auto rounded-full relative">
        {tabs.map((tab, index) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          // Center Floating Button
          if (index === 2) {
            return (
              <div key={tab.id} className="relative -top-2.5 mx-2">
                <button 
                  onClick={() => onChangeTab(tab.id)}
                  className="bg-gradient-to-r from-figaro-gold-light to-figaro-gold-base p-3 rounded-full shadow-[0_4px_15px_rgba(245,158,11,0.4)] border-4 border-[#0A0E14] text-white transform active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer w-16 h-16"
                >
                  <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                </button>
              </div>
            )
          }

          // Other tabs
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[50px] transition-colors ${
                isActive ? 'text-figaro-gold-base font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`text-[10px] font-medium mt-1 ${isActive ? 'text-figaro-gold-base' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-figaro-gold-base rounded-full mx-auto mt-1 shadow-sm shadow-figaro-gold-base/30" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
