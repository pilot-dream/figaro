/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging - Service Worker
 * 
 * Este arquivo roda em background no navegador e é responsável por:
 * 1. Receber notificações push mesmo com o app fechado
 * 2. Exibir a notificação nativa do sistema operacional
 * 3. Tratar cliques na notificação para redirecionar o usuário
 * 
 * IMPORTANTE: Este arquivo DEVE ficar em /public para que o navegador
 * consiga registrá-lo no escopo raiz ("/").
 */

// Importa os scripts do Firebase (versão compat para Service Workers)
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js')

// Flag para garantir inicialização única
let isFirebaseInitialized = false

/**
 * Recebe a configuração do Firebase do app principal via postMessage.
 * Isso evita hardcodar credenciais aqui e mantém tudo centralizado.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG' && !isFirebaseInitialized) {
    const config = event.data.config
    
    firebase.initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    })

    isFirebaseInitialized = true
    console.log('[SW] Firebase inicializado com configuração recebida.')

    // Configura o handler de background após inicialização
    const messaging = firebase.messaging()
    
    messaging.onBackgroundMessage((payload) => {
      console.log('[SW] Notificação em background recebida:', payload)

      const notificationTitle = payload.notification?.title || 'Fígaro'
      const notificationOptions = {
        body: payload.notification?.body || 'Você tem uma nova notificação',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: {
          url: payload.data?.url || '/meus-agendamentos',
          appointmentId: payload.data?.appointmentId,
          type: payload.data?.type,
        },
        vibrate: [100, 50, 100],
        tag: payload.data?.type || 'figaro-general',
        requireInteraction: false,
      }

      self.registration.showNotification(notificationTitle, notificationOptions)
    })
  }
})

/**
 * Handler de clique na notificação.
 * Redireciona o usuário para a URL específica contida nos dados.
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event.notification.data)
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/meus-agendamentos'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
