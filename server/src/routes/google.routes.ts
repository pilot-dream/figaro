import { Router } from 'express'
import { googleCalendarService } from '../services/googleCalendar.service'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

const router = Router()
const prisma = new PrismaClient()
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// GET /api/google/auth-url
// Returns the Google OAuth consent screen URL
router.get('/auth-url', (req, res) => {
  const userId = req.query.userId as string
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  // Pass the user ID as state so we know who authorized
  const url = googleCalendarService.getAuthUrl(userId)
  res.json({ url })
})

// GET /api/google/callback
// Handles the redirect from Google OAuth
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query

  if (error) {
    return res.status(400).send(`Authentication failed: ${error}`)
  }

  if (!code || !state) {
    return res.status(400).send('Missing code or state')
  }

  try {
    const userId = state as string
    const tokens = await googleCalendarService.getTokens(code as string)
    
    // Create temporary oauth2 client to fetch user email
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' })
    const userInfo = await oauth2.userinfo.get()

    // We MUST have a refresh token (requires access_type: 'offline' and prompt: 'consent')
    if (tokens.refresh_token) {
      // Redirect back to frontend settings with the tokens so the authenticated frontend can save them (bypassing RLS issues)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174'
      const redirectUrl = `${frontendUrl}/painel?google_sync=success&refresh_token=${encodeURIComponent(tokens.refresh_token)}&email=${encodeURIComponent(userInfo.data.email || '')}`
      res.redirect(redirectUrl)
    } else {
      // If user already granted access, google might not send a refresh token.
      // Need to revoke and try again or use the existing one if it's already in DB.
      // For simplicity, we just say we need a refresh token.
      res.status(400).send('No refresh token received. Please try revoking access from your Google Account and connecting again.')
    }
  } catch (err) {
    console.error('Error in Google OAuth callback:', err)
    res.status(500).send('Internal Server Error during Google Auth')
  }
})

// POST /api/google/disconnect
router.post('/disconnect', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  try {
    await supabase.from('profiles').update({
      google_refresh_token: null,
      google_email: null,
      google_sync_enabled: false,
      google_sync_busy_times: false,
    }).eq('id', userId)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect Google Calendar' })
  }
})

// PATCH /api/google/settings
router.patch('/settings', async (req, res) => {
  const { userId, syncEnabled, syncBusyTimes } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .update({
        ...(syncEnabled !== undefined && { google_sync_enabled: syncEnabled }),
        ...(syncBusyTimes !== undefined && { google_sync_busy_times: syncBusyTimes }),
      })
      .eq('id', userId)
      .select('google_sync_enabled, google_sync_busy_times')
      .single()

    if (error) throw error

    res.json({
      googleSyncEnabled: user.google_sync_enabled,
      googleSyncBusyTimes: user.google_sync_busy_times,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update Google settings' })
  }
})

// POST /api/google/sync-event
router.post('/sync-event', async (req, res) => {
  const { barberId, appointmentId, summary, description, startTime, endTime, clientEmail } = req.body
  try {
    const { data: barber } = await supabase
      .from('profiles')
      .select('google_refresh_token, google_sync_enabled')
      .eq('id', barberId)
      .single()

    if (!barber?.google_sync_enabled || !barber.google_refresh_token) {
      return res.json({ success: true, message: 'Google Sync not enabled' })
    }

    const eventId = await googleCalendarService.createCalendarEvent(barber.google_refresh_token, {
      summary,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      clientEmail
    })

    if (eventId && appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { googleEventId: eventId }
      })
    }

    res.json({ success: true, eventId })
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync event to Google Calendar' })
  }
})

// POST /api/google/cancel-event
router.post('/cancel-event', async (req, res) => {
  const { barberId, eventId } = req.body
  if (!eventId) return res.json({ success: true })
  
  try {
    const { data: barber } = await supabase
      .from('profiles')
      .select('google_refresh_token, google_sync_enabled')
      .eq('id', barberId)
      .single()

    if (!barber?.google_sync_enabled || !barber.google_refresh_token) {
      return res.json({ success: true, message: 'Google Sync not enabled' })
    }

    await googleCalendarService.cancelCalendarEvent(barber.google_refresh_token, eventId)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel event' })
  }
})

export default router
