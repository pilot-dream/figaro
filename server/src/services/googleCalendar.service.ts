import { google } from 'googleapis'
import { config } from '../config/env'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
  process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
)

// Configure Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

export class GoogleCalendarService {
  /**
   * Return the URL for user to grant permission
   */
  getAuthUrl(state: string) {
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      state, // pass user ID or context via state
    })
  }

  /**
   * Exchange code for tokens
   */
  async getTokens(code: string) {
    const { tokens } = await oauth2Client.getToken(code)
    return tokens
  }

  /**
   * Setup OAuth client with user's refresh token
   */
  private getClient(refreshToken: string) {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
    )
    client.setCredentials({ refresh_token: refreshToken })
    return client
  }

  /**
   * Fetch busy slots for a specific date
   */
  async getBusySlots(refreshToken: string, date: string) {
    if (!refreshToken) return []

    const client = this.getClient(refreshToken)
    const calendar = google.calendar({ version: 'v3', auth: client })

    const timeMin = new Date(`${date}T00:00:00.000Z`)
    const timeMax = new Date(`${date}T23:59:59.999Z`)

    try {
      const res = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: 'primary' }],
        },
      })

      const calendars = res.data.calendars
      if (calendars && calendars.primary && calendars.primary.busy) {
        return calendars.primary.busy
      }
      return []
    } catch (err) {
      console.error('Error fetching busy slots from Google Calendar:', err)
      return []
    }
  }

  /**
   * Create an event in Google Calendar
   */
  async createCalendarEvent(refreshToken: string, eventDetails: {
    summary: string,
    description: string,
    startTime: Date,
    endTime: Date,
    clientEmail?: string
  }) {
    if (!refreshToken) return null

    const client = this.getClient(refreshToken)
    const calendar = google.calendar({ version: 'v3', auth: client })

    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: eventDetails.endTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      attendees: eventDetails.clientEmail ? [{ email: eventDetails.clientEmail }] : [],
    }

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      })
      return response.data.id
    } catch (err) {
      console.error('Error creating Google Calendar event:', err)
      return null
    }
  }

  /**
   * Cancel / Delete an event
   */
  async cancelCalendarEvent(refreshToken: string, eventId: string) {
    if (!refreshToken || !eventId) return false

    const client = this.getClient(refreshToken)
    const calendar = google.calendar({ version: 'v3', auth: client })

    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      })
      return true
    } catch (err) {
      console.error('Error canceling Google Calendar event:', err)
      return false
    }
  }
}

export const googleCalendarService = new GoogleCalendarService()
