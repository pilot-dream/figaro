import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'
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
      } else if (user.role === 'BARBER' || user.role === 'MANAGER') {
        navigate('/painel')
      } else {
        navigate('/meus-agendamentos')
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <GlassCard glow className="w-full max-w-md p-8 space-y-6 border-[var(--color-figaro-blue)]/30 shadow-2xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[var(--color-figaro-blue)]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#11AFFA] to-[#0A0E14] border border-glass-border flex items-center justify-center mx-auto shadow-lg shadow-[rgba(17,175,250,0.3)]">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FÍGARO</h1>
          <p className="text-xs text-figaro-text-secondary flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-figaro-amber)]" />
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)]"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)]"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full mt-2" isLoading={loading}>
            Entrar <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="border-t border-white/10 pt-4 text-center">
          <p className="text-xs text-figaro-text-secondary">
            Não tem uma conta ainda?{' '}
            <Link
              to={`/registro${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="text-[var(--color-figaro-blue)] font-bold hover:underline"
            >
              Criar Conta Rápida
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
