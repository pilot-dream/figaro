/**
 * PushNotificationPrompt - Modal Educativo de Permissão Push
 * 
 * Exibe um modal glassmorphism amigável pedindo ao usuário para
 * ativar as notificações push ANTES de disparar o prompt nativo
 * do navegador. Isso é necessário porque:
 * 
 * 1. Navegadores bloqueiam prompts automáticos (precisa de user gesture)
 * 2. Se o usuário negar no prompt nativo, é muito difícil reverter
 * 3. Um modal educativo aumenta a taxa de aceitação em ~3x
 */

import { useState } from 'react'
import { Bell, X, Smartphone, Clock } from 'lucide-react'
import {
  requestPushPermission,
  dismissPushPrompt,
} from '@/lib/firebase'
import { API_URL } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'

interface PushNotificationPromptProps {
  onClose: () => void
}

export function PushNotificationPrompt({ onClose }: PushNotificationPromptProps) {
  const [isLoading, setIsLoading] = useState(false)
  const user = useAuthStore((s) => s.user)

  /**
   * Fluxo ao clicar "Ativar Lembretes":
   * 1. Chama requestPushPermission() (que dispara o prompt nativo)
   * 2. Se o token for gerado, envia para o backend salvar
   * 3. Fecha o modal
   */
  const handleActivate = async () => {
    setIsLoading(true)

    try {
      const token = await requestPushPermission()

      if (token && user) {
        // Envia o token para o backend persistir no perfil do usuário
        await fetch(`${API_URL}/users/push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            token,
            // Metadados úteis para debugging/segmentação
            platform: navigator.userAgent.includes('Android') ? 'android' : 
                      navigator.userAgent.includes('iPhone') ? 'ios' : 'web',
            createdAt: new Date().toISOString(),
          }),
        })
      }
    } catch (error) {
      console.error('[PushPrompt] Erro ao ativar notificações:', error)
    } finally {
      setIsLoading(false)
      onClose()
    }
  }

  /**
   * Fluxo ao clicar "Agora não":
   * Marca no localStorage que o prompt foi dispensado
   * para não exibir novamente nesta sessão.
   */
  const handleDismiss = () => {
    dismissPushPrompt()
    onClose()
  }

  return (
    <>
      {/* Backdrop escurecido */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal central */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
        <div
          className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#0A0E14]/90 backdrop-blur-md p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botão fechar */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Ícone principal animado */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FBE7A1]/20 to-[#D4AF37]/10 border border-[#D4AF37] flex items-center justify-center">
                <Bell className="w-7 h-7 text-[#D4AF37] animate-[wiggle_1.5s_ease-in-out_infinite]" />
              </div>
              {/* Dot de notificação */}
              <span className="absolute top-1 right-1 w-3 h-3 bg-[#F0553F] rounded-full border-2 border-[#0A0E14] animate-pulse" />
            </div>
          </div>

          {/* Título */}
          <h3 className="text-center text-lg font-bold text-white mb-2">
            Fique por dentro!
          </h3>

          {/* Descrição principal */}
          <p className="text-center text-sm text-gray-400 mb-6 leading-relaxed">
            Quer ser avisado <span className="text-[#D4AF37] font-semibold">2h antes</span> do seu corte para não esquecer? Ative os lembretes.
          </p>

          {/* Benefícios */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <span className="text-xs text-gray-300">Lembrete automático antes do horário</span>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-gray-300">Funciona mesmo com o navegador fechado</span>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            {/* CTA principal */}
            <button
              onClick={handleActivate}
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FBE7A1] to-[#D4AF37] text-black font-bold text-sm shadow-lg shadow-[#D4AF37]/30 hover:shadow-[#D4AF37]/30 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Ativar Lembretes
                </>
              )}
            </button>

            {/* Botão secundário */}
            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-2xl text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              Agora não
            </button>
          </div>

          {/* Nota de privacidade */}
          <p className="text-center text-[10px] text-gray-600 mt-4">
            Você pode desativar a qualquer momento nas configurações.
          </p>
        </div>
      </div>
    </>
  )
}
