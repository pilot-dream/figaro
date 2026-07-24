import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { fetchServices } from '@/lib/api'
import type { Service, User } from '@/types'
import {
  Share2,
  Check,
  Scissors,
  Plus,
  Clock,
  Edit2,
  Trash2,
  QrCode,
  Star,
  User as UserIcon,
  Globe,
  DollarSign,
  ShieldAlert,
  Calendar,
  Layers,
  Save,
  Download,
  X,
} from 'lucide-react'

interface TabSettingsProps {
  barber: User
}

type SettingsSubTab = 'profile' | 'services' | 'hours' | 'payments'

export function TabSettings({ barber }: TabSettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('profile')
  const [services, setServices] = useState<(Service & { isFeatured?: boolean; isCombo?: boolean })[]>([])
  const [copied, setCopied] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)

  // Profile Subtab Form State
  const [displayName, setDisplayName] = useState(barber.name || 'Filipe Lacerda')
  const [bio, setBio] = useState('Especialista em degradê navalhado, barba terapia e corte tesoura.')
  const [instagram, setInstagram] = useState('@filipe.navalha')
  const [avatarUrl, setAvatarUrl] = useState(
    barber.avatarUrl ||
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'
  )
  const [profileSaved, setProfileSaved] = useState(false)

  // Services Subtab State & Modal
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [durationMin, setDurationMin] = useState('30')
  const [description, setDescription] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isCombo, setIsCombo] = useState(false)

  // Hours Subtab State
  const [bufferTime, setBufferTime] = useState('5')
  const [weekDays, setWeekDays] = useState([
    { day: 'Segunda-feira', active: true, open: '09:00', close: '20:00', lunch: '12:00 - 13:00' },
    { day: 'Terça-feira', active: true, open: '09:00', close: '20:00', lunch: '12:00 - 13:00' },
    { day: 'Quarta-feira', active: true, open: '09:00', close: '20:00', lunch: '12:00 - 13:00' },
    { day: 'Quinta-feira', active: true, open: '09:00', close: '20:00', lunch: '12:00 - 13:00' },
    { day: 'Sexta-feira', active: true, open: '09:00', close: '20:00', lunch: '12:00 - 13:00' },
    { day: 'Sábado', active: true, open: '09:00', close: '18:00', lunch: '12:00 - 13:00' },
    { day: 'Domingo', active: false, open: '09:00', close: '14:00', lunch: 'Folga' },
  ])
  const [hoursSaved, setHoursSaved] = useState(false)

  // Payments Subtab State
  const [pixKey, setPixKey] = useState('11999999999 (Celular / Filipe Lacerda)')
  const [cancelPolicy, setCancelPolicy] = useState('2h')
  const [paymentSaved, setPaymentSaved] = useState(false)

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
      : 'filipe-lacerda')

  const publicUrl = `${window.location.origin}/${barberSlug}`
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    publicUrl
  )}&color=11AFFA&bgcolor=0A0E14`

  useEffect(() => {
    fetchServices().then((data) => {
      // Add mock isFeatured and isCombo properties
      setServices(
        data.map((s, idx) => ({
          ...s,
          isFeatured: idx === 0,
          isCombo: s.name.toLowerCase().includes('+') || s.name.toLowerCase().includes('combo'),
        }))
      )
    })
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
            ? {
                ...s,
                name,
                price: priceNum,
                durationMin: durationNum,
                description,
                isFeatured,
                isCombo,
              }
            : s
        )
      )
    } else {
      const newSrv: Service & { isFeatured?: boolean; isCombo?: boolean } = {
        id: `srv-${Date.now()}`,
        name,
        price: priceNum,
        durationMin: durationNum,
        description,
        isActive: true,
        sortOrder: 1,
        isFeatured,
        isCombo,
      }
      setServices((prev) => [...prev, newSrv])
    }

    setShowServiceModal(false)
    setEditingService(null)
    setName('')
    setPrice('')
    setDurationMin('30')
    setDescription('')
    setIsFeatured(false)
    setIsCombo(false)
  }

  const handleDeleteService = (id: string) => {
    if (confirm('Deseja excluir este serviço?')) {
      setServices((prev) => prev.filter((s) => s.id !== id))
    }
  }

  const handleToggleFeatured = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFeatured: !s.isFeatured } : s))
    )
  }

  const handleOpenEdit = (srv: Service & { isFeatured?: boolean; isCombo?: boolean }) => {
    setEditingService(srv)
    setName(srv.name)
    setPrice(srv.price.toString())
    setDurationMin(srv.durationMin.toString())
    setDescription(srv.description || '')
    setIsFeatured(!!srv.isFeatured)
    setIsCombo(!!srv.isCombo)
    setShowServiceModal(true)
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault()
    setHoursSaved(true)
    setTimeout(() => setHoursSaved(false), 3000)
  }

  const handleSavePayments = (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentSaved(true)
    setTimeout(() => setPaymentSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Configurações & Ajustes</h2>
        <p className="text-xs text-[#8C97A8]">
          Personalize seu perfil público, serviços, horários e regras de pagamento
        </p>
      </div>

      {/* 1. Liquid Glass Sub-Tabs Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-white/5">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`rounded-full px-4 py-2 text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'profile'
              ? 'bg-[#11AFFA] text-white shadow-[0_0_15px_rgba(17,175,250,0.4)] font-semibold border border-[#11AFFA]'
              : 'bg-white/[0.05] text-[#8C97A8] hover:text-white border border-white/10 backdrop-blur-md'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" /> Link & Perfil
        </button>

        <button
          onClick={() => setActiveSubTab('services')}
          className={`rounded-full px-4 py-2 text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'services'
              ? 'bg-[#11AFFA] text-white shadow-[0_0_15px_rgba(17,175,250,0.4)] font-semibold border border-[#11AFFA]'
              : 'bg-white/[0.05] text-[#8C97A8] hover:text-white border border-white/10 backdrop-blur-md'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" /> Serviços & Combos
        </button>

        <button
          onClick={() => setActiveSubTab('hours')}
          className={`rounded-full px-4 py-2 text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'hours'
              ? 'bg-[#11AFFA] text-white shadow-[0_0_15px_rgba(17,175,250,0.4)] font-semibold border border-[#11AFFA]'
              : 'bg-white/[0.05] text-[#8C97A8] hover:text-white border border-white/10 backdrop-blur-md'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Horários & Pausas
        </button>

        <button
          onClick={() => setActiveSubTab('payments')}
          className={`rounded-full px-4 py-2 text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'payments'
              ? 'bg-[#11AFFA] text-white shadow-[0_0_15px_rgba(17,175,250,0.4)] font-semibold border border-[#11AFFA]'
              : 'bg-white/[0.05] text-[#8C97A8] hover:text-white border border-white/10 backdrop-blur-md'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" /> Pagamentos & Regras
        </button>
      </div>

      {/* 2. SUB-ABA 1: LINK & PERFIL */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          {/* Highlighted Public Booking Link Card */}
          <div className="bg-gradient-to-r from-[#11AFFA]/10 to-transparent backdrop-blur-xl border border-[#11AFFA]/30 rounded-2xl p-6 shadow-[0_0_25px_rgba(17,175,250,0.15)] relative overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#11AFFA]/20 text-[#11AFFA] border border-[#11AFFA]/30">
                  SEU LINK PÚBLICO DE AGENDAMENTO
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Divulgue seu Link Exclusivo
                </h3>
                <p className="text-xs text-[#8C97A8]">
                  Seus clientes entram direto no seu perfil exclusivo para reservar horários sem fila.
                </p>
              </div>

              {/* QR Code Action Button */}
              <button
                onClick={() => setShowQrModal(true)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer flex-shrink-0"
              >
                <QrCode className="w-4 h-4 text-[#11AFFA]" /> Gerar QR Code
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-mono text-[#11AFFA] text-sm flex-1 truncate">
                {publicUrl}
              </div>

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

          {/* Profile Form */}
          <GlassCard className="p-6 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#11AFFA]" /> Perfil Público do Barbeiro
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-[#11AFFA] shadow-md"
                />
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#8C97A8] block">URL da Foto de Perfil</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white text-xs rounded-xl px-3 py-2 w-full sm:w-80 outline-none focus:border-[#11AFFA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#8C97A8] block mb-1.5">
                    Nome de Exibição *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white text-xs rounded-xl p-3 outline-none focus:border-[#11AFFA] w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8C97A8] block mb-1.5">
                    Instagram Profissional
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-[#8C97A8] absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@seu.perfil"
                      className="bg-white/5 border border-white/10 text-white text-xs rounded-xl pl-9 p-3 outline-none focus:border-[#11AFFA] w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8C97A8] block mb-1.5">
                  Biografia Profissional
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre sua experiência e diferenciais..."
                  className="bg-white/5 border border-white/10 text-white text-xs rounded-xl p-3 outline-none focus:border-[#11AFFA] w-full resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {profileSaved && (
                  <span className="text-xs text-[#2ED9A0] font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Perfil atualizado com sucesso!
                  </span>
                )}
                <button
                  type="submit"
                  className="bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg text-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" /> Salvar Perfil
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* 3. SUB-ABA 2: SERVIÇOS & COMBOS */}
      {activeSubTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#11AFFA]" /> Catálogo de Serviços & Combos
              </h3>
              <p className="text-xs text-[#8C97A8]">
                Gerencie valores, durações, destaques e crie combos promocionais
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingService(null)
                  setName('')
                  setPrice('')
                  setDurationMin('30')
                  setDescription('')
                  setIsFeatured(false)
                  setIsCombo(true)
                  setShowServiceModal(true)
                }}
                className="bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl px-3.5 py-2 text-xs border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-[#F2A93B]" /> + Criar Combo
              </button>

              <button
                onClick={() => {
                  setEditingService(null)
                  setName('')
                  setPrice('')
                  setDurationMin('30')
                  setDescription('')
                  setIsFeatured(false)
                  setIsCombo(false)
                  setShowServiceModal(true)
                }}
                className="bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-semibold rounded-xl px-4 py-2 text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Serviço
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((srv: any) => (
              <div
                key={srv.id}
                className="bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-lg transition-all relative group space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-semibold text-lg">{srv.name}</h4>
                      {srv.isCombo && (
                        <span className="text-[10px] uppercase font-bold bg-[#F2A93B]/20 text-[#F2A93B] border border-[#F2A93B]/30 px-2 py-0.5 rounded-md">
                          Combo
                        </span>
                      )}
                    </div>

                    {/* Action Buttons (Featured Toggle / Edit / Delete) */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleFeatured(srv.id)}
                        title={srv.isFeatured ? 'Remover Destaque' : 'Marcar como Destaque'}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
                          srv.isFeatured
                            ? 'bg-[#F2A93B]/20 border-[#F2A93B]/40 text-[#F2A93B] shadow-[0_0_10px_rgba(242,169,59,0.3)]'
                            : 'border-white/10 bg-white/5 text-[#8C97A8] hover:text-[#F2A93B]'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>

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
                  {srv.isFeatured && (
                    <span className="text-[10px] font-bold text-[#F2A93B] bg-[#F2A93B]/10 border border-[#F2A93B]/20 px-2 py-0.5 rounded-lg flex items-center gap-1 ml-auto">
                      <Star className="w-3 h-3 fill-current" /> Destaque
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SUB-ABA 3: HORÁRIOS & PAUSAS */}
      {activeSubTab === 'hours' && (
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#11AFFA]" /> Grade Semanal de Atendimento & Pausas
              </h3>
              <p className="text-xs text-[#8C97A8]">
                Ative os dias da semana, defina horários de abertura, fechamento e almoço
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveHours} className="space-y-4">
            {/* Interval Between Clients */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-white text-sm">Tempo de Intervalo Entre Clientes</h4>
                <p className="text-xs text-[#8C97A8]">
                  Tempo adicional reservado para higienização e preparação das ferramentas
                </p>
              </div>

              <select
                value={bufferTime}
                onChange={(e) => setBufferTime(e.target.value)}
                className="bg-[#0A0E14] border border-white/20 text-white text-xs rounded-xl px-3 py-2 outline-none font-mono focus:border-[#11AFFA]"
              >
                <option value="0">Sem intervalo (0 min)</option>
                <option value="5">5 minutos</option>
                <option value="10">10 minutos</option>
                <option value="15">15 minutos</option>
              </select>
            </div>

            {/* Days Table */}
            <div className="space-y-2 text-xs">
              {weekDays.map((item, idx) => (
                <div
                  key={item.day}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    item.active
                      ? 'bg-white/[0.04] border-white/10 text-white'
                      : 'bg-white/[0.01] border-white/5 text-[#8C97A8] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 w-44">
                    {/* iOS Switch Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...weekDays]
                        updated[idx].active = !updated[idx].active
                        setWeekDays(updated)
                      }}
                      className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                        item.active ? 'bg-[#11AFFA]' : 'bg-white/20'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          item.active ? 'left-5' : 'left-1'
                        }`}
                      />
                    </button>
                    <span className="font-semibold text-sm">{item.day}</span>
                  </div>

                  {item.active ? (
                    <div className="flex items-center gap-3 font-mono">
                      <div>
                        <span className="text-[10px] text-[#8C97A8] block">Abertura</span>
                        <input
                          type="time"
                          value={item.open}
                          onChange={(e) => {
                            const updated = [...weekDays]
                            updated[idx].open = e.target.value
                            setWeekDays(updated)
                          }}
                          className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <span className="text-[#8C97A8]">até</span>
                      <div>
                        <span className="text-[10px] text-[#8C97A8] block">Fechamento</span>
                        <input
                          type="time"
                          value={item.close}
                          onChange={(e) => {
                            const updated = [...weekDays]
                            updated[idx].close = e.target.value
                            setWeekDays(updated)
                          }}
                          className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <div className="hidden sm:block border-l border-white/10 pl-3">
                        <span className="text-[10px] text-[#F2A93B] block">Almoço</span>
                        <span className="text-xs text-white">{item.lunch}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[#8C97A8] italic font-semibold">Dia de Folga / Fechado</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {hoursSaved && (
                <span className="text-xs text-[#2ED9A0] font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Horários salvos com sucesso!
                </span>
              )}
              <button
                type="submit"
                className="bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg text-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" /> Salvar Grade de Horários
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* 5. SUB-ABA 4: PAGAMENTOS & REGRAS */}
      {activeSubTab === 'payments' && (
        <GlassCard className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#2ED9A0]" /> Pagamentos & Regras de Cancelamento
            </h3>
            <p className="text-xs text-[#8C97A8]">
              Defina sua chave PIX de recebimento e regras para cancelamentos de horários
            </p>
          </div>

          <form onSubmit={handleSavePayments} className="space-y-5">
            {/* PIX Key Input */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#2ED9A0] font-bold text-sm">
                <QrCode className="w-4 h-4" /> Chave PIX da Barbearia
              </div>
              <p className="text-xs text-[#8C97A8]">
                Esta chave será exibida para os clientes no momento da confirmação da reserva do serviço
              </p>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                className="bg-white/5 border border-white/15 focus:border-[#2ED9A0] text-white font-mono text-xs rounded-xl p-3 outline-none w-full"
              />
            </div>

            {/* Cancellation Policy */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#F2A93B] font-bold text-sm">
                <ShieldAlert className="w-4 h-4" /> Tempo Limite para Cancelamento Gratuito
              </div>
              <p className="text-xs text-[#8C97A8]">
                Antecedência mínima permitida para o cliente desmarcar o horário sem cobrança de taxa
              </p>
              <select
                value={cancelPolicy}
                onChange={(e) => setCancelPolicy(e.target.value)}
                className="bg-[#0A0E14] border border-white/20 text-white text-xs rounded-xl p-3 outline-none font-semibold w-full focus:border-[#F2A93B]"
              >
                <option value="2h">Até 2 horas antes do atendimento</option>
                <option value="6h">Até 6 horas antes do atendimento</option>
                <option value="12h">Até 12 horas antes do atendimento</option>
                <option value="24h">Até 24 horas antes do atendimento</option>
                <option value="noday">Não permitir cancelamentos no dia do corte</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {paymentSaved && (
                <span className="text-xs text-[#2ED9A0] font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Regras salvas com sucesso!
                </span>
              )}
              <button
                type="submit"
                className="bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg text-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" /> Salvar Configurações de Pagamento
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0E14]/95 backdrop-blur-2xl border border border-[#11AFFA]/40 rounded-3xl p-6 shadow-2xl shadow-black/80 max-w-sm w-full space-y-5 text-center relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 text-[#8C97A8] hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-bold text-[#11AFFA] uppercase tracking-wider">
                FÍGARO AGENDA PÚBLICA
              </span>
              <h3 className="font-bold text-white text-lg">{displayName}</h3>
              <p className="text-xs text-[#8C97A8]">
                Escaneie o QR Code abaixo para agendar horários direto pelo celular
              </p>
            </div>

            {/* QR Code Image */}
            <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-2xl border-4 border-[#11AFFA]/40">
              <img src={qrCodeApiUrl} alt="QR Code da Agenda" className="w-48 h-48 mx-auto" />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={qrCodeApiUrl}
                download="qrcode-figaro.png"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#11AFFA] hover:bg-[#0B3B5C] text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" /> Baixar QR Code
              </a>
              <Button variant="ghost" onClick={() => window.print()}>
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Glass Modal for Adding / Editing Service */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0E14]/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl shadow-black/80 max-w-md w-full space-y-4">
            <h3 className="font-bold text-white text-lg border-b border-white/10 pb-3">
              {editingService
                ? 'Editar Item'
                : isCombo
                ? 'Novo Combo Promocional'
                : 'Novo Serviço'}
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
                <Button variant="ghost" type="button" onClick={() => setShowServiceModal(false)}>
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
      )}
    </div>
  )
}
