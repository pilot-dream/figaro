import { Crown, CheckCircle2, AlertTriangle, CreditCard, Building2, Globe, Zap } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

export function TabSaaS() {
  const { user } = useAuthStore()

  const isTrial = user?.saasStatus === 'TRIAL'
  const isPastDue = user?.saasStatus === 'PAST_DUE'
  const isEnterprise = user?.subscriptionPlan === 'ENTERPRISE'
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-figaro-gold-base" />
            Meu Plano Fígaro
          </h2>
          <p className="text-sm text-figaro-text-secondary mt-1">Gerencie sua assinatura e faturamento</p>
        </div>
      </div>

      {isTrial && (
        <div className="p-4 rounded-xl bg-figaro-gold-base border border-figaro-gold-base flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-figaro-gold-base shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-figaro-gold-base">Você está no Período de Teste (Trial)</h4>
            <p className="text-xs text-figaro-gold-base/80 mt-1 leading-relaxed">
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
        {/* FÍGARO PRO */}
        <div className={`glass-panel p-6 relative overflow-hidden group transition-all ${
          !isEnterprise 
            ? 'border-figaro-gold-base shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
            : 'border-white/5 opacity-70'
        }`}>
          {!isEnterprise && (
            <div className="absolute top-0 right-0 px-3 py-1 bg-figaro-gold-base text-black text-[10px] font-bold tracking-wider rounded-bl-lg uppercase">
              Plano Atual
            </div>
          )}
          
          <h3 className="text-2xl font-bold text-white mb-2">Fígaro PRO</h3>
          <div className="flex items-end gap-1 mb-6">
            <span className="text-3xl font-bold text-figaro-gold-base">R$ 97</span>
            <span className="text-sm text-figaro-text-secondary mb-1">/mês</span>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2 text-sm text-figaro-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Agendamentos Ilimitados
            </li>
            <li className="flex items-center gap-2 text-sm text-figaro-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Equipe de Barbeiros (Ilimitada)
            </li>
            <li className="flex items-center gap-2 text-sm text-figaro-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Lembretes Oficiais no WhatsApp
            </li>
            <li className="flex items-center gap-2 text-sm text-figaro-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Split de Pagamento
            </li>
          </ul>

          <button 
            onClick={() => alert('Checkout Cakto em breve!')}
            className="w-full py-2.5 rounded-lg bg-white/5 border border-figaro-gold-base hover:bg-figaro-gold-base hover:text-black hover:border-figaro-gold-base text-figaro-gold-base font-semibold transition-all flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {isTrial ? 'Assinar Agora' : (isPastDue ? 'Pagar Fatura' : 'Gerenciar Assinatura')}
          </button>
        </div>

        {/* FÍGARO ENTERPRISE */}
        <div className={`glass-panel p-6 relative overflow-hidden group transition-all ${
          isEnterprise 
            ? 'border-figaro-gold-base shadow-figaro-gold-base/30' 
            : 'border-white/10 hover:border-figaro-gold-base'
        }`}>
          {isEnterprise && (
            <div className="absolute top-0 right-0 px-3 py-1 bg-figaro-gold-base text-black text-[10px] font-bold tracking-wider rounded-bl-lg uppercase">
              Plano Atual
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-2xl font-bold text-white">Fígaro ENTERPRISE</h3>
            <Zap className="w-5 h-5 text-figaro-gold-base" />
          </div>
          <div className="flex items-end gap-1 mb-6">
            <span className="text-3xl font-bold text-figaro-gold-base">R$ 297</span>
            <span className="text-sm text-figaro-text-secondary mb-1">/mês</span>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2 text-sm text-figaro-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> Tudo do Fígaro PRO
            </li>
            <li className="flex items-center gap-2 text-sm text-white font-medium">
              <Globe className="w-4 h-4 text-figaro-gold-base shrink-0" /> Gestão Multi-Filiais
            </li>
            <li className="flex items-center gap-2 text-sm text-white font-medium">
              <Building2 className="w-4 h-4 text-figaro-gold-base shrink-0" /> Dashboard Consolidado da Rede
            </li>
            <li className="flex items-center gap-2 text-sm text-white font-medium">
              <Crown className="w-4 h-4 text-figaro-gold-base shrink-0" /> Relatórios por Unidade
            </li>
          </ul>

          <button 
            onClick={() => alert('Fale com nosso comercial para Enterprise!')}
            className={`w-full py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              isEnterprise
                ? 'bg-white/5 border border-figaro-gold-base hover:bg-figaro-gold-base hover:text-black text-figaro-gold-base'
                : 'bg-figaro-gold-base text-white hover:bg-figaro-gold-base shadow-figaro-gold-base/30'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {isEnterprise ? 'Gerenciar Enterprise' : 'Quero para minha Rede'}
          </button>
        </div>
      </div>
    </div>
  )
}
