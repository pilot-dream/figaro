/**
 * Rotas de Usuário - Push Token
 * 
 * Endpoint para salvar/atualizar o FCM Push Token no perfil do cliente.
 * Um usuário pode ter múltiplos tokens (dispositivos diferentes),
 * mas por simplicidade v1 salvamos apenas o último token ativo.
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

/**
 * POST /api/users/push-token
 * 
 * Body: { userId: string, token: string, platform?: string }
 * 
 * Salva o FCM token no campo push_token do usuário.
 * Se o usuário já tinha um token, ele é substituído pelo novo.
 */
router.post('/push-token', async (req, res, next) => {
  try {
    const { userId, token, platform } = req.body

    if (!userId || !token) {
      return res.status(400).json({ error: 'userId e token são obrigatórios' })
    }

    // Verifica se o usuário existe
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    // Atualiza o token de push no perfil
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushToken: token,
        pushPlatform: platform || 'web',
        pushTokenUpdatedAt: new Date(),
      },
    })

    console.log(`[Push] Token salvo para usuário ${userId} (${platform || 'web'})`)
    res.json({ success: true })
  } catch (error) {
    console.error('[Push] Erro ao salvar token:', error)
    next(error)
  }
})

export default router
