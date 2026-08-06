import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { config } from '../config/env'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'
import { authLimiter } from '../middleware/security.middleware'

const router = Router()
const prisma = new PrismaClient()

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

import { supabaseAdmin } from '../lib/supabaseAdmin'

// POST /api/auth/register (Força CLIENT)
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
    }

    // 1. Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone }
    })

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Erro ao criar usuário' })
    }

    // Usamos upsert para evitar race condition com a trigger do banco (ou caso a trigger não exista)
    await prisma.user.upsert({
      where: { id: authData.user.id },
      update: { role: 'CLIENT', name, phone: phone || null },
      create: { 
        id: authData.user.id,
        name,
        phone: phone || null,
        role: 'CLIENT' 
      }
    })

    try {
      // Vincula agendamentos
      if (phone) {
        await prisma.appointment.updateMany({
          where: { clientPhone: phone, clientId: null },
          data: { clientId: authData.user.id }
        })
      }
    } catch (updateError) {
      console.error('CRITICAL ERROR IN REGISTER CLIENT:', updateError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ error: 'Erro ao configurar a conta. Por favor, tente novamente.' })
    }

    res.status(201).json({ success: true, user: authData.user })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/register-owner (Força OWNER)
router.post('/register-owner', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
    }

    // 1. Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, role: 'OWNER' } // Passamos a meta-data, a trigger ignora, mas nós corrigimos embaixo
    })

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Erro ao criar conta de barbearia' })
    }

    // 2. Gerar slug único para o dono/barbearia
    let baseSlug = slugify(name)
    let candidateSlug = baseSlug
    let counter = 1
    while (await prisma.user.findUnique({ where: { slug: candidateSlug } })) {
      candidateSlug = `${baseSlug}-${counter}`
      counter++
    }

    // 3. Força a role OWNER, salva o slug e inicia 7 dias de TRIAL
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    try {
      await prisma.user.upsert({
        where: { id: authData.user.id },
        update: { 
          role: 'OWNER',
          slug: candidateSlug,
          saasStatus: 'TRIAL',
          trialEndsAt: trialEnd,
          name,
          phone: phone || null
        },
        create: {
          id: authData.user.id,
          name,
          phone: phone || null,
          role: 'OWNER',
          slug: candidateSlug,
          saasStatus: 'TRIAL',
          trialEndsAt: trialEnd
        }
      })
    } catch (upsertError) {
      console.error('CRITICAL UPSERT ERROR IN REGISTER-OWNER:', upsertError)
      // Rollback: deleta o usuário criado no Auth para não deixar a conta presa como CLIENT
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ error: 'Erro ao configurar a conta da barbearia. Por favor, tente novamente.' })
    }

    try {
      // Vincula agendamentos órfãos (feitos antes de criar conta) a este dono
      if (phone) {
        await prisma.appointment.updateMany({
          where: { clientPhone: phone, clientId: null },
          data: { clientId: authData.user.id }
        })
      }
    } catch (updateError) {
      console.error('CRITICAL APPOINTMENT UPDATE ERROR IN REGISTER-OWNER:', updateError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ error: 'Erro ao vincular agendamentos. Por favor, tente novamente.' })
    }

    res.status(201).json({ success: true, user: authData.user })
  } catch (error) {
    next(error)
  }
})

export default router
