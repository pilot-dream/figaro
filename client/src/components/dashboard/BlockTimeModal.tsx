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
  const [time, setTime] = useState('12:00 - 13:00')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onBlock(reason, time)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-6 space-y-4 border-[var(--color-figaro-terracotta)]/40 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-[var(--color-figaro-terracotta)] font-bold text-base">
            <Lock className="w-5 h-5" />
            <span>Bloqueio Rápido de Horário</span>
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
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-figaro-text-secondary block font-semibold mb-1">Horário da Pausa</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-glass-border text-white text-xs focus:outline-none"
            >
              <option value="12:00 - 13:00">12:00 - 13:00 (Almoço)</option>
              <option value="15:00 - 15:30">15:00 - 15:30 (Pausa Tarde)</option>
              <option value="18:00 - 18:30">18:00 - 18:30 (Manutenção Equipamentos)</option>
            </select>
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
