import React from 'react'
import { Button } from '@/components/ui/Button'

interface AddServiceModalProps {
  isOpen: boolean
  onClose: () => void
  editingService: boolean
  isCombo: boolean
  setIsCombo: (val: boolean) => void
  name: string
  setName: (val: string) => void
  price: string
  setPrice: (val: string) => void
  durationMin: string
  setDurationMin: (val: string) => void
  description: string
  setDescription: (val: string) => void
  isFeatured: boolean
  setIsFeatured: (val: boolean) => void
  handleSaveService: (e: React.FormEvent) => void
}

export function AddServiceModal({
  isOpen,
  onClose,
  editingService,
  isCombo,
  setIsCombo,
  name,
  setName,
  price,
  setPrice,
  durationMin,
  setDurationMin,
  description,
  setDescription,
  isFeatured,
  setIsFeatured,
  handleSaveService,
}: AddServiceModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-[#0A0E14]/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl shadow-black/80 max-w-md w-full space-y-4">
        <h3 className="font-bold text-white text-lg border-b border-white/10 pb-3">
          {editingService ? 'Editar Item' : isCombo ? 'Novo Combo Promocional' : 'Novo Serviço'}
        </h3>

        <form onSubmit={handleSaveService} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#8C97A8] block mb-1.5">
              Nome do Serviço / Combo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCombo ? 'Ex: Combo Cabelo + Barba + Sobrancelha' : 'Ex: Corte Degradê Navalhado'}
              className="bg-white/5 border border-white/10 focus:border-[#11AFFA] focus:ring-1 focus:ring-[#11AFFA] text-white rounded-xl p-3 outline-none text-xs w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#8C97A8] block mb-1.5">Preço (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="75.00"
                className="bg-white/5 border border-white/10 focus:border-[#11AFFA] focus:ring-1 focus:ring-[#11AFFA] text-white rounded-xl p-3 outline-none text-xs w-full font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8C97A8] block mb-1.5">Duração (minutos) *</label>
              <select
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="bg-[#0A0E14] border border-white/10 focus:border-[#11AFFA] focus:ring-1 focus:ring-[#11AFFA] text-white rounded-xl p-3 outline-none text-xs w-full"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min (1h)</option>
                <option value="90">90 min (1h30)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8C97A8] block mb-1.5">Descrição (opcional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes dos itens inclusos neste serviço..."
              className="bg-white/5 border border-white/10 focus:border-[#11AFFA] focus:ring-1 focus:ring-[#11AFFA] text-white rounded-xl p-3 outline-none text-xs w-full resize-none"
            />
          </div>

          {/* Toggles for Featured & Combo */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center gap-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#11AFFA]"
              />
              Destacar na página pública
            </label>

            <label className="flex items-center gap-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={isCombo}
                onChange={(e) => setIsCombo(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#F2A93B]"
              />
              Este item é um Combo
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <button
              type="submit"
              className="bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
