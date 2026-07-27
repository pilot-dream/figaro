import { create } from 'zustand'
import type { Branch } from '@/types'

interface BranchState {
  /** Filial selecionada no momento (null = visão global da rede inteira) */
  selectedBranch: Branch | null
  /** Lista de filiais disponíveis (incluindo a matriz como primeiro item) */
  branches: Branch[]
  /** Se o usuário é dono de uma rede com filiais */
  isNetwork: boolean
  /** Estado de carregamento */
  loading: boolean

  setBranches: (branches: Branch[]) => void
  setSelectedBranch: (branch: Branch | null) => void
  fetchBranches: () => Promise<void>
  createBranch: (data: any) => Promise<void>
}

export const useBranchStore = create<BranchState>((set) => ({
  selectedBranch: null,
  branches: [],
  isNetwork: false,
  loading: false,

  setBranches: (branches) => set({ branches, isNetwork: branches.length > 1 }),

  setSelectedBranch: (branch) => set({ selectedBranch: branch }),

  fetchBranches: async () => {
    set({ loading: true })
    try {
      const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:3001/api")
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        set({ loading: false })
        return
      }

      const response = await fetch(`${API_URL}/dashboard/branches`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        set({ loading: false })
        return
      }

      const data = await response.json()

      const allBranches: Branch[] = [
        { id: data.matriz.id, name: data.matriz.name, branchName: data.matriz.branchName || 'Matriz' },
        ...data.branches.map((b: { id: string; name: string; branchName?: string; slug?: string }) => ({
          id: b.id,
          name: b.name,
          branchName: b.branchName || b.name,
          slug: b.slug
        }))
      ]

      set({ branches: allBranches, isNetwork: allBranches.length > 1, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createBranch: async (data: any) => {
    const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:3001/api")
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) throw new Error('Não autenticado')

    const response = await fetch(`${API_URL}/dashboard/branches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || 'Erro ao criar filial')
    }

    // Recarrega as filiais após criar
    await useBranchStore.getState().fetchBranches()
  }
}))
