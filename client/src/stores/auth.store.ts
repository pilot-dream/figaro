import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Role } from '@/types'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: { name: string; email: string; password: string; role: Role; phone: string }) => Promise<User>
  logout: () => Promise<void>
  initAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email)
        set({ user: profile, initialized: true })
      } else {
        set({ user: null, initialized: true })
      }
    } catch {
      set({ user: null, initialized: true })
    }

    // Subscribe to auth state changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email)
        set({ user: profile })
      } else {
        set({ user: null })
      }
    })
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      if (!data.user) throw new Error('Usuário não encontrado')

      const profile = await fetchProfile(data.user.id, data.user.email)
      set({ user: profile, loading: false })
      return profile
    } catch (err: any) {
      set({ loading: false })
      throw err
    }
  },

  register: async ({ name, email, password, role, phone }) => {
    set({ loading: true })
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      
      const endpoint = role === 'OWNER' ? '/auth/register-owner' : '/auth/register'
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, phone, role })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao criar conta')
      }

      // Após criar a conta no backend com sucesso (que já cria no Supabase Auth via Admin API),
      // nós apenas fazemos o login usando as mesmas credenciais para obter a sessão.
      const signInResult = await supabase.auth.signInWithPassword({ email, password })
      if (signInResult.error) throw new Error(signInResult.error.message)
      if (!signInResult.data.user) throw new Error('Usuário não encontrado após login')

      const profile = await fetchProfile(signInResult.data.user.id, signInResult.data.user.email)
      set({ user: profile, loading: false })
      return profile
    } catch (err: any) {
      set({ loading: false })
      throw err
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

async function fetchProfile(userId: string, email?: string): Promise<User> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (data) {
    let slug = data.slug
    // Auto-repair missing slug for barbers
    if ((data.role === 'BARBER' || data.role === 'MANAGER' || data.role === 'OWNER') && !slug) {
      slug = data.name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
      await supabase.from('profiles').update({ slug }).eq('id', userId)
    }

    return {
      id: data.id,
      name: data.name,
      slug: slug || undefined,
      phone: data.phone || undefined,
      email: email || undefined,
      role: data.role as Role,
      avatarUrl: data.avatar_url || undefined,
      notes: data.notes || undefined,
      googleEmail: data.google_email || undefined,
      googleSyncEnabled: data.google_sync_enabled ?? false,
      googleSyncBusyTimes: data.google_sync_busy_times ?? false,
      
      whatsappInstanceId: data.whatsapp_instance_id || undefined,
      whatsappStatus: data.whatsapp_status || 'DISCONNECTED',
      whatsappEnabled: data.whatsapp_enabled ?? false,
      whatsappReminder24h: data.whatsapp_reminder_24h ?? false,
      whatsappReminder2h: data.whatsapp_reminder_2h ?? false,
      whatsappTemplateBase: data.whatsapp_template_base || undefined,

      // SaaS
      subscriptionPlan: data.subscription_plan || 'FREE',
      saasStatus: data.saas_status || 'TRIAL',
      trialEndsAt: data.trial_ends_at || undefined,
      gracePeriodEndsAt: data.grace_period_ends_at || undefined,

      // Enterprise
      parentId: data.parent_id || undefined,
      branchName: data.branch_name || undefined,
    }
  }

  // Fallback profile if row trigger pending
  return {
    id: userId,
    name: email?.split('@')[0] || 'Usuário',
    email,
    role: 'CLIENT',
  }
}

// @ts-ignore
async function upsertProfileRow(
  id: string,
  name: string,
  email: string,
  role: Role,
  phone: string,
  slug?: string
): Promise<User> {
  const isStaff = role === 'BARBER' || role === 'MANAGER' || role === 'OWNER'
  const avatarUrl = isStaff
    ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'
    : undefined

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id,
      name,
      phone,
      role,
      slug: slug || null,
      avatar_url: avatarUrl,
    })
    .select('*')
    .single()

  if (error) {
    console.warn('Upsert profile warning:', error.message)
  }

  return {
    id: data?.id || id,
    name: data?.name || name,
    slug: data?.slug || slug,
    phone: data?.phone || phone,
    email,
    role: (data?.role as Role) || role,
    avatarUrl: data?.avatar_url || avatarUrl,
  }
}
