import { useState, useEffect } from 'react'
import { Crown, Sparkles, Trophy, ChevronRight, History, Scissors } from 'lucide-react'
import { ClientBottomNav } from '@/components/dashboard/ClientBottomNav'
import { useAuthStore } from '@/stores/auth.store'
import { fetchClientAppointments } from '@/lib/api'
import type { Appointment } from '@/types'
import { formatBrasiliaDate } from '@/lib/date'

export function ClientWalletPage() {
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const data = await fetchClientAppointments(user.id, user.phone)
        // Filtramos apenas os concluídos para gerar pontos
        setAppointments(data.filter(a => a.status === 'COMPLETED' || a.status === 'CONFIRMED'))
      } catch (err) {
        console.error('Failed to load appointments for wallet', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  // Lógica de cálculo de pontos baseada no histórico real
  // Exemplo: 1 ponto para cada R$ 1 gasto.
  const earnedPoints = appointments.reduce((sum, appt) => sum + (appt.totalPrice || 0), 0)
  
  // Usa do banco se existir e for maior que 0, senão usa o calculado
  const points = (user?.loyaltyPoints && user.loyaltyPoints > 0) ? user.loyaltyPoints : Math.floor(earnedPoints)

  // Histórico convertido dos appointments reais
  const history = appointments.slice(0, 10).map((appt) => {
    // Pegar o nome do primeiro serviço
    const serviceName = appt.services && appt.services.length > 0 ? appt.services[0].name : 'Agendamento'
    const isMultiple = appt.services && appt.services.length > 1
    const title = isMultiple ? `${serviceName} +${appt.services!.length - 1}` : serviceName
    const pts = Math.floor(appt.totalPrice || 0)
    
    return {
      id: appt.id,
      title: title,
      date: formatBrasiliaDate(new Date(appt.startTime)),
      points: `+${pts}`,
      isRedemption: false
    }
  })

  const currentTier = user?.tier ?? 'GOLD'

  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'BLACK']
  const currentTierIndex = tiers.indexOf(currentTier)
  const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : 'BLACK'

  // Pontos necessários para cada tier
  const tierThresholds = {
    'BRONZE': 0,
    'SILVER': 500,
    'GOLD': 1000,
    'BLACK': 2500
  }

  const currentThreshold = tierThresholds[currentTier as keyof typeof tierThresholds]
  const nextThreshold = tierThresholds[nextTier as keyof typeof tierThresholds]
  
  const progress = currentTier === 'BLACK' 
    ? 100 
    : ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100

  return (
    <div className="min-h-screen w-full bg-figaro-black text-white pb-24 overflow-x-hidden">
      {/* Premium Header */}
      <div className="px-6 pt-6 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-figaro-gold-light to-figaro-gold-base bg-clip-text text-transparent">
            Clube Fígaro
          </h1>
          <p className="text-sm text-figaro-text-sec mt-1">Seu programa de recompensas</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center">
          <Crown className="w-6 h-6 text-figaro-gold-base" />
        </div>
      </div>

      {/* Main Wallet Card */}
      <div className="px-4">
        <div className="relative rounded-3xl p-6 overflow-hidden bg-gradient-to-br from-[#1a1c23] to-[#0A0E14] border border-white/10 shadow-2xl">
          {/* Glow effect */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-figaro-gold-base blur-[50px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-figaro-gold-base mb-2">
              Saldo Atual
            </span>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-5xl font-black tracking-tight">{points}</span>
              <span className="text-lg text-gray-400 font-medium mb-1">pts</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-white">{currentTier}</span>
                <span className="text-figaro-text-sec">{nextTier}</span>
              </div>
              <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-figaro-gold-light to-figaro-gold-base rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {currentTier === 'BLACK' 
                  ? 'Você atingiu o nível máximo!'
                  : `Faltam ${nextThreshold - points} pts para o nível ${nextTier}`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards / Offers Action */}
      <div className="px-4 mt-6">
        <button className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-figaro-gold-base flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-figaro-gold-base" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white">Resgatar Prêmios</h3>
              <p className="text-xs text-gray-400">Ver cortes e produtos disponíveis</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-figaro-text-sec group-hover:text-figaro-gold-base transition-colors" />
        </button>
      </div>

      {/* History */}
      <div className="px-6 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-white">Histórico de Pontos</h2>
        </div>
        
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-4 text-gray-400 text-sm">Carregando histórico...</div>
          ) : history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <p className="font-medium text-sm text-white">{item.title}</p>
                  <p className="text-xs text-figaro-text-sec mt-0.5">{item.date}</p>
                </div>
                <span className={`font-bold ${item.isRedemption ? 'text-red-400' : 'text-figaro-gold-base'}`}>
                  {item.points}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5">
              <Scissors className="w-8 h-8 text-figaro-text-sec mx-auto mb-2" />
              <p className="text-sm text-gray-400">Você ainda não possui agendamentos finalizados.</p>
            </div>
          )}
        </div>
      </div>

      <ClientBottomNav />
    </div>
  )
}
