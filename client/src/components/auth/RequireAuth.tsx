import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import type { Role } from '@/types'

interface RequireAuthProps {
  role?: Role
}

export function RequireAuth({ role }: RequireAuthProps) {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Lógica de Bloqueio SaaS para as roles da barbearia
  if (user.role === 'OWNER' || user.role === 'MANAGER' || user.role === 'BARBER') {
    const now = new Date()

    if (user.saasStatus === 'CANCELED') {
      return <Navigate to="/assinatura-suspensa" replace />
    }
    if (user.saasStatus === 'TRIAL' && user.trialEndsAt && now > new Date(user.trialEndsAt)) {
      return <Navigate to="/assinatura-suspensa" replace />
    }
    if (user.saasStatus === 'PAST_DUE' && user.gracePeriodEndsAt && now > new Date(user.gracePeriodEndsAt)) {
      return <Navigate to="/assinatura-suspensa" replace />
    }
  }

  if (role && user.role !== role) {
    // Redirect to proper dashboard based on user's actual role
    if (user.role === 'BARBER' || user.role === 'MANAGER' || user.role === 'OWNER') {
      return <Outlet />
    }
    return <Navigate to="/meus-agendamentos" replace />
  }

  return <Outlet />
}
