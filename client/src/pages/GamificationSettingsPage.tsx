import React, { useEffect, useState } from 'react'
import { useGamificationStore } from '../stores/gamification.store'
import { Gift, Zap, Users, Sparkles, Save, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
export const GamificationSettingsPage: React.FC = () => {
  const { config, isLoading, isSaving, fetchConfig, updateConfig, applyRecommended } = useGamificationStore()
  const [localConfig, setLocalConfig] = useState(config)

  useEffect(() => {
    fetchConfig()
  }, [])

  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  if (isLoading || !localConfig) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#11AFFA]"></div>
      </div>
    )
  }

  const handleToggle = (key: keyof typeof localConfig) => {
    setLocalConfig(prev => ({ ...prev!, [key]: !prev![key] }))
  }

  const handleNumberChange = (key: keyof typeof localConfig, value: string) => {
    setLocalConfig(prev => ({ ...prev!, [key]: parseFloat(value) || 0 }))
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="p-2 -ml-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              title="Voltar ao início"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Gamificação & Automação</h1>
          </div>
          <p className="text-white/60 mt-2">Configure as recompensas e mensagens automáticas para seus clientes.</p>
        </div>
        <button
          onClick={applyRecommended}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#11AFFA]/20 to-[#11AFFA]/10 px-4 py-2 text-sm font-semibold text-[#11AFFA] border border-[#11AFFA]/20 hover:bg-[#11AFFA]/30 transition-all shadow-[0_0_15px_rgba(17,175,250,0.2)]"
        >
          <Sparkles className="h-4 w-4" />
          Modo Recomendado
        </button>
      </div>

      {/* Automações (Toggles) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Automações Ativas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="flex flex-col justify-between rounded-2xl bg-figaro-black/90 p-5 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                <Gift className="h-5 w-5" />
              </div>
              <h3 className="font-medium">Mensagens de Aniversário</h3>
            </div>
            <p className="text-sm text-white/50 mb-6">Mande felicitações e descontos automáticos no dia do aniversário.</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{localConfig.enableBirthdays ? 'Ativado' : 'Desativado'}</span>
              <button 
                onClick={() => handleToggle('enableBirthdays')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localConfig.enableBirthdays ? 'bg-[#11AFFA]' : 'bg-white/20'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localConfig.enableBirthdays ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl bg-figaro-black/90 p-5 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-figaro-gold-base rounded-lg text-figaro-gold-base">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-medium">Reativação (Win-back)</h3>
            </div>
            <p className="text-sm text-white/50 mb-6">Traga de volta clientes sumidos há 30, 60 ou 90 dias com mensagens automáticas.</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{localConfig.enableWinBacks ? 'Ativado' : 'Desativado'}</span>
              <button 
                onClick={() => handleToggle('enableWinBacks')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localConfig.enableWinBacks ? 'bg-[#11AFFA]' : 'bg-white/20'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localConfig.enableWinBacks ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl bg-figaro-black/90 p-5 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-medium">Programa de Indicação</h3>
            </div>
            <p className="text-sm text-white/50 mb-6">Incentive o boca a boca pagando por novos clientes indicados.</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{localConfig.enableReferrals ? 'Ativado' : 'Desativado'}</span>
              <button 
                onClick={() => handleToggle('enableReferrals')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localConfig.enableReferrals ? 'bg-[#11AFFA]' : 'bg-white/20'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localConfig.enableReferrals ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Regras e Recompensas */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Regras e Recompensas</h2>
        <div className="rounded-2xl bg-figaro-black/90 p-6 backdrop-blur-md border border-white/10 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div className="max-w-md">
              <h3 className="font-medium">Multiplicador de Pontos</h3>
              <p className="text-sm text-white/50">Quantos pontos o cliente ganha a cada R$ 1,00 gasto em serviços.</p>
            </div>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                min="0"
                value={localConfig.pointsPerCurrency}
                onChange={(e) => handleNumberChange('pointsPerCurrency', e.target.value)}
                className="w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#11AFFA]/50"
              />
              <span className="absolute right-4 top-2.5 text-white/40 text-sm">pts</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
            <div className="max-w-md">
              <h3 className="font-medium">Bônus de Cadastro</h3>
              <p className="text-sm text-white/50">Desconto financeiro ou pontos creditados para novos clientes ao criarem conta.</p>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-white/40 text-sm">R$</span>
              <input 
                type="number" 
                min="0"
                value={localConfig.signupDiscountValue}
                onChange={(e) => handleNumberChange('signupDiscountValue', e.target.value)}
                className="w-32 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#11AFFA]/50"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
            <div className="max-w-md">
              <h3 className="font-medium">Bônus de Indicação</h3>
              <p className="text-sm text-white/50">Pontuação ou valor de desconto para quem indicar um amigo (liberado após o 1º corte pago do indicado).</p>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-white/40 text-sm">R$</span>
              <input 
                type="number" 
                min="0"
                value={localConfig.referralRewardValue}
                onChange={(e) => handleNumberChange('referralRewardValue', e.target.value)}
                className="w-32 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#11AFFA]/50"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Footer / Salvar */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={() => updateConfig(localConfig)}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-[#11AFFA] px-6 py-3 font-semibold text-white hover:bg-[#11AFFA]/90 transition-colors disabled:opacity-70"
        >
          {isSaving ? (
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

    </div>
  )
}
