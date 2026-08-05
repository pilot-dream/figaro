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

    // A trigger no banco criará o perfil como CLIENT por padrão.
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

    res.status(201).json({ success: true, user: authData.user })
  } catch (error) {
    next(error)
  }
})

export default router
