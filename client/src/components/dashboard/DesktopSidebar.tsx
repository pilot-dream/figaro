import { Home, Calendar, Wallet, Scissors, Settings, Users, LogOut, ArrowRight } from 'lucide-react'
import type { BarberTab } from './BarberBottomNav'
import { useAuthStore } from '@/stores/auth.store'

interface DesktopSidebarProps {
  activeTab: BarberTab
  onChangeTab: (tab: BarberTab) => void
}

export function DesktopSidebar({ activeTab, onChangeTab }: DesktopSidebarProps) {
  const { user, logout } = useAuthStore()

  const navItems = [
    { id: 'home' as BarberTab, label: 'Visão Geral', icon: Home },
    { id: 'schedule' as BarberTab, label: 'Agenda Diária', icon: Calendar },
    { id: 'financial' as BarberTab, label: 'Financeiro', icon: Wallet },
    { id: 'subscriptions' as BarberTab, label: 'Clube VIP', icon: Users },
    { id: 'settings' as BarberTab, label: 'Configurações', icon: Settings },
  ]

  return (
    <div className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-[#0A0E14] border-r border-white/10 z-50">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Scissors className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">FÍGARO</h1>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Painel Barbeiro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <button
          onClick={() => onChangeTab('booking')}
          className="w-full flex items-center justify-between p-3 mb-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl text-black font-bold shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Scissors className="w-5 h-5" />
            <span>Novo Agendamento</span>
          </div>
          <ArrowRight className="w-4 h-4" />
        </button>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'bg-amber-500/10 text-amber-500 font-bold' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-4 p-2">
          <img 
            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=1a1c23&color=fbbf24`}
            className="w-10 h-10 rounded-full border-2 border-white/10 object-cover"
            alt="Avatar"
          />
          <div className="flex-1 truncate">
            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            logout()
            window.location.href = '/login'
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>
    </div>
  )
}
