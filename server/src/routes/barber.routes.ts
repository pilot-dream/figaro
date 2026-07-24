import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { AvailabilityService } from '../services/availability.service'

const router = Router()
const prisma = new PrismaClient()
const availabilityService = new AvailabilityService()

// GET /api/barbers/list (Public list of all barbers)
router.get('/list', async (req, res, next) => {
  try {
    const barbers = await prisma.user.findMany({
      where: { role: 'BARBER' },
      select: {
        id: true,
        name: true,
        slug: true,
        avatarUrl: true,
        notes: true,
      },
    })
    res.json(barbers)
  } catch (error) {
    next(error)
  }
})

// GET /api/barbers/:slug (Public barber profile by slug)
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params
    const barber = await prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        avatarUrl: true,
        notes: true,
        phone: true,
        email: true,
      },
    })

    if (!barber) {
      return res.status(404).json({ error: 'Barbeiro não encontrado' })
    }

    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    res.json({ barber, services })
  } catch (error) {
    next(error)
  }
})

// GET /api/barbers/:slug/availability (Public availability slots for specific barber by slug)
router.get('/:slug/availability', async (req, res, next) => {
  try {
    const { slug } = req.params
    const { date, durationMin } = req.query

    if (!date || !durationMin) {
      return res.status(400).json({ error: 'Missing date or durationMin' })
    }

    const barber = await prisma.user.findUnique({
      where: { slug },
    })

    if (!barber) {
      return res.status(404).json({ error: 'Barbeiro não encontrado' })
    }

    const slots = await availabilityService.getAvailability({
      date: String(date),
      barberId: barber.id,
      serviceDurationMin: Number(durationMin),
    })

    res.json(slots)
  } catch (error) {
    next(error)
  }
})

export default router
