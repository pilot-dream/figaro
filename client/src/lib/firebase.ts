/**
 * Firebase Cloud Messaging - Utilitário Frontend
 * 
 * Responsabilidades:
 * 1. Inicializar o Firebase App (singleton)
 * 2. Registrar o Service Worker do FCM
 * 3. Pedir permissão de notificação ao usuário
 * 4. Gerar e retornar o FCM Token
 * 
 * O token gerado é um identificador único do dispositivo/navegador
 * que o servidor usa para enviar push notifications direcionadas.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'

// ============================================================
// CONFIGURAÇÃO
// ============================================================
// Todas as chaves abaixo são PUBLIC (client-side safe).
// A segurança está nas Firebase Security Rules + server-side.
// Lidas de variáveis de ambiente para não hardcodar.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

// VAPID Key (Voluntary Application Server Identification)
// Chave pública gerada no Console Firebase > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || ''

// ============================================================
// SINGLETON
// ============================================================
let firebaseApp: FirebaseApp | null = null
let messagingInstance: Messaging | null = null

function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig)
  }
  return firebaseApp
}

function getMessagingInstance(): Messaging | null {
  // FCM só funciona em navegadores que suportam Service Workers
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[Firebase] Service Workers não suportados neste navegador.')
    return null
  }

  if (!messagingInstance) {
    const app = getFirebaseApp()
    messagingInstance = getMessaging(app)
  }
  return messagingInstance
}

// ============================================================
// REGISTRO DO SERVICE WORKER
// ============================================================
/**
 * Registra o Service Worker do FCM e injeta a config do Firebase nele.
 * O SW precisa da config para inicializar o Firebase em seu próprio contexto.
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Firebase] Service Workers não suportados.')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/' }
    )

    // Espera o SW ficar ativo antes de enviar a config
    await navigator.serviceWorker.ready

    // Injeta a configuração do Firebase no Service Worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig,
      })
    }

    console.log('[Firebase] Service Worker registrado com sucesso.')
    return registration
  } catch (error) {
    console.error('[Firebase] Falha ao registrar Service Worker:', error)
    return null
  }
}

// ============================================================
// PERMISSÃO + TOKEN
// ============================================================

/** Chave para persistir no localStorage que o prompt já foi mostrado */
const PUSH_PROMPT_DISMISSED_KEY = 'figaro_push_prompt_dismissed'
const PUSH_TOKEN_KEY = 'figaro_push_token'

/**
 * Verifica se o usuário já negou/dispensou o prompt anteriormente
 */
export function wasPushPromptDismissed(): boolean {
  return localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY) === 'true'
}

/**
 * Marca que o usuário dispensou o prompt (clicou "Agora não")
 */
export function dismissPushPrompt(): void {
  localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, 'true')
}

/**
 * Verifica se as notificações push são suportadas no navegador atual
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Verifica se já temos um token salvo localmente
 */
export function getSavedPushToken(): string | null {
  return localStorage.getItem(PUSH_TOKEN_KEY)
}

/**
 * Fluxo principal: pede permissão ao navegador e gera o FCM Token.
 * 
 * @returns O FCM Token (string) ou null se negado/erro
 * 
 * IMPORTANTE: Esta função DEVE ser chamada a partir de um evento
 * de interação do usuário (click handler), caso contrário o navegador
 * bloqueará o prompt de permissão.
 */
export async function requestPushPermission(): Promise<string | null> {
  if (!isPushSupported()) {
    console.warn('[Firebase] Push notifications não suportadas neste navegador.')
    return null
  }

  try {
    // 1. Pede permissão nativa do navegador
    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      console.log('[Firebase] Permissão de notificação negada pelo usuário.')
      return null
    }

    // 2. Registra o Service Worker
    const swRegistration = await registerServiceWorker()
    if (!swRegistration) {
      console.error('[Firebase] Não foi possível registrar o Service Worker.')
      return null
    }

    // 3. Obtém o FCM Token
    const messaging = getMessagingInstance()
    if (!messaging) {
      return null
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    })

    if (token) {
      console.log('[Firebase] FCM Token gerado com sucesso:', token.substring(0, 20) + '...')
      localStorage.setItem(PUSH_TOKEN_KEY, token)
      return token
    }

    console.warn('[Firebase] Nenhum token retornado pelo FCM.')
    return null
  } catch (error) {
    console.error('[Firebase] Erro ao solicitar permissão de push:', error)
    return null
  }
}

// ============================================================
// LISTENER DE MENSAGENS EM FOREGROUND
// ============================================================
/**
 * Configura o listener para notificações recebidas enquanto o app está aberto.
 * Diferente do background (tratado pelo SW), aqui o app pode exibir um toast
 * ou atualizar a UI em tempo real.
 * 
 * @param callback Função chamada com o payload da notificação
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  const messaging = getMessagingInstance()
  if (!messaging) return null

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('[Firebase] Mensagem em foreground:', payload)
    callback(payload)
  })

  return unsubscribe
}

export { firebaseConfig }
