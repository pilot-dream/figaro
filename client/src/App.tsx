import { useEffect, Suspense, lazy, useState } from 'react'
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { RequireAuth } from '@/components/auth/RequireAuth'
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const MyAppointments = lazy(() => import('@/pages/MyAppointments').then(m => ({ default: m.MyAppointments })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ClientBookingPage = lazy(() => import('@/pages/ClientBookingPage').then(m => ({ default: m.ClientBookingPage })))
const ClientWalletPage = lazy(() => import('@/pages/ClientWalletPage').then(m => ({ default: m.ClientWalletPage })))
const ClientProfilePage = lazy(() => import('@/pages/ClientProfilePage').then(m => ({ default: m.ClientProfilePage })))
const BarberBookingPage = lazy(() => import('@/pages/BarberBookingPage').then(m => ({ default: m.BarberBookingPage })))
const GamificationSettingsPage = lazy(() => import('@/pages/GamificationSettingsPage').then(m => ({ default: m.GamificationSettingsPage })))
const SubscriptionCheckout = lazy(() => import('@/pages/SubscriptionCheckout').then(m => ({ default: m.SubscriptionCheckout })))
const SubscriptionSuspended = lazy(() => import('@/pages/SubscriptionSuspended').then(m => ({ default: m.SubscriptionSuspended })))
import { Clock, LogOut, Scissors, Sparkles, Bell } from 'lucide-react'
import { ToastContainer } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PageTransition } from '@/components/ui/PageTransition'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton'
import { TrialCountdownBadge } from '@/components/dashboard/TrialCountdownBadge'
import { BranchSwitcher } from '@/components/dashboard/BranchSwitcher'
import { PushNotificationPrompt } from '@/components/ui/PushNotificationPrompt'
import { isPushSupported, wasPushPromptDismissed, getSavedPushToken } from '@/lib/firebase'

export default function App() {
  const { user, logout, initAuth, initialized } = useAuthStore()
  const addToast = useToastStore((state) => state.addToast)
  const navigate = useNavigate()
  const location = useLocation()
  const isPublicRoute = ['/login', '/registro'].includes(location.pathname)
  
  const [hasNewNotifications, setHasNewNotifications] = useState(true)
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false)
  const [showPushPrompt, setShowPushPrompt] = useState(false)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Exibe o prompt de push para clientes que ainda não ativaram
  // Delay de 3s após o login para não interromper o fluxo inicial
  useEffect(() => {
    if (!user || user.role !== 'CLIENT') return
    if (!isPushSupported()) return
    if (wasPushPromptDismissed() || getSavedPushToken()) return

    const timer = setTimeout(() => {
      setShowPushPrompt(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [user])

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
    <div className="min-h-screen w-full bg-[#05070a] text-figaro-text-primary relative overflow-x-hidden">
      <ToastContainer />
      <ConfirmModal />
      {/* Ambient Glow Orbs Removed as per request to destroy blue background */}
      {/* Main Container conditionally constrained */}
      <main className={`relative z-10 w-full min-h-screen bg-[#0A0E14] shadow-[0_0_40px_rgba(0,0,0,0.5)] ${
        isPublicRoute 
          ? '' 
          : user && ['BARBER', 'MANAGER', 'OWNER'].includes(user.role) 
            ? 'max-w-[1920px] mx-auto border-x-0' 
            : 'max-w-xl mx-auto border-x border-white/5'
      }`}>
        {/* Simple User Header Bar when authenticated */}
        {user && (
          <>
            <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-3 px-6 border-b border-white/10 bg-[#0A0E14]/85 backdrop-blur-xl ${
              ['BARBER', 'MANAGER', 'OWNER'].includes(user.role) ? 'hidden' : 'max-w-xl mx-auto'
            }`}>
            <div className="flex items-center gap-2">
              <Link 
                to={['BARBER', 'MANAGER', 'OWNER'].includes(user.role) ? '/painel' : '/meus-agendamentos'}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Scissors className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-white text-sm">FÍGARO</span>
              </Link>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-white/10 text-figaro-text-secondary">
                {user.role === 'BARBER' || user.role === 'MANAGER' || user.role === 'OWNER' ? 'PAINEL BARBEIRO' : 'ÁREA CLIENTE'}
              </span>
              <TrialCountdownBadge />
              <BranchSwitcher />
            </div>
            <div className="flex items-center gap-3">
              {/* Gamification and Appointments Links */}
              {user.role === 'CLIENT' && (
                <>
                  <div className="relative">
                    <button
                      onClick={() => {
                        setHasNewNotifications(false)
                        setShowNotificationsMenu(!showNotificationsMenu)
                      }}
                      title="Notificações"
                      className={`w-9 h-9 rounded-full border text-white flex items-center justify-center transition-colors cursor-pointer relative ${showNotificationsMenu ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <Bell className="w-4 h-4" />
                      {hasNewNotifications && (
                        <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-[#F0553F] rounded-full border border-[#0A0E14]"></span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotificationsMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowNotificationsMenu(false)}
                        />
                        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-[#121214] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h4 className="font-bold text-white text-base">Notificações</h4>
                          </div>
                          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                              <Bell className="w-6 h-6 text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-400 font-medium">Nenhuma nova notificação</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      await logout();
                      window.location.reload();
                    }}
                    title="Sair"
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-[#F0553F]" />
                  </button>
                </>
              )}
              {(user.role === 'BARBER' || user.role === 'MANAGER' || user.role === 'OWNER') && (
                <Link
                  to="/gamificacao"
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-[var(--color-figaro-amber)] hover:bg-white/10 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gamificação</span>
                </Link>
              )}
              {/* Profile Avatar */}
              {user.role !== 'CLIENT' && (
                <button
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/10 hover:border-amber-400 transition-colors cursor-pointer"
                >
                  <Link to="/painel/configuracoes">
                    <img 
                      src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=1a1c23&color=fbbf24`} 
                      alt="Perfil" 
                      className="w-full h-full object-cover"
                    />
                  </Link>
                </button>
              )}
            </div>
          </div>
          {/* Spacer so the fixed topbar doesn't cover content (only if not hidden) */}
          <div className={['BARBER', 'MANAGER', 'OWNER'].includes(user.role) ? '' : 'h-[68px] w-full'} />
          </>
        )}

        <PageTransition>
          <Suspense fallback={<DashboardSkeleton />}>
            <Routes>
            {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/assinatura-suspensa" element={<SubscriptionSuspended />} />
          <Route path="/:barberSlug/assinatura" element={<SubscriptionCheckout />} />
          <Route path="/:slug" element={<ClientBookingPage />} />

          {/* Rotas Protegidas - CLIENTE */}
          <Route element={<RequireAuth role="CLIENT" />}>
            <Route path="/meus-agendamentos" element={<MyAppointments onNewBooking={() => {}} />} />
            <Route path="/carteira" element={<ClientWalletPage />} />
            <Route path="/perfil" element={<ClientProfilePage />} />
          </Route>

          {/* Rotas Protegidas - BARBEIRO */}
          <Route element={<RequireAuth role="BARBER" />}>
            <Route path="/painel" element={<DashboardPage />} />
            <Route path="/gamificacao" element={<GamificationSettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={
              user ? (
                (user.role === 'BARBER' || user.role === 'MANAGER' || user.role === 'OWNER') ? (
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
          </Suspense>
        </PageTransition>
      </main>
      {/* Old Client Nav Removed as it conflicted with the new Premium Bottom Nav */}

      {/* Push Notification Permission Modal */}
      {showPushPrompt && (
        <PushNotificationPrompt onClose={() => setShowPushPrompt(false)} />
      )}
    </div>
  )
}
