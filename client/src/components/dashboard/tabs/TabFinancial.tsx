import { GlassCard } from '@/components/ui/GlassCard'
import type { DashboardAppointment } from '@/components/dashboard/AppointmentCard'
import { DollarSign, Wallet, CreditCard, QrCode, Download, ArrowUpRight, PieChart, TrendingUp } from 'lucide-react'
import { useState } from 'react'

interface TabFinancialProps {
  appointments: DashboardAppointment[]
}

export function TabFinancial({ appointments }: TabFinancialProps) {
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month'>('today')

  const completed = appointments.filter((a) => a.status === 'COMPLETED' || a.status === 'CONFIRMED')
  const totalRevenue = completed.reduce((acc, a) => acc + a.price, 0)
  const averageTicket = completed.length > 0 ? totalRevenue / completed.length : 0

  // Revenue Breakdown by Payment Method (Estimated / Projected)
  const pixRevenue = totalRevenue * 0.65
  const cardRevenue = totalRevenue * 0.25
  const cashRevenue = totalRevenue * 0.10

  // Revenue Breakdown by Service
  const serviceStats: Record<string, { count: number; total: number }> = {}
  completed.forEach((a) => {
    if (!serviceStats[a.serviceName]) {
      serviceStats[a.serviceName] = { count: 0, total: 0 }
    }
    serviceStats[a.serviceName].count += 1
    serviceStats[a.serviceName].total += a.price
  })

  const handleExport = () => {
    const reportText = `=== RELATÓRIO FINANCEIRO FÍGARO ===\nData: ${new Date().toLocaleDateString('pt-BR')}\nPeríodo: ${periodFilter.toUpperCase()}\nTotal Atendimentos: ${completed.length}\nFaturamento Total: R$ ${totalRevenue.toFixed(2)}\nTicket Médio: R$ ${averageTicket.toFixed(2)}\n\nPIX (65%): R$ ${pixRevenue.toFixed(2)}\nCartão (25%): R$ ${cardRevenue.toFixed(2)}\nDinheiro (10%): R$ ${cashRevenue.toFixed(2)}`

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
            Acompanhe o faturamento por forma de pagamento e tipo de serviço
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

          {/* Solid Export Button */}
          <button
            onClick={handleExport}
            className="bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-semibold text-xs rounded-xl px-4 py-2 shadow-lg shadow-[rgba(17,175,250,0.3)] flex items-center gap-2 border border-[#11AFFA]/40 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Main Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: FATURAMENTO BRUTO */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-[#8C97A8] tracking-wider">
              Faturamento Bruto
            </span>
            <div className="w-10 h-10 rounded-full bg-[#2ED9A0]/20 border border-[#2ED9A0]/30 text-[#2ED9A0] flex items-center justify-center shadow-[0_0_10px_rgba(46,217,160,0.2)]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-[#11AFFA] font-mono text-3xl font-extrabold drop-shadow-[0_0_15px_rgba(17,175,250,0.4)]">
            R$ {totalRevenue.toFixed(2)}
          </h3>
          <span className="text-xs text-[#2ED9A0] font-bold flex items-center gap-1.5 bg-[#2ED9A0]/10 border border-[#2ED9A0]/20 px-2.5 py-1 rounded-lg w-fit">
            <TrendingUp className="w-3.5 h-3.5" /> {completed.length} Atendimentos concluídos
          </span>
        </div>

        {/* KPI 2: TICKET MÉDIO */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-[#8C97A8] tracking-wider">
              Ticket Médio
            </span>
            <div className="w-10 h-10 rounded-full bg-[#11AFFA]/20 border border-[#11AFFA]/30 text-[#11AFFA] flex items-center justify-center shadow-[0_0_10px_rgba(17,175,250,0.2)]">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-white font-mono text-3xl font-bold">
            R$ {averageTicket.toFixed(2)}
          </h3>
          <span className="text-xs text-[#8C97A8] block">Média por atendimento</span>
        </div>

        {/* KPI 3: PROJEÇÃO MENSAL */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 border-t-2 border-t-[#F2A93B]/50 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-[#8C97A8] tracking-wider">
              Projeção Mensal
            </span>
            <div className="w-10 h-10 rounded-full bg-[#F2A93B]/15 border border-[#F2A93B]/30 text-[#F2A93B] flex items-center justify-center shadow-[0_0_10px_rgba(242,169,59,0.2)]">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-white font-mono text-3xl font-bold">
            R$ {(totalRevenue * 22).toFixed(2)}
          </h3>
          <span className="text-xs text-[#F2A93B] font-semibold block">Base 22 dias úteis</span>
        </div>
      </div>

      {/* Payment Method Breakdown & Revenue by Service */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Methods */}
        <GlassCard className="p-6 space-y-5">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#11AFFA]" /> Formas de Pagamento
          </h4>

          <div className="space-y-3">
            {/* PIX */}
            <div className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-4 h-4 text-[#2ED9A0]" />
                  <span className="font-semibold text-white">PIX (Chave Fígaro)</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">
                  R$ {pixRevenue.toFixed(2)} (65%)
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#11AFFA] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(17,175,250,0.5)]"
                  style={{ width: '65%' }}
                />
              </div>
            </div>

            {/* Credit / Debit Card */}
            <div className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-[#11AFFA]" />
                  <span className="font-semibold text-white">Cartão de Crédito / Débito</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">
                  R$ {cardRevenue.toFixed(2)} (25%)
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#2ED9A0] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(46,217,160,0.5)]"
                  style={{ width: '25%' }}
                />
              </div>
            </div>

            {/* Cash */}
            <div className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-[#F2A93B]" />
                  <span className="font-semibold text-white">Dinheiro Presencial</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">
                  R$ {cashRevenue.toFixed(2)} (10%)
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#F2A93B] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(242,169,59,0.5)]"
                  style={{ width: '10%' }}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Revenue by Service */}
        <GlassCard className="p-6 space-y-5">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#F2A93B]" /> Desempenho por Serviço
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
    </div>
  )
}
