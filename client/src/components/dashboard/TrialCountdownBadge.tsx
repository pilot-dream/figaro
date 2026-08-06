import { Clock } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

export function TrialCountdownBadge() {
  const { user } = useAuthStore()

  // Mostramos o badge apenas para o OWNER se ele estiver em TRIAL e tiver a data definida
  if (user?.role !== 'OWNER' || user?.saasStatus !== 'TRIAL' || !user?.trialEndsAt) {
    return null
  }

  const trialEnd = new Date(user.trialEndsAt)
  const now = new Date()
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Se já expirou, não mostramos esse badge (o RequireAuth já deve ter bloqueado a tela)
  if (diffDays < 0) return null

  let text = `${diffDays} dias de teste`
  if (diffDays === 1) text = 'Último dia de teste!'
  if (diffDays === 0) text = 'Expira hoje!'

  return (
    <button
      onClick={() => {
        // Redireciona para o Painel, e lá dentro a aba "Meu Plano" pode ser ativada
        // Você pode tratar o redirecionamento diretamente para a aba dependendo da lógica do seu state de navegação.
        // Aqui assumiremos que o usuário já está no painel, então vamos só emitir um evento customizado ou forçar navegação.
        // O ideal é usar o state ou emitir um evento. Como não temos um hook global para abas, 
        // disparamos um evento customizado que o DashboardPage pode ouvir.
        window.dispatchEvent(new CustomEvent('nav-to-saas-tab'))
      }}
      className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-figaro-gold-base border border-figaro-gold-base hover:bg-figaro-gold-base transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)] group"
    >
      <Clock className="w-3.5 h-3.5 text-figaro-gold-base group-hover:animate-pulse" />
      <span className="text-[10px] font-bold tracking-wide uppercase text-figaro-gold-base">
        {text}
      </span>
    </button>
  )
}
