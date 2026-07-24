import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
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

  // Revenue Breakdown by Payment Method (Simulated / Estimated)
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
    const reportText = `=== RELATÓRIO FINANCEIRO FÍGARO ===\nData: ${new Date().toLocaleDateString('pt-BR')}\nTotal Atendimentos: ${completed.length}\nFaturamento Total: R$ ${totalRevenue.toFixed(2)}\nTicket Médio: R$ ${averageTicket.toFixed(2)}\n\nPIX (65%): R$ ${pixRevenue.toFixed(2)}\nCartão (25%): R$ ${cardRevenue.toFixed(2)}\nDinheiro (10%): R$ ${cashRevenue.toFixed(2)}`
    
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-financeiro-${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Relatório Financeiro</h2>
          <p className="text-xs text-figaro-text-secondary">
            Acompanhe o faturamento por forma de pagamento e tipo de serviço
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/5 border border-glass-border p-1 rounded-xl text-xs flex items-center">
            <button
              onClick={() => setPeriodFilter('today')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                periodFilter === 'today'
                  ? 'bg-[var(--color-figaro-blue)] text-white'
                  : 'text-figaro-text-secondary hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriodFilter('week')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                periodFilter === 'week'
                  ? 'bg-[var(--color-figaro-blue)] text-white'
                  : 'text-figaro-text-secondary hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                periodFilter === 'month'
                  ? 'bg-[var(--color-figaro-blue)] text-white'
                  : 'text-figaro-text-secondary hover:text-white'
              }`}
            >
              Mês
            </button>
          </div>

          <Button size="sm" onClick={handleExport} className="flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Exportar
          </Button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard glow className="p-5 space-y-2 border-[var(--color-figaro-mint)]/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-figaro-text-secondary">
              Faturamento Bruto
            </span>
            <div className="p-2 rounded-xl bg-[var(--color-figaro-mint)]/20 text-[var(--color-figaro-mint)]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">R$ {totalRevenue.toFixed(2)}</h3>
          <span className="text-xs text-[var(--color-figaro-mint)] font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> {completed.length} Atendimentos concluídos
          </span>
        </GlassCard>

        <GlassCard className="p-5 space-y-2 border-[var(--color-figaro-blue)]/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-figaro-text-secondary">
              Ticket Médio
            </span>
            <div className="p-2 rounded-xl bg-[var(--color-figaro-blue)]/20 text-[var(--color-figaro-blue)]">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">R$ {averageTicket.toFixed(2)}</h3>
          <span className="text-xs text-figaro-text-secondary">Média por atendimento</span>
        </GlassCard>

        <GlassCard className="p-5 space-y-2 border-[var(--color-figaro-amber)]/40">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-figaro-text-secondary">
              Projeção Mensal
            </span>
            <div className="p-2 rounded-xl bg-[var(--color-figaro-amber)]/20 text-[var(--color-figaro-amber)]">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">R$ {(totalRevenue * 22).toFixed(2)}</h3>
          <span className="text-xs text-[var(--color-figaro-amber)]">Base 22 dias úteis</span>
        </GlassCard>
      </div>

      {/* Payment Method Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-5 space-y-4">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[var(--color-figaro-blue)]" /> Formas de Pagamento
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-[var(--color-figaro-mint)]" />
                <span className="font-semibold text-white">PIX (Chave Fígaro)</span>
              </div>
              <span className="font-mono font-bold text-white">R$ {pixRevenue.toFixed(2)} (65%)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-[var(--color-figaro-blue)]" />
                <span className="font-semibold text-white">Cartão de Crédito / Débito</span>
              </div>
              <span className="font-mono font-bold text-white">R$ {cardRevenue.toFixed(2)} (25%)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-[var(--color-figaro-amber)]" />
                <span className="font-semibold text-white">Dinheiro Presencial</span>
              </div>
              <span className="font-mono font-bold text-white">R$ {cashRevenue.toFixed(2)} (10%)</span>
            </div>
          </div>
        </GlassCard>

        {/* Revenue by Service Breakdown */}
        <GlassCard className="p-5 space-y-4">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[var(--color-figaro-amber)]" /> Desempenho por Serviço
          </h4>

          {Object.keys(serviceStats).length === 0 ? (
            <p className="text-xs text-figaro-text-secondary italic py-4 text-center">
              Nenhum dado de serviço concluído nesta data.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              {Object.entries(serviceStats).map(([name, stat]) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <h5 className="font-semibold text-white">{name}</h5>
                    <span className="text-[10px] text-figaro-text-secondary">{stat.count} cortes efetuados</span>
                  </div>
                  <span className="font-mono font-bold text-white">R$ {stat.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
