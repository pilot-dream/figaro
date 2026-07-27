import dotenv from 'dotenv'

dotenv.config()

class ConfigService {
  private readonly config: Map<string, string>

  constructor() {
    this.validateRequiredVars(['DATABASE_URL', 'JWT_SECRET', 'SUPABASE_SERVICE_ROLE_KEY'])
    this.config = new Map()
    this.config.set('PORT', process.env.PORT || '3001')
    this.config.set('DATABASE_URL', process.env.DATABASE_URL!)
    this.config.set('JWT_SECRET', process.env.JWT_SECRET!)
    this.config.set('SUPABASE_URL', process.env.SUPABASE_URL || 'https://pwrwustjaghywdzghkbh.supabase.co')
    this.config.set('SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY || 'sb_publishable_JfCHwWZUkPXOf4-VUCOMWg_ImCEW96f')
    this.config.set('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }

  private validateRequiredVars(vars: string[]) {
    for (const v of vars) {
      if (!process.env[v]) {
        throw new Error(`Environment variable ${v} is missing`)
      }
    }
  }

  get(key: string): string {
    if (!this.config.has(key)) {
      throw new Error(`Config ${key} not found`)
    }
    return this.config.get(key)!
  }
}

export const config = new ConfigService()
