import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { GlassCard } from '@/components/ui/GlassCard'
import { fetchRevenueChartData } from '@/lib/api'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0E14]/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-white font-bold mb-1">{label}</p>
        <p className="text-amber-500 text-sm font-medium">
          R$ {payload[0].value.toFixed(2)}
        </p>
      </div>
    )
  }
  return null
}

export function RevenueChart({ barberId = 'all' }: { barberId?: string }) {
  const [data, setData] = useState<{ name: string, faturamento: number }[]>([])

  useEffect(() => {
    let mounted = true
    fetchRevenueChartData(barberId).then(res => {
      if (mounted) setData(res)
    }).catch(err => {
      console.error('Failed to load revenue chart data', err)
    })
    return () => { mounted = false }
  }, [barberId])

  return (
    <GlassCard className="p-5 h-[350px] flex flex-col border-white/10">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white tracking-tight">Faturamento (Últimos 7 dias)</h3>
        <p className="text-xs text-[#8C97A8]">Visão geral de receita gerada por atendimentos concluídos.</p>
      </div>
      
      <div className="flex-1 w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#8C97A8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#8C97A8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value: number) => `R$${value}`}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            />
            <Bar 
              dataKey="faturamento" 
              fill="#f59e0b" 
              radius={[4, 4, 0, 0]} 
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
