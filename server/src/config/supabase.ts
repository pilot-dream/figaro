import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://pwrwustjaghywdzghkbh.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_JfCHwWZUkPXOf4-VUCOMWg_ImCEW96f'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
