import { createClient } from '@supabase/supabase-js'
import { config } from '../config/env'

export const supabaseAdmin = createClient(
  config.get('SUPABASE_URL'),
  config.get('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
