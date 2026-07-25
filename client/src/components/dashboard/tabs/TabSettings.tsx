import { useState, useEffect, lazy, Suspense } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { fetchServices, supabase, uploadAvatar } from '@/lib/api'
import type { Service, User } from '@/types'
import { useToastStore } from '@/stores/toast.store'
import { useConfirmStore } from '@/stores/confirm.store'
import { EmptyState } from '@/components/ui/EmptyState'
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
  MessageCircle,
  Upload
} from 'lucide-react'
import { ModalSkeleton } from '@/components/ui/ModalSkeleton'

const TeamSettings = lazy(() => 
  import('./settings/TeamSettings').then(module => ({ default: module.TeamSettings }))
)

const AddServiceModal = lazy(() =>
  import('./settings/AddServiceModal').then(module => ({ default: module.AddServiceModal }))
)

interface TabSettingsProps {
  barber: User
}

type SettingsSubTab = 'profile' | 'services' | 'hours' | 'payments' | 'integrations' | 'notifications' | 'team'

export function TabSettings({ barber }: TabSettingsProps) {
  const addToast = useToastStore((state) => state.addToast)
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('profile')
  const [services, setServices] = useState<(Service & { isFeatured?: boolean; isCombo?: boolean })[]>([])
  const [copied, setCopied] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [showWhatsappModal, setShowWhatsappModal] = useState(false)
  
  // Real WhatsApp Integration States
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null)
  const [instanceName, setInstanceName] = useState<string | null>(null)
  const [isQrLoading, setIsQrLoading] = useState(false)

  // Profile Subtab Form State
  const [displayName, setDisplayName] = useState(barber.name || 'Filipe Lacerda')
  const [bio, setBio] = useState(barber.notes || 'Especialista em cortes clássicos e barboterapia.')

  // WhatsApp Notifications State
  const [whatsappEnabled, setWhatsappEnabled] = useState(barber.whatsappEnabled ?? false)
  const [whatsappReminder24h, setWhatsappReminder24h] = useState(barber.whatsappReminder24h ?? false)
  const [whatsappReminder2h, setWhatsappReminder2h] = useState(barber.whatsappReminder2h ?? false)
  const [whatsappTemplate, setWhatsappTemplate] = useState(barber.whatsappTemplateBase || 'Olá {{client_name}}, lembrete do seu agendamento: {{services}} com {{barber_name}} às {{time}}.')

  const handleUpdateWhatsApp = async (fields: Partial<{ whatsappEnabled: boolean; whatsappReminder24h: boolean; whatsappReminder2h: boolean; whatsappTemplateBase: string }>) => {
    try {
      await supabase.from('profiles').update({
        whatsapp_enabled: fields.whatsappEnabled ?? whatsappEnabled,
        whatsapp_reminder_24h: fields.whatsappReminder24h ?? whatsappReminder24h,
        whatsapp_reminder_2h: fields.whatsappReminder2h ?? whatsappReminder2h,
        whatsapp_template_base: fields.whatsappTemplateBase ?? whatsappTemplate
      }).eq('id', barber.id)
    } catch (err) {
      console.error('Failed to update WhatsApp settings', err)
    }
  }

  // Google Calendar Integration State
  const [googleSyncEnabled, setGoogleSyncEnabled] = useState(barber.googleSyncEnabled ?? false)
  const [googleSyncBusyTimes, setGoogleSyncBusyTimes] = useState(barber.googleSyncBusyTimes ?? false)
  const [googleEmail, setGoogleEmail] = useState(barber.googleEmail)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('google_sync') === 'success' && params.get('refresh_token')) {
      const email = params.get('email') || ''
      const token = params.get('refresh_token') || ''
      
      // Update Supabase with the new tokens
      supabase.from('profiles').update({
        google_refresh_token: token,
        google_email: email,
        google_sync_enabled: true,
        google_sync_busy_times: true
      }).eq('id', barber.id).then(() => {
        setGoogleEmail(email)
        setGoogleSyncEnabled(true)
        setGoogleSyncBusyTimes(true)
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
      })
    }
  }, [barber.id])

  const handleUpdateGoogleSettings = async (enabled: boolean, busyTimes: boolean) => {
    setGoogleSyncEnabled(enabled)
    setGoogleSyncBusyTimes(busyTimes)
    try {
      await supabase.from('profiles').update({
        google_sync_enabled: enabled,
        google_sync_busy_times: busyTimes
      }).eq('id', barber.id)
    } catch (err) {
      console.error('Failed to update Google settings', err)
    }
  }

  const handleDisconnectGoogle = async () => {
    try {
      await supabase.from('profiles').update({
        google_refresh_token: null,
        google_email: null,
        google_sync_enabled: false,
        google_sync_busy_times: false
      }).eq('id', barber.id)
      
      setGoogleEmail(undefined)
      setGoogleSyncEnabled(false)
      setGoogleSyncBusyTimes(false)
    } catch (err) {
      console.error('Failed to disconnect Google Calendar', err)
    }
  }
  const [instagram, setInstagram] = useState('@filipe.navalha')
  const [avatarUrl, setAvatarUrl] = useState(
    barber.avatarUrl ||
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'
  )
  const [isUploading, setIsUploading] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const url = await uploadAvatar(file)
    setIsUploading(false)

    if (url) {
      setAvatarUrl(url)
      // Salva imediatamente no banco para evitar perda ao trocar de aba
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', barber.id)
      addToast('Foto de perfil atualizada com sucesso!', 'success')
    } else {
      addToast('Erro ao fazer upload da imagem', 'error')
    }
  }

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
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
    publicUrl
  )}&color=000000&bgcolor=ffffff`

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

  const handleDeleteService = async (serviceId: string) => {
    const confirmed = await useConfirmStore.getState().requestConfirm({
      message: 'Deseja excluir este serviço?',
      confirmText: 'Sim, excluir'
    })
    if (confirmed) {
      setServices((prev) => prev.filter((s) => s.id !== serviceId))
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await supabase.from('profiles').update({
        name: displayName,
        notes: bio,
        avatar_url: avatarUrl
        // instagram could be saved here if you add it to the schema
      }).eq('id', barber.id)
      
      setProfileSaved(true)
      addToast('Perfil atualizado com sucesso!', 'success')
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err) {
      console.error('Erro ao salvar perfil', err)
      addToast('Erro ao salvar o perfil. Tente novamente.', 'error')
    }
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

        <button
          onClick={() => setActiveSubTab('integrations')}
          className={`rounded-full px-4 py-2 text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'integrations'
              ? 'bg-[#11AFFA] text-white shadow-[0_0_15px_rgba(17,175,250,0.4)] font-semibold border border-[#11AFFA]'
              : 'bg-white/[0.05] text-[#8C97A8] hover:text-white border border-white/10 backdrop-blur-md'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Integrações
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`rounded-full px-4 py-2 text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'notifications'
              ? 'bg-[#11AFFA] text-white shadow-[0_0_15px_rgba(17,175,250,0.4)] font-semibold border border-[#11AFFA]'
              : 'bg-white/[0.05] text-[#8C97A8] hover:text-white border border-white/10 backdrop-blur-md'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" /> Notificações
        </button>

        {barber.role === 'OWNER' && (
          <button
            onClick={() => setActiveSubTab('team')}
            className={`rounded-full px-4 py-2 text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'team'
                ? 'bg-[#11AFFA] text-white shadow-[0_0_15px_rgba(17,175,250,0.4)] font-semibold border border-[#11AFFA]'
                : 'bg-white/[0.05] text-[#8C97A8] hover:text-white border border-white/10 backdrop-blur-md'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" /> Equipe
          </button>
        )}
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
                  <label className="text-xs font-semibold text-[#8C97A8] block mb-2">Sua Foto de Perfil</label>
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs hover:border-[#11AFFA] cursor-pointer transition-colors w-fit">
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Enviando...' : 'Alterar Foto'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
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

          {services.length === 0 ? (
            <div className="mt-8">
              <EmptyState 
                icon={Scissors}
                title="Nenhum serviço cadastrado"
                description="Você ainda não possui serviços ou combos cadastrados no seu catálogo."
                actionLabel="Adicionar Serviço"
                actionIcon={Plus}
                onAction={() => {
                  setEditingService(null)
                  setName('')
                  setPrice('')
                  setDurationMin('30')
                  setDescription('')
                  setIsFeatured(false)
                  setIsCombo(false)
                  setShowServiceModal(true)
                }}
              />
            </div>
          ) : (
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
          )}
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

      {/* 6. SUB-ABA 5: INTEGRAÇÕES */}
      {activeSubTab === 'integrations' && (
        <GlassCard className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#11AFFA]" /> Integração Google Calendar
            </h3>
            <p className="text-xs text-[#8C97A8]">
              Sincronize seus agendamentos do Fígaro com a sua agenda pessoal do Google
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Sincronização com Google Agenda</h4>
                <p className="text-xs text-[#8C97A8]">
                  Status:{' '}
                  {googleEmail ? (
                    <span className="font-semibold text-[#2ED9A0]">Conectado como {googleEmail}</span>
                  ) : (
                    <span className="font-semibold text-white">Desconectado</span>
                  )}
                </p>
              </div>
              
              {googleEmail ? (
                <button 
                  onClick={handleDisconnectGoogle}
                  className="bg-white/10 text-white border border-white/20 font-bold px-4 py-2 rounded-xl text-xs hover:bg-white/20 hover:text-red-400 hover:border-red-500/30 transition-all shadow-lg flex items-center gap-2"
                >
                  Desconectar
                </button>
              ) : (
                <button 
                  onClick={async () => {
                    try {
                      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
                      const res = await fetch(`${API_URL}/google/auth-url?userId=${barber.id}`)
                      if (!res.ok) {
                        const errText = await res.text()
                        addToast('Erro na API: ' + errText, 'error')
                        return
                      }
                      const data = await res.json()
                      if (data.url) {
                        window.location.href = data.url
                      } else {
                        addToast('URL não retornada pela API', 'error')
                      }
                    } catch (err: any) {
                      console.error('Failed to connect Google Calendar', err)
                      addToast('Erro de Conexão (Verifique se o backend está rodando): ' + err.message, 'error')
                    }
                  }}
                  className="bg-white text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2"
                >
                  Conectar com Google Calendar
                </button>
              )}
            </div>
            
            <div className="h-[1px] w-full bg-white/10" />

            <div className={`space-y-4 ${!googleEmail ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-sm font-semibold text-white block">Enviar novos agendamentos</span>
                  <span className="text-xs text-[#8C97A8]">
                    Agendamentos do Fígaro aparecerão automaticamente no seu Google Calendar.
                  </span>
                </div>
                {/* iOS Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleUpdateGoogleSettings(!googleSyncEnabled, googleSyncBusyTimes)}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                    googleSyncEnabled ? 'bg-[#11AFFA]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      googleSyncEnabled ? 'left-5' : 'left-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-sm font-semibold text-white block">Bloquear horários ocupados</span>
                  <span className="text-xs text-[#8C97A8]">
                    Eventos da sua agenda do Google vão bloquear horários no Fígaro.
                  </span>
                </div>
                {/* iOS Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleUpdateGoogleSettings(googleSyncEnabled, !googleSyncBusyTimes)}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                    googleSyncBusyTimes ? 'bg-[#11AFFA]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      googleSyncBusyTimes ? 'left-5' : 'left-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
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
        <Suspense fallback={<ModalSkeleton />}>
          <AddServiceModal
            isOpen={showServiceModal}
            onClose={() => setShowServiceModal(false)}
            editingService={!!editingService}
            isCombo={isCombo}
            setIsCombo={setIsCombo}
            name={name}
            setName={setName}
            price={price}
            setPrice={setPrice}
            durationMin={durationMin}
            setDurationMin={setDurationMin}
            description={description}
            setDescription={setDescription}
            isFeatured={isFeatured}
            setIsFeatured={setIsFeatured}
            handleSaveService={handleSaveService}
          />
        </Suspense>
      )}

      {/* 6. SUB-ABA 6: NOTIFICATIONS */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-6">
          <GlassCard className="p-6 border-[#11AFFA]/20 relative overflow-hidden space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-full bg-[#11AFFA]/10 border border-[#11AFFA]/30 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#11AFFA]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Automações de WhatsApp
                </h3>
                <p className="text-xs text-[#8C97A8]">
                  Gerencie lembretes e confirmações enviadas automaticamente para seus clientes.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Status de Conexão e Toggle Habilitar Geral */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Status da Conexão</h4>
                  <p className="text-xs text-[#8C97A8]">
                    {barber.whatsappStatus === 'CONNECTED' 
                      ? 'Seu WhatsApp está conectado e pronto para enviar.' 
                      : 'Conecte seu WhatsApp para enviar mensagens através do seu número.'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {barber.whatsappStatus === 'CONNECTED' ? (
                    <span className="text-xs font-semibold px-2 py-1 bg-[#2ED9A0]/20 text-[#2ED9A0] border border-[#2ED9A0]/30 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" /> Conectado
                    </span>
                  ) : (
                    <button 
                      onClick={async () => {
                        setShowWhatsappModal(true)
                        setIsQrLoading(true)
                        setQrCodeBase64(null)
                        try {
                          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
                          const res = await fetch(`${API_URL}/whatsapp/instance/create`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ barberId: barber.id })
                          })
                          const data = await res.json()
                          if (data.qrCodeBase64) {
                            setQrCodeBase64(data.qrCodeBase64)
                            setInstanceName(data.instanceName)
                          }
                        } catch (err) {
                          console.error('Failed to create instance', err)
                        } finally {
                          setIsQrLoading(false)
                        }
                      }}
                      className="text-xs font-semibold bg-[#2ED9A0] text-black px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(46,217,160,0.3)] hover:scale-105 transition-all cursor-pointer"
                    >
                      Escanear QR Code
                    </button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={whatsappEnabled}
                      onChange={(e) => {
                        setWhatsappEnabled(e.target.checked)
                        handleUpdateWhatsApp({ whatsappEnabled: e.target.checked })
                      }}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2ED9A0]"></div>
                  </label>
                </div>
              </div>

              <div className={`space-y-4 transition-all ${!whatsappEnabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                {/* Lembrete 24h */}
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Lembrete 24h antes</h4>
                    <p className="text-xs text-[#8C97A8]">Avisa o cliente 1 dia antes do agendamento.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={whatsappReminder24h}
                      onChange={(e) => {
                        setWhatsappReminder24h(e.target.checked)
                        handleUpdateWhatsApp({ whatsappReminder24h: e.target.checked })
                      }}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#11AFFA]"></div>
                  </label>
                </div>

                {/* Lembrete 2h */}
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Lembrete 2h antes</h4>
                    <p className="text-xs text-[#8C97A8]">Lembrete final logo antes do horário marcado.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={whatsappReminder2h}
                      onChange={(e) => {
                        setWhatsappReminder2h(e.target.checked)
                        handleUpdateWhatsApp({ whatsappReminder2h: e.target.checked })
                      }}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#11AFFA]"></div>
                  </label>
                </div>

                {/* Template de Mensagem */}
                <div className="pt-2 space-y-2">
                  <label className="text-xs font-semibold text-[#8C97A8] block uppercase tracking-wider">
                    Template Base da Mensagem
                  </label>
                  <textarea
                    value={whatsappTemplate}
                    onChange={(e) => setWhatsappTemplate(e.target.value)}
                    onBlur={() => handleUpdateWhatsApp({ whatsappTemplateBase: whatsappTemplate })}
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl p-4 outline-none focus:border-[#11AFFA] resize-none"
                    placeholder="Olá {{client_name}}, lembrete do seu agendamento..."
                  />
                  <p className="text-[10px] text-[#8C97A8]">
                    Variáveis disponíveis: <code className="text-[#11AFFA] bg-[#11AFFA]/10 px-1 rounded">{"{{client_name}}"}</code>, <code className="text-[#11AFFA] bg-[#11AFFA]/10 px-1 rounded">{"{{barber_name}}"}</code>, <code className="text-[#11AFFA] bg-[#11AFFA]/10 px-1 rounded">{"{{services}}"}</code>, <code className="text-[#11AFFA] bg-[#11AFFA]/10 px-1 rounded">{"{{time}}"}</code>
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 7. SUB-ABA 7: TEAM */}
      {activeSubTab === 'team' && barber.role === 'OWNER' && (
      <Suspense fallback={<ModalSkeleton />}>
        <TeamSettings />
      </Suspense>
      )}

      {/* WHATSAPP CONNECTION MODAL */}
      {showWhatsappModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWhatsappModal(false)}
          />
          <div className="relative w-full max-w-sm bg-[#121214] border border-[#2ED9A0]/30 rounded-3xl p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowWhatsappModal(false)}
              className="absolute top-4 right-4 text-[#8C97A8] hover:text-white bg-white/5 rounded-full p-2 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#2ED9A0]/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#2ED9A0]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Conectar Dispositivo
                </h3>
                <p className="text-sm text-[#8C97A8] mt-1">
                  Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código abaixo:
                </p>
              </div>

              {/* Real QR Code */}
              <div className="mx-auto w-48 h-48 bg-white rounded-xl flex items-center justify-center p-2 opacity-90 relative overflow-hidden">
                {isQrLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2ED9A0]"></div>
                ) : qrCodeBase64 ? (
                  <img 
                    src={qrCodeBase64.startsWith('data:image') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`} 
                    alt="QR Code" 
                    className="w-full h-full object-contain mix-blend-multiply" 
                  />
                ) : (
                  <div className="text-xs text-gray-500 text-center px-4">
                    Seu servidor Evolution API não respondeu com um QR Code.<br/><br/>
                    Verifique o arquivo .env
                  </div>
                )}
              </div>
            </div>
            
            {/* Polling Effect embedded logic via simple button manual check for now, or you could do a real useEffect polling if needed */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <Button
                onClick={async () => {
                  if (!instanceName) {
                    // Fallback to MOCK if real instance failed
                    try {
                      await supabase.from('profiles').update({
                        whatsapp_status: 'CONNECTED',
                        whatsapp_instance_id: `inst_${barber.id}`
                      }).eq('id', barber.id)
                      addToast("Simulação: WhatsApp Conectado com Sucesso! Atualize a página.", 'success')
                      setShowWhatsappModal(false)
                    } catch (e) {}
                    return
                  }
                  
                  try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
                    const res = await fetch(`${API_URL}/whatsapp/instance/status/${instanceName}`)
                    const data = await res.json()
                    
                    if (data.state === 'CONNECTED') {
                      await supabase.from('profiles').update({
                        whatsapp_status: 'CONNECTED',
                        whatsapp_instance_id: instanceName
                      }).eq('id', barber.id)
                      
                      addToast("Conectado com Sucesso!", 'success')
                      setShowWhatsappModal(false)
                    } else {
                      addToast(`Status atual: ${data.state}. Por favor, escaneie o código.`, 'info')
                    }
                  } catch (err) {
                    console.error('Failed to check status', err)
                  }
                }}
                className="w-full bg-[#2ED9A0] text-black hover:bg-[#20A67A]"
              >
                Já Escaneei (Verificar Status)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
