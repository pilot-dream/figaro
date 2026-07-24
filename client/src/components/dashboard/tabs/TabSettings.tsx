import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { fetchServices } from '@/lib/api'
import type { Service, User } from '@/types'
import { Share2, Check, Scissors, Plus, Clock, Edit2, Trash2, ExternalLink } from 'lucide-react'

interface TabSettingsProps {
  barber: User
}

export function TabSettings({ barber }: TabSettingsProps) {
  const [services, setServices] = useState<Service[]>([])
  const [copied, setCopied] = useState(false)

  // Service Modal state for CRUD
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [durationMin, setDurationMin] = useState('30')
  const [description, setDescription] = useState('')

  const barberSlug =
    barber.slug ||
    (barber.name
      ? barber.name
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
      : 'henrique-navalha')

  const publicUrl = `${window.location.origin}/${barberSlug}`

  useEffect(() => {
    fetchServices().then(setServices)
  }, [])

  const handleCopyLink = async () => {
    let success = false

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(publicUrl)
        success = true
      } catch (e) {
        console.warn('Clipboard writeText failed:', e)
      }
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = publicUrl
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        success = document.execCommand('copy')
        document.body.removeChild(textarea)
      } catch (e) {
        console.error('Fallback copy failed:', e)
      }
    }

    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } else {
      prompt('Copie seu link de agendamento abaixo:', publicUrl)
    }
  }

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) return

    const priceNum = parseFloat(price) || 0
    const durationNum = parseInt(durationMin, 10) || 30

    if (editingService) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id
            ? { ...s, name, price: priceNum, durationMin: durationNum, description }
            : s
        )
      )
    } else {
      const newSrv: Service = {
        id: `srv-${Date.now()}`,
        name,
        price: priceNum,
        durationMin: durationNum,
        description,
        isActive: true,
        sortOrder: 1,
      }
      setServices((prev) => [...prev, newSrv])
    }

    setShowServiceModal(false)
    setEditingService(null)
    setName('')
    setPrice('')
    setDurationMin('30')
    setDescription('')
  }

  const handleDeleteService = (id: string) => {
    if (confirm('Deseja excluir este serviço?')) {
      setServices((prev) => prev.filter((s) => s.id !== id))
    }
  }

  const handleOpenEdit = (srv: Service) => {
    setEditingService(srv)
    setName(srv.name)
    setPrice(srv.price.toString())
    setDurationMin(srv.durationMin.toString())
    setDescription(srv.description || '')
    setShowServiceModal(true)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Configurações do Perfil & Serviços</h2>
        <p className="text-xs text-[#8C97A8]">
          Gerencie seu link público de agendamentos, catálogo de serviços e horário de funcionamento
        </p>
      </div>

      {/* Public Booking Link Highlight Card */}
      <div className="bg-gradient-to-r from-[#11AFFA]/10 to-transparent backdrop-blur-xl border border-[#11AFFA]/30 rounded-2xl p-6 shadow-[0_0_25px_rgba(17,175,250,0.15)] relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#11AFFA]/20 text-[#11AFFA] border border-[#11AFFA]/30">
              SEU LINK PÚBLICO DE AGENDAMENTO
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Divulgue seu Link de Agendamentos
            </h3>
            <p className="text-xs text-[#8C97A8]">
              Seus clientes entram direto no seu perfil exclusivo para reservar horários.
            </p>
          </div>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:text-[#11AFFA] hover:border-[#11AFFA]/40 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {/* Read-only URL Field */}
          <div className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-mono text-[#11AFFA] text-sm flex-1 truncate">
            {publicUrl}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyLink}
            className={`w-full sm:w-auto flex-shrink-0 bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
              copied ? '!bg-[#2ED9A0] !text-black' : ''
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-black" /> Link Copiado!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" /> Copiar meu Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* CRUD Catalog of Services */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#11AFFA]" /> Catálogo de Serviços
            </h3>
            <p className="text-xs text-[#8C97A8]">
              Adicione e edite os valores e a duração estimada de cada serviço
            </p>
          </div>

          <button
            onClick={() => {
              setEditingService(null)
              setName('')
              setPrice('')
              setDurationMin('30')
              setDescription('')
              setShowServiceModal(true)
            }}
            className="bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-semibold rounded-xl px-4 py-2 text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Adicionar Serviço
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-lg transition-all relative group space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between">
                  <h4 className="text-white font-semibold text-lg">{srv.name}</h4>

                  {/* Action Buttons (Edit / Delete) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(srv)}
                      title="Editar Serviço"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:text-[#11AFFA] hover:border-[#11AFFA]/40 hover:bg-[#11AFFA]/10 transition-all text-[#8C97A8] cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(srv.id)}
                      title="Excluir Serviço"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:text-[#F0553F] hover:border-[#F0553F]/40 hover:bg-[#F0553F]/10 transition-all text-[#8C97A8] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-[#8C97A8] text-xs line-clamp-2 mt-1 mb-3">
                  {srv.description || 'Sem descrição cadastrada'}
                </p>
              </div>

              {/* Information Badges */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <span className="bg-[#2ED9A0]/10 border border-[#2ED9A0]/20 text-[#2ED9A0] font-mono font-bold text-sm px-3 py-1 rounded-lg">
                  R$ {srv.price.toFixed(2)}
                </span>
                <span className="bg-white/5 border border-white/10 text-[#8C97A8] font-mono text-xs px-3 py-1 rounded-lg flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#F2A93B]" /> {srv.durationMin} min
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operating Hours Settings */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#F2A93B]" /> Grade de Horário de Atendimento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[#8C97A8] block mb-1.5 font-semibold">Horário de Início (Abertura)</label>
            <input
              type="time"
              defaultValue="09:00"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#11AFFA] text-white text-xs font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-[#8C97A8] block mb-1.5 font-semibold">Horário de Término (Fechamento)</label>
            <input
              type="time"
              defaultValue="20:00"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#11AFFA] text-white text-xs font-mono outline-none"
            />
          </div>
        </div>
      </GlassCard>

      {/* Glass Modal for Adding / Editing Service */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0E14]/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl shadow-black/80 max-w-md w-full space-y-4">
            <h3 className="font-bold text-white text-lg border-b border-white/10 pb-3">
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8C97A8] block mb-1.5">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte Fígaro Signature"
                  className="bg-white/5 border border-white/10 focus:border-[#11AFFA] focus:ring-1 focus:ring-[#11AFFA] text-white rounded-xl p-3 outline-none text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#8C97A8] block mb-1.5">
                    Preço (R$) *
                  </label>
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
                  <label className="text-xs font-semibold text-[#8C97A8] block mb-1.5">
                    Duração (minutos) *
                  </label>
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
                <label className="text-xs font-semibold text-[#8C97A8] block mb-1.5">
                  Descrição (opcional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição breve dos detalhes do serviço..."
                  className="bg-white/5 border border-white/10 focus:border-[#11AFFA] focus:ring-1 focus:ring-[#11AFFA] text-white rounded-xl p-3 outline-none text-xs w-full resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" type="button" onClick={() => setShowServiceModal(false)}>
                  Cancelar
                </Button>
                <button
                  type="submit"
                  className="bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
