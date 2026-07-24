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
      const slug = role === 'BARBER'
        ? name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
        : null

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role, phone, slug },
        },
      })

      if (error) throw new Error(error.message)
      if (!data.user) throw new Error('Falha ao criar conta')

      // Ensure profile row exists in public.profiles table
      const profile = await upsertProfileRow(data.user.id, name, email, role, phone, slug || undefined)
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
    if (data.role === 'BARBER' && !slug) {
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

async function upsertProfileRow(
  id: string,
  name: string,
  email: string,
  role: Role,
  phone: string,
  slug?: string
): Promise<User> {
  const avatarUrl = role === 'BARBER'
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
