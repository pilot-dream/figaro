import { Appointment, User, Service } from '@prisma/client'

// Variáveis de ambiente configuráveis para Evolution API
const WA_API_URL = process.env.WA_API_URL || 'http://localhost:8080'
const WA_API_TOKEN = process.env.WA_API_TOKEN || 'SUA_CHAVE_GLOBAL'

export type AppointmentWithRelations = Appointment & {
  client: User | null
  barber: User | null
  services: { service: Service }[]
}

/**
 * Replaces dynamic variables in the template string with actual appointment data.
 */
function parseTemplate(template: string, appointment: AppointmentWithRelations): string {
  const serviceNames = appointment.services.map(s => s.service.name).join(', ')
  const time = new Date(appointment.startTime).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  })
  
  return template
    .replace(/\{\{client_name\}\}/g, appointment.client?.name || 'Cliente')
    .replace(/\{\{barber_name\}\}/g, appointment.barber?.name || 'sua barbearia')
    .replace(/\{\{services\}\}/g, serviceNames)
    .replace(/\{\{time\}\}/g, time)
}

/**
 * Utilitário de headers padrões para Evolution API
 */
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': WA_API_TOKEN
})

export const whatsappService = {

  // ==========================================
  // GERENCIAMENTO DE INSTÂNCIAS (Multi-Tenancy)
  // ==========================================

  /**
   * Cria uma nova instância na Evolution API para o barbeiro e retorna o QR Code em Base64.
   */
  async createInstance(instanceName: string) {
    try {
      const response = await fetch(`${WA_API_URL}/instance/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          reject_call: true
        })
      })

      const data = await response.json()
      
      // A Evolution API v2 retorna os dados da conexão, e se 'qrcode' foi pedido, a string base64.
      if (data.qrcode && data.qrcode.base64) {
        return { success: true, qrCodeBase64: data.qrcode.base64 }
      }
      
      // Se não retornar qrcode na criação (ex: instância já criada mas desconectada), tenta buscar o QR code direto
      return await this.getQrCode(instanceName)

    } catch (error) {
      console.error(`Erro ao criar instância ${instanceName}:`, error)
      return { success: false, error: 'Erro ao comunicar com Evolution API' }
    }
  },

  /**
   * Pega o QR Code de uma instância existente que está desconectada.
   */
  async getQrCode(instanceName: string) {
    try {
      const response = await fetch(`${WA_API_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: getHeaders()
      })
      const data = await response.json()
      if (data.base64) {
        return { success: true, qrCodeBase64: data.base64 }
      }
      return { success: false, error: 'QR Code não encontrado.' }
    } catch (error) {
      return { success: false, error: 'Falha ao buscar QR Code.' }
    }
  },

  /**
   * Verifica o status da conexão da instância (open, connecting, close).
   */
  async getConnectionState(instanceName: string) {
    try {
      const response = await fetch(`${WA_API_URL}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: getHeaders()
      })
      const data = await response.json()
      // O campo "state" retorna "open" quando conectado com sucesso
      if (data?.instance?.state === 'open') {
        return { connected: true, state: 'CONNECTED' }
      }
      if (data?.instance?.state === 'connecting') {
        return { connected: false, state: 'CONNECTING' }
      }
      return { connected: false, state: 'DISCONNECTED' }
    } catch (error) {
      console.error(`Erro ao checar status de ${instanceName}:`, error)
      return { connected: false, state: 'ERROR' }
    }
  },

  /**
   * Desconecta o WhatsApp e remove a sessão.
   */
  async logoutInstance(instanceName: string) {
    try {
      await fetch(`${WA_API_URL}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      return true
    } catch (error) {
      console.error(`Erro ao desconectar instância ${instanceName}:`, error)
      return false
    }
  },

  // ==========================================
  // ENVIO DE MENSAGENS (Automações)
  // ==========================================

  /**
   * Envia uma mensagem via texto usando a instância específica do barbeiro.
   */
  async sendWhatsAppMessage(instanceName: string, phone: string, text: string) {
    // Normalização (Ex: 5511999999999)
    let normalizedPhone = phone.replace(/\D/g, '')
    if (normalizedPhone.length === 10 || normalizedPhone.length === 11) {
      normalizedPhone = '55' + normalizedPhone
    }
    
    // Se as variáveis de ambiente não foram configuradas de verdade pelo usuário, cair no MOCK:
    if (WA_API_URL === 'http://localhost:8080' || WA_API_TOKEN === 'SUA_CHAVE_GLOBAL') {
      console.log('\n=======================================')
      console.log(`📲 [MOCK] WHATSAPP SENT via ${instanceName}`)
      console.log(`To: ${normalizedPhone}`)
      console.log(`Message:\n${text}`)
      console.log('=======================================\n')
      return true
    }

    try {
      const response = await fetch(`${WA_API_URL}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          number: normalizedPhone,
          options: {
            delay: 1200,
            presence: 'composing'
          },
          textMessage: {
            text: text
          }
        })
      })

      if (!response.ok) {
        console.error('Falha ao enviar mensagem pela Evolution API', await response.text())
        return false
      }
      return true
    } catch (error) {
      console.error('Erro de rede ao enviar mensagem:', error)
      return false
    }
  },

  async sendConfirmationNotice(appointment: AppointmentWithRelations) {
    const instanceName = appointment.barber?.whatsappInstanceId
    if (!appointment.barber?.whatsappEnabled || !appointment.client?.phone || !instanceName) return false

    const template = appointment.barber.whatsappTemplateBase || "Olá {{client_name}}, lembrete do seu agendamento: {{services}} com {{barber_name}} às {{time}}."
    const text = `✅ *AGENDAMENTO CONFIRMADO!*\n\n${parseTemplate(template, appointment)}\n\nAgradecemos a preferência!`
    
    return await this.sendWhatsAppMessage(instanceName, appointment.client?.phone, text)
  },

  async send24hReminder(appointment: AppointmentWithRelations) {
    const instanceName = appointment.barber?.whatsappInstanceId
    if (!appointment.barber?.whatsappEnabled || !appointment.barber?.whatsappReminder24h || !appointment.client?.phone || !instanceName) return false
    
    const template = appointment.barber.whatsappTemplateBase || "Olá {{client_name}}, lembrete do seu agendamento: {{services}} com {{barber_name}} às {{time}}."
    const text = `⏳ *LEMBRETE (Falta 1 Dia)*\n\n${parseTemplate(template, appointment)}\n\nNos vemos amanhã!`
    
    return await this.sendWhatsAppMessage(instanceName, appointment.client?.phone, text)
  },

  async send2hReminder(appointment: AppointmentWithRelations) {
    const instanceName = appointment.barber?.whatsappInstanceId
    if (!appointment.barber?.whatsappEnabled || !appointment.barber?.whatsappReminder2h || !appointment.client?.phone || !instanceName) return false
    
    const template = appointment.barber.whatsappTemplateBase || "Olá {{client_name}}, lembrete do seu agendamento: {{services}} com {{barber_name}} às {{time}}."
    const text = `⏰ *LEMBRETE FINAL*\n\n${parseTemplate(template, appointment)}\n\nEstamos te esperando em breve! Se precisar remarcar ou cancelar, entre em contato imediatamente.`
    
    return await this.sendWhatsAppMessage(instanceName, appointment.client?.phone, text)
  }
}
