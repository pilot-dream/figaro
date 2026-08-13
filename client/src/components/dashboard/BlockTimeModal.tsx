import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Lock, X } from 'lucide-react'

interface BlockTimeModalProps {
  onClose: () => void
  onBlock: (reason: string, time: string) => void
}

export function BlockTimeModal({ onClose, onBlock }: BlockTimeModalProps) {
  const [reason, setReason] = useState('Almoço / Pausa Técnica')
  const [startTime, setStartTime] = useState('12:00')
  const [endTime, setEndTime] = useState('13:00')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onBlock(reason, `${startTime} - ${endTime}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-6 space-y-4 border-[var(--color-figaro-terracotta)]/40 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-[var(--color-figaro-terracotta)] font-bold text-base">
            <Lock className="w-5 h-5" />
            <span>Bloqueio Personalizado de Horário</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-figaro-text-secondary hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-figaro-text-secondary block font-semibold mb-1">Motivo da Pausa</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs focus:outline-none focus:border-figaro-gold-base"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-figaro-text-secondary block font-semibold mb-1">Início</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs focus:outline-none focus:border-figaro-gold-base"
              />
            </div>
            <div className="flex-1">
              <label className="text-figaro-text-secondary block font-semibold mb-1">Fim</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs focus:outline-none focus:border-figaro-gold-base"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="danger" type="submit">
              Bloquear Horário
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
