import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import type { DashboardAppointment } from '@/components/dashboard/AppointmentCard'
import { Phone, Save, X, History, AlertTriangle } from 'lucide-react'
import { updateClientNotes } from '@/lib/api'

interface ClientSheetProps {
  appointment: DashboardAppointment | null
  onClose: () => void
  onSaveNotes: () => void
}

export function ClientSheet({ appointment, onClose, onSaveNotes }: ClientSheetProps) {
  if (!appointment) return null

  const [notes, setNotes] = useState(appointment.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!appointment.clientId) {
      alert('Observação mantida para o atendimento.')
      onSaveNotes()
      onClose()
      return
    }

    setSaving(true)
    try {
      await updateClientNotes(appointment.clientId, notes)
      onSaveNotes()
      onClose()
    } catch {
      alert('Erro ao salvar observação')
    } finally {
      setSaving(false)
    }
  }

  const sampleHistory = [
    { date: '15/06/2026', service: 'Corte Figaro Signature', barber: 'Henrique Navalha' },
    { date: '02/05/2026', service: 'Barba Terapia', barber: 'Mateus Figaro' },
    { date: '18/03/2026', service: 'Combo Imperial', barber: 'Henrique Navalha' },
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <GlassCard className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-6 border-[var(--color-figaro-blue)]/30 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--color-figaro-blue)]/20 border border-[var(--color-figaro-blue)]/40 flex items-center justify-center text-[var(--color-figaro-blue)] font-bold text-lg">
              {appointment.clientName.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{appointment.clientName}</h3>
              <p className="text-xs text-figaro-text-secondary flex items-center gap-1">
                <Phone className="w-3 h-3 text-[var(--color-figaro-amber)]" /> {appointment.clientPhone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-figaro-text-secondary hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CRM Quick Notes Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--color-figaro-amber)] uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Observações do Barbeiro (CRM)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adicione preferências técnicas (ex: corte de tesoura, máquina, café preferido)..."
            className="w-full p-3 rounded-xl bg-white/5 border border-glass-border text-white text-xs focus:outline-none focus:border-[var(--color-figaro-blue)] resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" variant="amber" isLoading={saving} onClick={handleSave}>
              <Save className="w-3.5 h-3.5" /> Salvar Ficha
            </Button>
          </div>
        </div>

        {/* Cut History */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4 text-[var(--color-figaro-blue)]" /> Histórico de Cortes
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {sampleHistory.map((h, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">{h.service}</span>
                  <span className="text-figaro-text-secondary text-[11px]">{h.barber}</span>
                </div>
                <span className="text-[10px] font-mono text-figaro-text-secondary">{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
