import { useEffect } from 'react'
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { MyAppointments } from '@/pages/MyAppointments'
import { DashboardPage } from '@/pages/DashboardPage'
import { BarberBookingPage } from '@/pages/BarberBookingPage'
import { Clock, LogOut, Scissors } from 'lucide-react'

export default function App() {
  const { user, logout, initAuth, initialized } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!initialized) {
    return (
      <div className="min-h-screen w-full bg-[#0A0E14] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-figaro-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0E14] text-figaro-text-primary selection:bg-[var(--color-figaro-blue)] selection:text-white relative overflow-x-hidden">
      {/* Full Viewport Viewport-Wide Ambient Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-[#11AFFA]/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-[#F2A93B]/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#11AFFA]/10 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Main Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 pt-4">
        {/* Simple User Header Bar when authenticated */}
        {user && (
          <div className="flex items-center justify-between py-2 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-[var(--color-figaro-blue)]" />
              <span className="font-bold text-white text-sm">FÍGARO</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-white/10 text-figaro-text-secondary">
                {user.role === 'BARBER' ? 'PAINEL BARBEIRO' : 'ÁREA CLIENTE'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {user.role === 'CLIENT' && (
                <Link
                  to="/meus-agendamentos"
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 flex items-center gap-1.5 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-[#11AFFA]" />
                  <span className="hidden sm:inline">Meus Agendamentos</span>
                </Link>
              )}
              <span className="text-xs text-figaro-text-secondary hidden sm:inline">
                Olá, <strong className="text-white">{user.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 rounded-lg glass-panel text-xs text-red-400 hover:text-white hover:bg-red-500/20 flex items-center gap-1 border-glass-border transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            </div>
          </div>
        )}

        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/:slug" element={<BarberBookingPage />} />

          {/* Rotas Protegidas - CLIENTE */}
          <Route element={<RequireAuth role="CLIENT" />}>
            <Route path="/meus-agendamentos" element={<MyAppointments onNewBooking={() => {}} />} />
          </Route>

          {/* Rotas Protegidas - BARBEIRO */}
          <Route element={<RequireAuth role="BARBER" />}>
            <Route path="/painel" element={<DashboardPage />} />
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={
              user ? (
                user.role === 'BARBER' ? (
                  <Navigate to="/painel" replace />
                ) : (
                  <Navigate to="/meus-agendamentos" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </main>
    </div>
  )
}
