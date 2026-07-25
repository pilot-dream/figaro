import express from 'express'
import cors from 'cors'
import { config } from './config/env'
import { AvailabilityService } from './services/availability.service'
import authRoutes from './routes/auth.routes'
import barberRoutes from './routes/barber.routes'
import teamRoutes from './routes/team.routes'
import googleRoutes from './routes/google.routes'
import whatsappRoutes from './routes/whatsapp.routes'
import financeRoutes from './routes/finance.routes'
import appointmentsRoutes from './routes/appointments.routes'
import mrrRoutes from './routes/mrr.routes'
import { securityHeaders, globalLimiter } from './middleware/security.middleware'
import { startReminderCron, processReminders } from './cron/reminder.cron'

const app = express()
const availabilityService = new AvailabilityService()

// 1. Helmet Security Headers
app.use(securityHeaders)

// 2. Restrição de CORS (Liberado para dev)
app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200
}))

app.use(express.json())

// 3. Limite global de Rate Limiting para /api/*
app.use('/api', globalLimiter)

// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/google', googleRoutes)
app.use('/api/barbers', barberRoutes)
app.use('/api/whatsapp', whatsappRoutes)
app.use('/api/team', teamRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/mrr', mrrRoutes)

// Cron execution endpoint for Vercel Serverless
app.get('/api/cron/reminders', async (req, res) => {
  try {
    await processReminders()
    res.json({ success: true, message: 'Reminders processed successfully' })
  } catch (error) {
    console.error('Cron error:', error)
    res.status(500).json({ success: false, error: 'Failed to process reminders' })
  }
})


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
  console.error('Erro detectado:', err)
  
  const status = err.status || 500;
  
  // 5. Tratamento de Erros e Sanitização: Não expor detalhes de banco ou stack trace
  const safeMessage = status === 500 
    ? 'Ocorreu um erro interno no servidor.' 
    : (err.message || 'Erro inesperado');
    
  res.status(status).json({ error: safeMessage })
})

const PORT = config.get('PORT')

// Inicializar Cron Jobs
startReminderCron()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
