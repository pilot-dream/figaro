import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { whatsappService } from '../services/whatsapp.service'

const router = Router()

router.post('/confirm', async (req, res) => {
  const { appointmentId } = req.body

  if (!appointmentId) {
    return res.status(400).json({ error: 'Missing appointmentId' })
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        barber: true,
        services: { include: { service: true } }
      }
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    if (appointment.wpConfirmationSent) {
      return res.json({ success: true, message: 'Already sent' })
    }

    const success = await whatsappService.sendConfirmationNotice(appointment)
    
    if (success) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { wpConfirmationSent: true }
      })
    }

    res.json({ success })
  } catch (error) {
    console.error('Error sending WhatsApp confirmation:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// ==========================================
// ENDPOINTS PARA O FRONTEND (Multi-Tenancy)
// ==========================================

router.post('/instance/create', async (req, res) => {
  const { barberId } = req.body
  if (!barberId) return res.status(400).json({ error: 'Missing barberId' })
  
  const instanceName = `figaro_${barberId.replace(/-/g, '')}` // Evolution API aceita alfanumerico

  const result = await whatsappService.createInstance(instanceName)
  if (result.success) {
    res.json({ instanceName, qrCodeBase64: result.qrCodeBase64 })
  } else {
    res.status(500).json({ error: (result as any).error })
  }
})

router.get('/instance/status/:instanceName', async (req, res) => {
  const { instanceName } = req.params
  const result = await whatsappService.getConnectionState(instanceName)
  res.json(result)
})

router.delete('/instance/logout/:instanceName', async (req, res) => {
  const { instanceName } = req.params
  const success = await whatsappService.logoutInstance(instanceName)
  res.json({ success })
})

export default router
