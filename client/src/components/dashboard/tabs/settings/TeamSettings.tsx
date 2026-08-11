import { useState, useEffect, useCallback } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import type { User } from '@/types'
import { Plus, Edit2, Trash2, Star, User as UserIcon, X, Save, Upload, Link2, Copy, Check, UserPlus, Mail, Loader2 } from 'lucide-react'
import { uploadAvatar, supabase, fetchTeamInviteLink, addTeamMemberByEmail, removeTeamMember } from '@/lib/api'
import { useToastStore } from '@/stores/toast.store'
import { useConfirmStore } from '@/stores/confirm.store'
import { EmptyState } from '@/components/ui/EmptyState'

export function TeamSettings() {
  const addToast = useToastStore((state) => state.addToast)
  const [team, setTeam] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<User | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Invite Link State
  const [inviteToken, setInviteToken] = useState<string>('')
  const [copied, setCopied] = useState(false)

  // Add by Email State
  const [addEmail, setAddEmail] = useState('')
  const [addingEmail, setAddingEmail] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [role, setRole] = useState<'BARBER' | 'OWNER'>('BARBER')
  
  const [commissionType, setCommissionType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE')
  const [commissionValue, setCommissionValue] = useState<number>(0)

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true)
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:3001/api")
      
      const [teamRes, inviteLinkRes] = await Promise.all([
        fetch(`${API_URL}/team`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetchTeamInviteLink()
      ])

      if (teamRes.ok) {
        const data = await teamRes.json()
        setTeam(data)
      }
      setInviteToken(inviteLinkRes || '')

    } catch (err) {
      console.error('Failed to fetch team', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  const inviteUrl = inviteToken
    ? `${window.location.origin}/registro?invite=${inviteToken}`
    : ''

  const handleCopy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      addToast('Link copiado!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      addToast('Erro ao copiar link', 'error')
    }
  }

  const handleAddByEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addEmail.trim()) return

    setAddingEmail(true)
    try {
      await addTeamMemberByEmail(addEmail.trim())
      addToast('Barbeiro vinculado com sucesso!', 'success')
      setAddEmail('')
      await fetchTeam()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao vincular barbeiro'
      addToast(message, 'error')
    } finally {
      setAddingEmail(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token

      const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:3001/api")
    
      if (editingMember) {
        // Update
        const response = await fetch(`${API_URL}/team/${editingMember.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ name, phone, avatarUrl, specialty, role, commissionType, commissionValue }),
        })
        if (response.ok) {
          fetchTeam()
          setShowModal(false)
          addToast('Colaborador atualizado com sucesso!', 'success')
        } else {
          addToast('Erro ao atualizar membro', 'error')
        }
      } else {
        // Create
        const response = await fetch(`${API_URL}/team`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ name, email, password, phone, avatarUrl, specialty, role, commissionType, commissionValue }),
        })
        const data = await response.json()
        if (response.ok) {
          fetchTeam()
          setShowModal(false)
          addToast('Colaborador adicionado com sucesso!', 'success')
        } else {
          addToast(data.error || 'Erro ao criar membro', 'error')
        }
      }
    } catch (err: any) {
      console.error(err)
      addToast('Erro de conexão ao salvar membro: ' + (err.message || String(err)), 'error')
    }
  }

  const handleDelete = async (id: string, memberName: string) => {
    const confirmed = await useConfirmStore.getState().requestConfirm({
      message: `Tem certeza que deseja remover ${memberName} da equipe?`,
      confirmText: 'Sim, remover'
    })
    if (!confirmed) return
    
    setRemovingId(id)
    try {
      // First try the new unlink method (which just nullifies tenantId)
      await removeTeamMember(id)
      fetchTeam()
      addToast(`${memberName} removido da equipe.`, 'info')
    } catch (err: any) {
      // Fallback to the old method if the new one fails
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:3001/api")
      try {
        const response = await fetch(`${API_URL}/team/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          fetchTeam()
          addToast(`${memberName} removido da equipe.`, 'info')
        } else {
          addToast('Erro ao remover membro', 'error')
        }
      } catch (fallbackErr) {
        addToast('Erro de conexão ao remover membro', 'error')
      }
    } finally {
      setRemovingId(null)
    }
  }

  const openNewModal = () => {
    setEditingMember(null)
    setName('')
    setEmail('')
    setPassword('')
    setPhone('')
    setAvatarUrl('')
    setSpecialty('')
    setRole('BARBER')
    setCommissionType('PERCENTAGE')
    setCommissionValue(0)
    setShowModal(true)
  }

  const openEditModal = (member: User) => {
    setEditingMember(member)
    setName(member.name)
    setEmail(member.email || '')
    setPassword('') // Don't show password
    setPhone(member.phone || '')
    setAvatarUrl(member.avatarUrl || '')
    setSpecialty(member.specialty || '')
    setRole((member.role as any) === 'OWNER' ? 'OWNER' : 'BARBER')
    setCommissionType(member.commissionType || 'PERCENTAGE')
    setCommissionValue(member.commissionValue || 0)
    setIsUploading(false)
    setShowModal(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const url = await uploadAvatar(file)
    setIsUploading(false)

    if (url) {
      setAvatarUrl(url)
      addToast('Foto carregada com sucesso!', 'success')
    } else {
      addToast('Erro ao fazer upload da imagem', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Gestão da Equipe</h3>
          <p className="text-xs text-figaro-text-secondary mt-1">
            Gerencie os barbeiros e administradores do salão.
          </p>
        </div>
        <Button onClick={openNewModal} className="w-full sm:w-auto bg-figaro-gold-base hover:bg-[#0090FF] text-white">
          <Plus className="w-4 h-4 mr-2" /> Criar Colaborador
        </Button>
      </div>

      {/* Invite Link and Add By Email Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-5 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Convite para Novos Barbeiros</h3>
              <p className="text-[11px] text-figaro-text-sec">Compartilhe o link para se cadastrarem já vinculados.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono truncate focus:outline-none cursor-default select-all"
            />
            <button
              onClick={handleCopy}
              disabled={!inviteUrl}
              className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C5A028] disabled:opacity-40 text-black font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Adicionar Barbeiro Existente</h3>
              <p className="text-[11px] text-figaro-text-sec">Vincule um profissional pelo email.</p>
            </div>
          </div>
          <form onSubmit={handleAddByEmail} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-3.5 h-3.5 text-figaro-text-sec absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="email@barbeiro.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={addingEmail || !addEmail.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              {addingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Vincular
            </button>
          </form>
        </GlassCard>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="h-24 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : team.length === 0 ? (
        <EmptyState
          icon={UserIcon}
          title="Nenhum colaborador encontrado"
          description="Sua equipe ainda não possui nenhum barbeiro ou administrador cadastrado. Adicione profissionais para expandir sua operação."
          actionLabel="Novo Colaborador"
          actionIcon={Plus}
          onAction={openNewModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member) => (
            <GlassCard key={member.id} className="p-5 flex flex-col items-center text-center gap-4 border-white/10 hover:border-figaro-gold-base transition-colors">
              <div className="relative">
                <img
                  src={member.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'}
                  alt={member.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-glass-border shadow-md"
                />
                {member.role === 'OWNER' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--color-figaro-amber)] text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-black/20">
                    <Star className="w-3 h-3" /> Dono
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-white text-base">{member.name}</h4>
                {member.specialty && (
                  <p className="text-xs font-medium text-figaro-gold-base mt-1">{member.specialty}</p>
                )}
                <p className="text-[11px] text-figaro-text-secondary mt-1">{member.email || member.phone || 'Sem contato'}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-white/80">
                  <span className="text-[#2ED9A0]">Comissão:</span>
                  {member.commissionType === 'PERCENTAGE' ? `${member.commissionValue || 0}%` : `R$ ${(member.commissionValue || 0).toFixed(2)}`}
                </div>
              </div>

              <div className="flex gap-2 w-full mt-2">
                <Button variant="secondary" onClick={() => openEditModal(member)} className="flex-1 text-xs py-1.5 h-auto border-white/20 hover:border-white/50 text-white">
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Editar
                </Button>
                {member.role !== 'OWNER' && (
                  <Button variant="secondary" onClick={() => handleDelete(member.id, member.name)} disabled={removingId === member.id} className="flex-1 text-xs py-1.5 h-auto border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50">
                    {removingId === member.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />} Remover
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md p-6 relative bg-figaro-card/95 border-white/20 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">
              {editingMember ? 'Editar Colaborador' : 'Novo Colaborador'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:border-figaro-gold-base outline-none transition-colors"
                />
              </div>

              {!editingMember && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">Email para Login</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:border-figaro-gold-base outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">Senha Provisória</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:border-figaro-gold-base outline-none transition-colors"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:border-figaro-gold-base outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">Especialidade (Ex: Degradê e Barboterapia)</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:border-figaro-gold-base outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">Foto de Perfil (Avatar)</label>
                <div className="flex items-center gap-4">
                  {avatarUrl && (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar Preview" 
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm hover:border-figaro-gold-base cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Enviando...' : 'Escolher Arquivo'}
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

              <div>
                <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">Nível de Acesso</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:border-figaro-gold-base outline-none appearance-none transition-colors"
                >
                  <option value="BARBER">Barbeiro (Acesso à própria agenda)</option>
                  <option value="OWNER">Dono (Acesso total)</option>
                </select>
              </div>

              {/* Seção de Comissionamento */}
              <div className="pt-4 border-t border-white/10 mt-4 space-y-4">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="text-[#2ED9A0]">💰</span> Regra de Comissionamento
                </label>
                
                <div className="flex gap-2 p-1 bg-white/5 border border-glass-border rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCommissionType('PERCENTAGE')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      commissionType === 'PERCENTAGE' 
                        ? 'bg-figaro-gold-base text-white shadow-md' 
                        : 'text-figaro-text-secondary hover:text-white'
                    }`}
                  >
                    % Porcentagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommissionType('FIXED')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      commissionType === 'FIXED' 
                        ? 'bg-figaro-gold-base text-white shadow-md' 
                        : 'text-figaro-text-secondary hover:text-white'
                    }`}
                  >
                    R$ Valor Fixo
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-figaro-text-secondary block mb-1">
                    {commissionType === 'PERCENTAGE' ? 'Porcentagem (%)' : 'Valor Fixo (R$)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:border-figaro-gold-base outline-none transition-colors"
                  />
                  <p className="text-[10px] text-figaro-text-secondary mt-1.5">
                    {commissionType === 'PERCENTAGE' 
                      ? `Ex: ${commissionValue}% sobre o valor de cada atendimento.`
                      : `Ex: R$ ${commissionValue.toFixed(2)} fixos por cada atendimento.`}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Button type="submit" className="w-full bg-figaro-gold-base hover:bg-[#0090FF] text-white">
                  <Save className="w-4 h-4 mr-2" /> Salvar Colaborador
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
