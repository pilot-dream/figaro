import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pwrwustjaghywdzghkbh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JfCHwWZUkPXOf4-VUCOMWg_ImCEW96f'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
