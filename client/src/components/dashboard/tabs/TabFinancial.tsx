import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import type { DashboardAppointment } from '@/components/dashboard/AppointmentCard'
import type { User, FinanceSummary } from '@/types'
import { DollarSign, Wallet, Users, Download, PieChart, TrendingUp } from 'lucide-react'

interface TabFinancialProps {
  appointments: DashboardAppointment[]
  user: User
}

export function TabFinancial({ appointments, user }: TabFinancialProps) {
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month'>('today')
  const [financeData, setFinanceData] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFinance = async () => {
      setLoading(true)
      try {
        const API_URL = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "http://localhost:3001")
        const response = await fetch(`${API_URL}/api/finance/summary?period=${periodFilter}`, {
          headers: {
            'Authorization': `Bearer ${(await import('@/lib/supabase')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setFinanceData(data)
        }
      } catch (err) {
        console.error('Failed to fetch finance summary', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFinance()
  }, [periodFilter])

  const completed = appointments.filter((a) => a.status === 'COMPLETED' || a.status === 'CONFIRMED')
  const totalRevenue = completed.reduce((acc, a) => acc + a.price, 0)
  const averageTicket = completed.length > 0 ? totalRevenue / completed.length : 0

  // Revenue Breakdown by Service (Mantido do original)
  const serviceStats: Record<string, { count: number; total: number }> = {}
  completed.forEach((a) => {
    if (!serviceStats[a.serviceName]) {
      serviceStats[a.serviceName] = { count: 0, total: 0 }
    }
    serviceStats[a.serviceName].count += 1
    serviceStats[a.serviceName].total += a.price
  })

  const handleExport = () => {
    if (!financeData) return
    let reportText = `=== RELATÓRIO FINANCEIRO FÍGARO ===\nData: ${new Date().toLocaleDateString('pt-BR')}\nPeríodo: ${periodFilter.toUpperCase()}\n`
    
    if (user.role === 'OWNER') {
      reportText += `Faturamento Bruto: R$ ${financeData.grossRevenue?.toFixed(2) || '0.00'}\n`
      reportText += `Comissões a Pagar: R$ ${financeData.totalCommissions?.toFixed(2) || '0.00'}\n`
      reportText += `Lucro Líquido: R$ ${financeData.netRevenue?.toFixed(2) || '0.00'}\n\n`
    } else {
      reportText += `Meus Ganhos (Comissão): R$ ${financeData.myCommission?.toFixed(2) || '0.00'}\n\n`
    }
    reportText += `Total Atendimentos: ${financeData.totalAppointments || 0}\n`
    reportText += `Ticket Médio: R$ ${averageTicket.toFixed(2)}\n\n`

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-financeiro-${periodFilter}-${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Relatório Financeiro</h2>
          <p className="text-xs text-[#8C97A8]">
            {user.role === 'OWNER' 
              ? 'Acompanhe o faturamento, comissões da equipe e lucro líquido.' 
              : 'Acompanhe seus atendimentos, comissões e desempenho.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Filter Buttons */}
          <div className="bg-white/[0.05] border border-white/10 p-1 rounded-xl backdrop-blur-md flex items-center gap-1">
            <button
              onClick={() => setPeriodFilter('today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                periodFilter === 'today'
                  ? 'bg-[#11AFFA] text-white shadow-[0_0_12px_rgba(17,175,250,0.4)] font-semibold border border-[#11AFFA]'
                  : 'text-[#8C97A8] hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriodFilter('week')}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                periodFilter === 'week'
                  ? 'bg-[#11AFFA] text-white shadow-[0_0_12px_rgba(17,175,250,0.4)] font-semibold border border-[#11AFFA]'
                  : 'text-[#8C97A8] hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                periodFilter === 'month'
                  ? 'bg-[#11AFFA] text-white shadow-[0_0_12px_rgba(17,175,250,0.4)] font-semibold border border-[#11AFFA]'
                  : 'text-[#8C97A8] hover:text-white'
              }`}
            >
              Mês
            </button>
          </div>

          <button
            onClick={handleExport}
            className="bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-semibold text-xs rounded-xl px-4 py-2 shadow-lg shadow-[rgba(17,175,250,0.3)] flex items-center gap-2 border border-[#11AFFA]/40 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="h-32 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : user.role === 'OWNER' && financeData ? (
        // ================= OWNER VIEW =================
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#8C97A8] tracking-wider">Faturamento Bruto</span>
                <div className="w-10 h-10 rounded-full bg-[#11AFFA]/20 border border-[#11AFFA]/30 text-[#11AFFA] flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-[#11AFFA] font-mono text-3xl font-extrabold drop-shadow-[0_0_15px_rgba(17,175,250,0.4)]">
                R$ {(financeData.grossRevenue || 0).toFixed(2)}
              </h3>
              <span className="text-xs text-[#8C97A8] block">Total gerado pela barbearia</span>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#8C97A8] tracking-wider">Comissões a Pagar</span>
                <div className="w-10 h-10 rounded-full bg-[#F2A93B]/20 border border-[#F2A93B]/30 text-[#F2A93B] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-[#F2A93B] font-mono text-3xl font-extrabold drop-shadow-[0_0_15px_rgba(242,169,59,0.4)]">
                R$ {(financeData.totalCommissions || 0).toFixed(2)}
              </h3>
              <span className="text-xs text-[#8C97A8] block">Valor devido aos barbeiros</span>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-3 border-b-2 border-b-[#2ED9A0]/50">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#8C97A8] tracking-wider">Lucro Líquido</span>
                <div className="w-10 h-10 rounded-full bg-[#2ED9A0]/20 border border-[#2ED9A0]/30 text-[#2ED9A0] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-[#2ED9A0] font-mono text-3xl font-extrabold drop-shadow-[0_0_15px_rgba(46,217,160,0.4)]">
                R$ {(financeData.netRevenue || 0).toFixed(2)}
              </h3>
              <span className="text-xs text-[#2ED9A0] font-bold block">Retenção livre de repasses</span>
            </div>
          </div>

          {/* Barber Breakdown Table */}
          <GlassCard className="p-0 overflow-hidden mt-6">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h4 className="font-bold text-white text-base">Desempenho por Barbeiro</h4>
              <span className="text-xs text-[#8C97A8]">{financeData.barberBreakdown?.length || 0} profissionais ativos</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#8C97A8]">
                <thead className="text-xs text-white/70 uppercase bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Profissional</th>
                    <th className="px-6 py-4 font-semibold text-center">Atendimentos</th>
                    <th className="px-6 py-4 font-semibold text-right">Faturamento Gerado</th>
                    <th className="px-6 py-4 font-semibold text-right">Regra de Comissão</th>
                    <th className="px-6 py-4 font-semibold text-right text-[#F2A93B]">Valor a Receber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {financeData.barberBreakdown?.map((barber) => (
                    <tr key={barber.barberId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={barber.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'} 
                            alt={barber.barberName} 
                            className="w-8 h-8 rounded-full border border-white/10 object-cover"
                          />
                          <span className="font-semibold text-white">{barber.barberName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono">{barber.appointmentCount}</td>
                      <td className="px-6 py-4 text-right font-mono">R$ {barber.totalRevenue.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-xs">
                        {barber.commissionType === 'PERCENTAGE' ? `${barber.commissionValue}%` : `R$ ${barber.commissionValue.toFixed(2)}`}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-[#F2A93B]">
                        R$ {barber.commissionAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {(!financeData.barberBreakdown || financeData.barberBreakdown.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center italic">Nenhum dado encontrado para o período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      ) : financeData ? (
        // ================= BARBER VIEW =================
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#8C97A8] tracking-wider">Meus Ganhos (Comissão)</span>
                <div className="w-10 h-10 rounded-full bg-[#2ED9A0]/20 border border-[#2ED9A0]/30 text-[#2ED9A0] flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-[#2ED9A0] font-mono text-3xl font-extrabold drop-shadow-[0_0_15px_rgba(46,217,160,0.4)]">
                R$ {(financeData.myCommission || 0).toFixed(2)}
              </h3>
              <span className="text-xs text-[#8C97A8] block">Comissão calculada no período</span>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#8C97A8] tracking-wider">Ticket Médio</span>
                <div className="w-10 h-10 rounded-full bg-[#11AFFA]/20 border border-[#11AFFA]/30 text-[#11AFFA] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-white font-mono text-3xl font-extrabold">
                R$ {averageTicket.toFixed(2)}
              </h3>
              <span className="text-xs text-[#8C97A8] flex items-center gap-1.5">
                Em {financeData.totalAppointments} atendimentos concluídos
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Revenue by Service (Comum a ambos) */}
      <GlassCard className="p-6 space-y-5">
        <h4 className="font-bold text-white text-base flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#F2A93B]" /> Desempenho por Serviço (Meus Atendimentos)
        </h4>

        {Object.keys(serviceStats).length === 0 ? (
          <p className="text-xs text-[#8C97A8] italic py-8 text-center">
            Nenhum dado de serviço concluído para este período.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(serviceStats).map(([name, stat]) => (
              <div
                key={name}
                className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all flex items-center justify-between"
              >
                <div>
                  <h5 className="font-semibold text-white text-sm">{name}</h5>
                  <span className="text-xs text-[#8C97A8]">{stat.count} cortes efetuados</span>
                </div>
                <span className="font-mono font-bold text-[#11AFFA] text-base">
                  R$ {stat.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
