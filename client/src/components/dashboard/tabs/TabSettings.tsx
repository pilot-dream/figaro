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
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Configurações do Perfil & Serviços</h2>
        <p className="text-xs text-figaro-text-secondary">
          Gerencie seu link público de agendamentos, catálogo de serviços e horário de funcionamento
        </p>
      </div>

      {/* Public Booking Link Banner in Glassmorphism */}
      <GlassCard glow className="p-6 border-[var(--color-figaro-blue)]/50 relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-figaro-blue)]/20 text-[var(--color-figaro-blue)] border border-[var(--color-figaro-blue)]/30">
              Seu Link Público de Agendamento
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Divulgue seu Link de Agendamentos
            </h3>
            <p className="text-xs text-figaro-text-secondary">
              Seus clientes entram direto no seu perfil exclusivo para reservar horários.
            </p>
          </div>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:text-[var(--color-figaro-blue)] transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border font-mono text-xs text-white truncate">
            {publicUrl}
          </div>
          <Button
            onClick={handleCopyLink}
            className={`w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 ${
              copied ? 'bg-[var(--color-figaro-mint)] text-black font-bold' : ''
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Link Copiado!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" /> Copiar meu Link
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      {/* CRUD Catalog of Services */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[var(--color-figaro-blue)]" /> Catálogo de Serviços
            </h3>
            <p className="text-xs text-figaro-text-secondary">
              Adicione e edite os valores e a duração estimada de cada serviço
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setEditingService(null)
              setName('')
              setPrice('')
              setDurationMin('30')
              setDescription('')
              setShowServiceModal(true)
            }}
          >
            <Plus className="w-4 h-4" /> Adicionar Serviço
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((srv) => (
            <GlassCard key={srv.id} className="p-4 flex items-center justify-between space-x-3">
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">{srv.name}</h4>
                <p className="text-xs text-figaro-text-secondary line-clamp-1">{srv.description}</p>
                <div className="flex items-center gap-3 text-xs pt-1">
                  <span className="font-bold text-[var(--color-figaro-mint)]">
                    R$ {srv.price.toFixed(2)}
                  </span>
                  <span className="text-figaro-text-secondary flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--color-figaro-amber)]" /> {srv.durationMin} min
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(srv)}
                  className="p-2 rounded-lg text-figaro-text-secondary hover:text-white hover:bg-white/10"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteService(srv.id)}
                  className="p-2 rounded-lg text-figaro-text-secondary hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Operating Hours Settings */}
      <GlassCard className="p-5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--color-figaro-amber)]" /> Grade de Horário de Atendimento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-figaro-text-secondary block mb-1 font-semibold">Horário de Início (Abertura)</label>
            <input
              type="time"
              defaultValue="09:00"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-figaro-text-secondary block mb-1 font-semibold">Horário de Término (Fechamento)</label>
            <input
              type="time"
              defaultValue="20:00"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs font-mono"
            />
          </div>
        </div>
      </GlassCard>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-6 space-y-4 border-[var(--color-figaro-blue)]/40 shadow-2xl">
            <h3 className="font-bold text-white text-lg">
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte Degradê + Barba"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="75.00"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
                    Duração (minutos) *
                  </label>
                  <select
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0E14] border border-glass-border text-white text-xs"
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
                <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição breve dos detalhes do serviço..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-white text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" type="button" onClick={() => setShowServiceModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Serviço</Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
