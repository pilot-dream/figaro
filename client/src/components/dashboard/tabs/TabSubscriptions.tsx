import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Crown, CheckCircle2, XCircle, Plus, Users, MoreVertical, Trash2, Ban } from 'lucide-react'
import { useConfirmStore } from '@/stores/confirm.store'
import { useToastStore } from '@/stores/toast.store'

import { fetchSubscriptionPlans, createSubscriptionPlan, fetchSubscribers, updateSubscriberStatus, deleteSubscription } from '@/lib/api'

// Mocks para tipagem temporária
interface SubscriptionPlan {
  id: string
  name: string
  price: number
  cutsPerPeriod: number
  description: string
}

interface Subscriber {
  id: string
  subscriptionId?: string
  clientName: string
  planName: string
  dayOfWeek: number
  time: string
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
}

export function TabSubscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  // Fetch real data
  const loadData = async () => {
    try {
      const [fetchedPlans, fetchedSubscribers] = await Promise.all([
        fetchSubscriptionPlans(),
        fetchSubscribers()
      ])
      setPlans(fetchedPlans)
      setSubscribers(fetchedSubscribers)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  const handleUpdateStatus = async (sub: Subscriber, status: string) => {
    if (!sub.subscriptionId) return
    try {
      await updateSubscriberStatus(sub.subscriptionId, status)
      loadData()
      setOpenDropdownId(null)
    } catch (err) {
      console.error(err)
      useToastStore.getState().addToast('Erro ao alterar status', 'error')
    }
  }

  const handleDeleteSubscription = async (sub: Subscriber) => {
    if (!sub.subscriptionId) return
    const confirmed = await useConfirmStore.getState().requestConfirm({
      message: `Tem certeza que deseja excluir a assinatura de ${sub.clientName}? O horário será liberado.`,
      confirmText: 'Sim, excluir'
    })
    if (!confirmed) return
    
    try {
      await deleteSubscription(sub.subscriptionId)
      loadData()
      setOpenDropdownId(null)
    } catch (err) {
      console.error(err)
      useToastStore.getState().addToast('Erro ao excluir assinatura', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Crown className="w-6 h-6 text-[#D4AF37]" />
            Clube de Assinatura (MRR)
          </h2>
          <p className="text-[#8C97A8]">
            Gerencie seus planos e assinantes com horários cativos
          </p>
        </div>
        <Button onClick={() => setIsCreatingPlan(true)} className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#D4AF37] text-white font-medium border-none shadow-[#D4AF37]/30">
          <Plus className="w-4 h-4" />
          Novo Plano
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 border-[#1A2332]/50 hover:border-[#D4AF37] transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#D4AF37] rounded-xl">
              <Users className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#8C97A8]">Assinantes Ativos</p>
              <p className="text-2xl font-bold text-white">
                {subscribers.filter(s => s.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-6 border-[#1A2332]/50 hover:border-[#2ED9A0]/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#2ED9A0]/10 rounded-xl">
              <Crown className="w-6 h-6 text-[#2ED9A0]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#8C97A8]">MRR Projetado</p>
              <p className="text-2xl font-bold text-white">
                R$ {subscribers.filter(s => s.status === 'ACTIVE').length * (plans[0]?.price || 0)}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-6 border-[#1A2332]/50 hover:border-red-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#8C97A8]">Inadimplentes</p>
              <p className="text-2xl font-bold text-white">
                {subscribers.filter(s => s.status === 'PAST_DUE').length}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Assinantes Recentes</h3>
        <div className="grid grid-cols-1 gap-4">
          {subscribers.map(sub => (
            <GlassCard 
              key={sub.id} 
              className={`p-5 flex items-center justify-between border-[#1A2332]/50 hover:bg-[#1A2332]/20 transition-all relative ${openDropdownId === sub.id ? 'z-50' : 'z-0'}`}
            >
              <div>
                <p className="font-medium text-white text-lg">{sub.clientName}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-[#D4AF37] font-medium px-2 py-0.5 bg-[#D4AF37] rounded-md">
                    {sub.planName}
                  </span>
                  <span className="text-sm text-[#8C97A8]">
                    Toda {daysOfWeek[sub.dayOfWeek]} às {sub.time}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 relative">
                {sub.status === 'ACTIVE' && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-[#2ED9A0] bg-[#2ED9A0]/10 px-3 py-1 rounded-full border border-[#2ED9A0]/20">
                    <CheckCircle2 className="w-4 h-4" />
                    Pago
                  </span>
                )}
                {sub.status === 'PAST_DUE' && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-red-400 bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20">
                    <XCircle className="w-4 h-4" />
                    Inadimplente
                  </span>
                )}
                {sub.status === 'CANCELED' && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-gray-400 bg-gray-400/10 px-3 py-1 rounded-full border border-gray-400/20">
                    <Ban className="w-4 h-4" />
                    Cancelada
                  </span>
                )}

                <div className="relative">
                  <button 
                    onClick={() => setOpenDropdownId(openDropdownId === sub.id ? null : sub.id)}
                    className="p-2 text-[#8C97A8] hover:text-white hover:bg-[#1A2332] rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openDropdownId === sub.id && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#0A0E14] border border-[#1A2332] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                      <div className="py-1">
                        {sub.status !== 'ACTIVE' && (
                          <button 
                            onClick={() => handleUpdateStatus(sub, 'ACTIVE')}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#1A2332] flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#2ED9A0]" />
                            Marcar como Pago
                          </button>
                        )}
                        {sub.status !== 'PAST_DUE' && (
                          <button 
                            onClick={() => handleUpdateStatus(sub, 'PAST_DUE')}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#1A2332] flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4 text-red-400" />
                            Marcar Inadimplente
                          </button>
                        )}
                        {sub.status !== 'CANCELED' && (
                          <button 
                            onClick={() => handleUpdateStatus(sub, 'CANCELED')}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#1A2332] flex items-center gap-2"
                          >
                            <Ban className="w-4 h-4 text-gray-400" />
                            Cancelar Assinatura
                          </button>
                        )}
                        <hr className="border-[#1A2332] my-1" />
                        <button 
                          onClick={() => handleDeleteSubscription(sub)}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-400/10 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir Assinante
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Clique fora para fechar o menu */}
      {openDropdownId && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setOpenDropdownId(null)}
        />
      )}

      {/* Modal Novo Plano */}
      {isCreatingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-6 border-[#1A2332] shadow-2xl relative">
            <button 
              onClick={() => setIsCreatingPlan(false)}
              className="absolute top-4 right-4 text-[#8C97A8] hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Criar Novo Plano</h3>
            
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              
              const formData = new FormData(e.currentTarget)
              const name = formData.get('name') as string
              const price = formData.get('price') as string
              const cutsPerPeriod = formData.get('cutsPerPeriod') as string
              const description = formData.get('description') as string

              setIsSubmitting(true)
              try {
                await createSubscriptionPlan({
                  name,
                  price: parseFloat(price),
                  cutsPerPeriod: parseInt(cutsPerPeriod, 10),
                  description
                })
                await loadData()
                setIsCreatingPlan(false)
              } catch (err: any) {
                useToastStore.getState().addToast(err.message || 'Erro ao criar plano', 'error')
              } finally {
                setIsSubmitting(false)
              }
            }}>
              <div>
                <label className="block text-sm font-medium text-[#8C97A8] mb-1">Nome do Plano</label>
                <input name="name" type="text" placeholder="Ex: VIP Mensal" required className="w-full bg-[#0A0E14] border border-[#1A2332] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#8C97A8] mb-1">Preço Mensal (R$)</label>
                  <input name="price" type="number" min="0" step="0.01" placeholder="150.00" required className="w-full bg-[#0A0E14] border border-[#1A2332] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8C97A8] mb-1">Cortes p/ Mês</label>
                  <input name="cutsPerPeriod" type="number" min="1" placeholder="4" required className="w-full bg-[#0A0E14] border border-[#1A2332] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8C97A8] mb-1">Descrição</label>
                <textarea name="description" rows={3} placeholder="Benefícios do plano..." className="w-full bg-[#0A0E14] border border-[#1A2332] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"></textarea>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-[#D4AF37] hover:bg-[#D4AF37] text-white font-bold py-3 border-none shadow-[#D4AF37]/30 mt-2 disabled:opacity-50">
                {isSubmitting ? 'Criando...' : 'Criar Plano'}
              </Button>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
