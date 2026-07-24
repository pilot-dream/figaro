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

  if (role && user.role !== role) {
    // Redirect to proper dashboard based on user's actual role
    if (user.role === 'BARBER' || user.role === 'MANAGER') {
      return <Navigate to="/painel" replace />
    }
    return <Navigate to="/meus-agendamentos" replace />
  }

  return <Outlet />
}
