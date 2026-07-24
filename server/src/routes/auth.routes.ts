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

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, phone, avatarUrl } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone: phone || undefined }] },
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email ou telefone já cadastrado' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const userRole = role === 'BARBER' ? 'BARBER' : 'CLIENT'
    let slug: string | undefined = undefined

    if (userRole === 'BARBER') {
      let baseSlug = slugify(name)
      let candidateSlug = baseSlug
      let counter = 1
      while (await prisma.user.findUnique({ where: { slug: candidateSlug } })) {
        candidateSlug = `${baseSlug}-${counter}`
        counter++
      }
      slug = candidateSlug
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: userRole,
        slug,
        avatarUrl: avatarUrl || (userRole === 'BARBER' ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80' : undefined),
      },
    })

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, slug: user.slug },
      config.get('JWT_SECRET'),
      { expiresIn: '7d' }
    )

    const { passwordHash: _, ...userWithoutPassword } = user
    res.status(201).json({ token, user: userWithoutPassword })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, slug: user.slug },
      config.get('JWT_SECRET'),
      { expiresIn: '7d' }
    )

    const { passwordHash: _, ...userWithoutPassword } = user
    res.json({ token, user: userWithoutPassword })
  } catch (error) {
    next(error)
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const { passwordHash: _, ...userWithoutPassword } = user
    res.json(userWithoutPassword)
  } catch (error) {
    next(error)
  }
})

export default router
