import { Home, Calendar, Wallet, Scissors, Settings, Crown } from 'lucide-react'

export type BarberTab = 'home' | 'schedule' | 'financial' | 'booking' | 'settings' | 'subscriptions'

interface BarberBottomNavProps {
  activeTab: BarberTab
  onChangeTab: (tab: BarberTab) => void
}

export function BarberBottomNav({ activeTab, onChangeTab }: BarberBottomNavProps) {
  const tabs: { id: BarberTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'schedule', label: 'Agenda', icon: Calendar },
    { id: 'financial', label: 'Financeiro', icon: Wallet },
    { id: 'subscriptions', label: 'Clube', icon: Crown },
    { id: 'booking', label: 'Agendar', icon: Scissors },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:pb-4 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto w-full max-w-md bg-[#0A0E14]/85 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-around transition-all">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[56px] py-2 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[var(--color-figaro-blue)] font-bold scale-105'
                  : 'text-figaro-text-secondary hover:text-white'
              }`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute inset-0 bg-[var(--color-figaro-blue)]/15 rounded-xl border border-[var(--color-figaro-blue)]/30 shadow-[0_0_15px_rgba(17,175,250,0.4)] pointer-events-none animate-in fade-in zoom-in-95 duration-200" />
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive
                    ? 'drop-shadow-[0_0_8px_rgba(17,175,250,0.8)] stroke-[2.5]'
                    : 'stroke-[1.8]'
                }`}
              />
              <span className="text-[10px] mt-1 font-medium tracking-tight">
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
