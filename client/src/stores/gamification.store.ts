import { create } from 'zustand'
import { API_URL, supabase } from '../lib/api'
import { useToastStore } from './toast.store'

export interface GamificationConfig {
  id: string
  tenantId: string
  pointsPerCurrency: number
  signupDiscountValue: number
  referralRewardValue: number
  enableBirthdays: boolean
  enableWinBacks: boolean
  enableReferrals: boolean
}

interface GamificationState {
  config: GamificationConfig | null
  isLoading: boolean
  isSaving: boolean
  fetchConfig: () => Promise<void>
  updateConfig: (data: Partial<GamificationConfig>) => Promise<void>
  applyRecommended: () => void
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  config: null,
  isLoading: false,
  isSaving: false,

  fetchConfig: async () => {
    set({ isLoading: true })
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`${API_URL}/gamification/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch config')
      
      const data = await response.json()
      set({ config: data })
    } catch (error: any) {
      console.error('Error fetching gamification config:', error)
      useToastStore.getState().addToast('Erro ao carregar configurações de gamificação', 'error')
    } finally {
      set({ isLoading: false })
    }
  },

  updateConfig: async (data: Partial<GamificationConfig>) => {
    set({ isSaving: true })
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`${API_URL}/gamification/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.error || 'Failed to update config')
      }

      const updatedData = await response.json()
      set({ config: updatedData })
      useToastStore.getState().addToast('Configurações salvas com sucesso!', 'success')
    } catch (error: any) {
      console.error('Error updating gamification config:', error)
      useToastStore.getState().addToast(`Erro: ${error.message}`, 'error')
    } finally {
      set({ isSaving: false })
    }
  },

  applyRecommended: () => {
    const currentConfig = get().config
    if (!currentConfig) return

    set({
      config: {
        ...currentConfig,
        enableBirthdays: true,
        enableWinBacks: true,
        enableReferrals: true,
        pointsPerCurrency: 1.0,
        signupDiscountValue: 10.0,
        referralRewardValue: 15.0
      }
    })
    
    useToastStore.getState().addToast('Modo recomendado aplicado! Salve para confirmar.', 'success')
  }
}))
