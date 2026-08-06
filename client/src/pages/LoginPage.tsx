import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { Scissors, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')

  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = await login(email, password)

      if (redirect) {
        navigate(redirect)
      } else if (user.role === 'BARBER' || user.role === 'MANAGER' || user.role === 'OWNER') {
        navigate('/painel')
      } else {
        navigate('/meus-agendamentos')
      }
    } catch (err: any) {
      useToastStore.getState().addToast(err.message || 'Erro ao realizar login', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <GlassCard glow className="w-full max-w-md p-8 space-y-6 border-figaro-gold-base shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#1a1c23] to-[#0A0E14]">
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-figaro-gold-base rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-figaro-gold-light to-figaro-gold-base border border-figaro-gold-base flex items-center justify-center mx-auto shadow-lg shadow-figaro-gold-base/30">
            <Scissors className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FÍGARO</h1>
          <p className="text-xs text-figaro-text-secondary flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-figaro-gold-base" />
            Entre na sua conta para agendar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-figaro-text-secondary block">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-figaro-text-secondary absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-figaro-gold-base focus:bg-white/10 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-figaro-text-secondary block">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-figaro-text-secondary absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-figaro-gold-base focus:bg-white/10 transition-colors"
              />
            </div>
          </div>

          <Button type="submit" variant="amber" size="lg" className="w-full mt-2" isLoading={loading}>
            <span>Entrar</span> <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="border-t border-white/10 pt-4 text-center">
          <p className="text-xs text-figaro-text-secondary">
            Não tem uma conta ainda?{' '}
            <Link
              to={`/registro${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="text-figaro-gold-base font-bold hover:text-figaro-gold-base hover:underline transition-colors"
            >
              Criar Conta Rápida
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
