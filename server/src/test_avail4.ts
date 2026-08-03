import { AvailabilityService } from './services/availability.service'

async function main() {
  const service = new AvailabilityService()
  const slots = await service.getAvailability({
    date: '2026-07-28',
    barberId: '7e3e3a08-e0d7-48e7-aca4-f816273e7f46',
    serviceDurationMin: 15
  })
  console.log('UNAVAILABLE SLOTS:')
  slots.filter(s => !s.available).forEach(s => {
    console.log(s.startTime.toISOString())
  })
}

main().catch(console.error)
