import { useAuthStore } from '@/stores/auth.store'

export function ProfileSwitcher() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <span className="text-[10px] px-2.5 py-1 rounded-full font-mono font-bold uppercase bg-white/10 text-figaro-text-secondary border border-glass-border">
      {user.role === 'BARBER' ? 'Barbeiro' : 'Cliente'}
    </span>
  )
}
