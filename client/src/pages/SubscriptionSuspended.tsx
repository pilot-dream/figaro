import { ShieldAlert, ArrowRight } from 'lucide-react'

export function SubscriptionSuspended() {
  return (
    <div className="min-h-screen w-full bg-figaro-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#11AFFA]/5 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-md glass-panel p-8 flex flex-col items-center text-center border-glass-border">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Assinatura Suspensa</h1>
        <p className="text-sm text-figaro-text-secondary mb-8 leading-relaxed">
          O acesso ao sistema Fígaro foi temporariamente interrompido devido a uma pendência na sua assinatura. Para restaurar o acesso imediato à sua barbearia, regularize seu plano.
        </p>

        <button 
          onClick={() => alert('Integração com Checkout da Cakto em breve!')}
          className="w-full py-3.5 rounded-xl bg-[#11AFFA] hover:bg-[#11AFFA]/90 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(17,175,250,0.3)] hover:shadow-[0_0_30px_rgba(17,175,250,0.5)]"
        >
          Regularizar Assinatura
          <ArrowRight className="w-4 h-4" />
        </button>

        <button 
          onClick={() => {
            // Em tese, deslogar o usuário ou voltar pro login
            window.location.href = '/login'
          }}
          className="mt-4 text-xs font-medium text-figaro-text-secondary hover:text-white transition-colors"
        >
          Fazer logout
        </button>
      </div>
    </div>
  )
}
