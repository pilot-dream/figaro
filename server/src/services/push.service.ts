import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getMessaging, Message } from 'firebase-admin/messaging'

/**
 * Singleton de configuração do Firebase Admin
 * Exige as variáveis:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 */
class PushService {
  private initialized = false

  constructor() {
    this.init()
  }

  private init() {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    let privateKey = process.env.FIREBASE_PRIVATE_KEY

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('⚠️ Firebase Admin não inicializado. Faltam variáveis de ambiente (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Push nativo desabilitado.')
      return
    }

    // Vercel às vezes escapa as quebras de linha na env var, precisamos garantir que o formato seja correto
    privateKey = privateKey.replace(/\\n/g, '\n')

    try {
      if (!getApps().length) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })
      }
      this.initialized = true
      console.log('✅ Firebase Admin inicializado com sucesso para Web Push.')
    } catch (error) {
      console.error('❌ Erro ao inicializar Firebase Admin:', error)
    }
  }

  /**
   * Envia uma notificação push para um token FCM
   */
  async sendNotification(token: string, title: string, body: string, url?: string): Promise<boolean> {
    if (!this.initialized) {
      console.warn('Push não enviado: Firebase Admin não configurado.')
      return false
    }

    try {
      const message: Message = {
        token,
        notification: {
          title,
          body,
        },
        webpush: {
          notification: {
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
          },
          // Permite que o Service Worker navegue para a URL ao clicar
          data: url ? { url } : undefined
        }
      }

      await getMessaging().send(message)
      console.log(`[Push] Notificação enviada com sucesso para token: ${token.substring(0, 10)}...`)
      return true
    } catch (error) {
      console.error(`[Push] Erro ao enviar notificação para token ${token.substring(0, 10)}...:`, error)
      return false
    }
  }
}

export const pushService = new PushService()
