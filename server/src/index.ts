import express from 'express'
import cors from 'cors'
import { config } from './config/env'
import { AvailabilityService } from './services/availability.service'
import authRoutes from './routes/auth.routes'
import barberRoutes from './routes/barber.routes'
import teamRoutes from './routes/team.routes'
import googleRoutes from './routes/google.routes'
import financeRoutes from './routes/finance.routes'
import appointmentsRoutes from './routes/appointments.routes'
import mrrRoutes from './routes/mrr.routes'
import dashboardRoutes from './routes/dashboard.routes'
import gamificationRoutes from './routes/gamification.routes'
import usersRoutes from './routes/users.routes'
import { securityHeaders, globalLimiter } from './middleware/security.middleware'
import { handleCaktoWebhook } from './controllers/saas.webhook.controller'
import { processReminders } from './cron/reminder.cron'
import { processWinbacks } from './cron/winback.cron'
import { processBirthdays } from './cron/birthday.cron'
import { processSummaries } from './cron/summary.cron'
import { processAutoCompletes } from './cron/autocomplete.cron'
import { startCronJobs } from './cron/scheduler'

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
app.use('/api/team', teamRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/mrr', mrrRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/gamification', gamificationRoutes)
app.use('/api/users', usersRoutes)

// Webhooks
app.post('/api/webhooks/cakto', handleCaktoWebhook)

app.get('/api/cron/reminders', async (req, res) => {
  try {
    console.log('[Vercel Cron] Iniciando processamento de lembretes e auto-completes...')
    await processReminders()
    await processAutoCompletes()
    res.json({ success: true, message: 'Reminders and auto-completes processed' })
  } catch (error) {
    console.error('[Vercel Cron] Erro:', error)
    res.status(500).json({ error: 'Failed to process reminders and auto-completes' })
  }
})

app.get('/api/cron/daily-actions', async (req, res) => {
  try {
    await processWinbacks()
    await processBirthdays()
    res.json({ success: true, message: 'Daily actions processed successfully' })
  } catch (error) {
    console.error('Cron error:', error)
    res.status(500).json({ success: false, error: 'Failed to process daily actions' })
  }
})

app.get('/api/cron/summaries', async (req, res) => {
  try {
    await processSummaries()
    res.json({ success: true, message: 'Summaries processed successfully' })
  } catch (error) {
    console.error('Cron error:', error)
    res.status(500).json({ success: false, error: 'Failed to process summaries' })
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
    console.error('AVAILABILITY ERROR:', error)
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

const PORT = config.get('PORT') || 3001

// Inicializar Cron Jobs apenas se não estiver no Vercel/Serverless
if (process.env.NODE_ENV !== 'production' || process.env.RUN_LOCAL === 'true') {
  startCronJobs()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = app
