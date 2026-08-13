import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/stores/toast.store'
import { useAuthStore } from '@/stores/auth.store'
import type { Role } from '@/types'
import { Scissors, Lock, Mail, User as UserIcon, Phone, ArrowRight } from 'lucide-react'

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const inviteToken = searchParams.get('invite')

  const register = useAuthStore((s) => s.register)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(inviteToken ? 'BARBER' : 'CLIENT')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await register({
        name,
        email,
        phone,
        password,
        role: inviteToken ? 'BARBER' : role,
        inviteToken: inviteToken || undefined,
      })

      useToastStore.getState().addToast('Conta criada com sucesso, por favor faça login', 'success')
      navigate('/login')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Houve um erro ao criar a conta'
      useToastStore.getState().addToast(message, 'error')
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Criar Conta no FÍGARO</h1>
          <p className="text-xs text-figaro-text-secondary">
            Cadastre-se para realizar e acompanhar agendamentos
          </p>
        </div>

        {/* Invite Banner or Role Selector Tabs */}
        {inviteToken ? (
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 text-center space-y-1">
            <p className="text-sm font-bold text-[#D4AF37]">✨ Convite de Equipe</p>
            <p className="text-xs text-figaro-text-secondary">
              Você está criando uma conta de <strong className="text-white">Barbeiro</strong> vinculada a uma barbearia.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-glass-border">
            <button
              type="button"
              onClick={() => setRole('CLIENT')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                role === 'CLIENT'
                  ? 'bg-[var(--color-figaro-blue)] text-white shadow-md'
                  : 'text-figaro-text-secondary hover:text-white'
              }`}
            >
              Sou Cliente
            </button>
            <button
              type="button"
              onClick={() => setRole('OWNER')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                role === 'OWNER'
                  ? 'bg-[var(--color-figaro-amber)] text-white shadow-md'
                  : 'text-figaro-text-secondary hover:text-white'
              }`}
            >
              Minha Barbearia
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-figaro-text-secondary block">
              Nome Completo *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-figaro-text-secondary absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-figaro-text-secondary block">
              WhatsApp *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-figaro-text-secondary absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-figaro-text-secondary block">
              E-mail *
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
              Crie uma Senha *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-figaro-text-secondary absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-glass-border text-white text-sm focus:outline-none focus:border-[var(--color-figaro-blue)]"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full mt-2" isLoading={loading}>
            <span>Cadastrar e Continuar</span> <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="border-t border-white/10 pt-4 text-center">
          <p className="text-xs text-figaro-text-secondary">
            Já possui uma conta?{' '}
            <Link
              to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="text-[var(--color-figaro-blue)] font-bold hover:underline"
            >
              Fazer Login
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
