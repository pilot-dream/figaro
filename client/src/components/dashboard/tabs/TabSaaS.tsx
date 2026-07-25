import { Crown, CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

export function TabSaaS() {
  const { user } = useAuthStore()

  const isTrial = user?.saasStatus === 'TRIAL'
  const isPastDue = user?.saasStatus === 'PAST_DUE'
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            Meu Plano Fígaro
          </h2>
          <p className="text-sm text-figaro-text-secondary mt-1">Gerencie sua assinatura e faturamento</p>
        </div>
      </div>

      {isTrial && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-400">Você está no Período de Teste (Trial)</h4>
            <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
              Aproveite todas as funcionalidades do Fígaro sem custo até {user?.trialEndsAt ? new Date(user.trialEndsAt).toLocaleDateString() : 'o fim do período'}. Assine agora para evitar interrupções.
            </p>
          </div>
        </div>
      )}

      {isPastDue && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-400">Pagamento Pendente</h4>
            <p className="text-xs text-red-400/80 mt-1 leading-relaxed">
              Não conseguimos processar o último pagamento. Você está no período de tolerância até {user?.gracePeriodEndsAt ? new Date(user.gracePeriodEndsAt).toLocaleDateString() : '5 dias'}. Após isso, o acesso será bloqueado.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-panel p-6 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-black text-[10px] font-bold tracking-wider rounded-bl-lg uppercase">
            Plano Atual
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">Fígaro PRO</h3>
          <div className="flex items-end gap-1 mb-6">
            <span className="text-3xl font-bold text-amber-400">R$ 97</span>
            <span className="text-sm text-figaro-text-secondary mb-1">/mês</span>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2 text-sm text-figaro-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-green-400" /> Agendamentos Ilimitados
            </li>
            <li className="flex items-center gap-2 text-sm text-figaro-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-green-400" /> Equipe de Barbeiros (Ilimitada)
            </li>
            <li className="flex items-center gap-2 text-sm text-figaro-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-green-400" /> Lembretes Oficiais no WhatsApp
            </li>
            <li className="flex items-center gap-2 text-sm text-figaro-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-green-400" /> Split de Pagamento
            </li>
          </ul>

          <button 
            onClick={() => alert('Checkout Cakto em breve!')}
            className="w-full py-2.5 rounded-lg bg-white/5 border border-amber-500/50 hover:bg-amber-500 hover:text-black hover:border-amber-500 text-amber-400 font-semibold transition-all flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {isTrial ? 'Assinar Agora' : (isPastDue ? 'Pagar Fatura' : 'Gerenciar Assinatura')}
          </button>
        </div>

        {/* Placeholder for higher tier if needed */}
        <div className="glass-panel p-6 border-white/5 opacity-50 flex flex-col justify-center items-center text-center">
          <Crown className="w-8 h-8 text-white/20 mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Fígaro ENTERPRISE</h3>
          <p className="text-xs text-figaro-text-secondary mb-4">Para redes e franquias com múltiplas unidades e necessidades fiscais avançadas.</p>
          <span className="text-xs font-semibold text-[#11AFFA]">Em breve</span>
        </div>
      </div>
    </div>
  )
}
