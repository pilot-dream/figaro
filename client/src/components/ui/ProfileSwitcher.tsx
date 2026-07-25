import { useAuthStore } from '@/stores/auth.store'

export function ProfileSwitcher() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-white/10 text-figaro-text-secondary">
      {user.role === 'BARBER' || user.role === 'MANAGER' || user.role === 'OWNER' ? 'PAINEL BARBEIRO' : 'ÁREA CLIENTE'}
    </span>
  )
}
