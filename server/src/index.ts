import express from 'express'
import cors from 'cors'
import { config } from './config/env'
import { AvailabilityService } from './services/availability.service'
import authRoutes from './routes/auth.routes'
import barberRoutes from './routes/barber.routes'

const app = express()
const availabilityService = new AvailabilityService()

app.use(cors())
app.use(express.json())

// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/barbers', barberRoutes)

// Public global availability endpoint
app.get('/api/availability', async (req, res, next) => {
  try {
    const { date, barberId, durationMin } = req.query
    if (!date || !durationMin) {
      return res.status(400).json({ error: 'Missing date or durationMin' })
    }

    const slots = await availabilityService.getAvailability({
      date: String(date),
      barberId: barberId ? String(barberId) : undefined,
      serviceDurationMin: Number(durationMin),
    })

    res.json(slots)
  } catch (error) {
    next(error)
  }
})

// Global Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

const PORT = config.get('PORT')
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
