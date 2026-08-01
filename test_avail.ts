import { AvailabilityService } from './server/src/services/availability.service.ts';

async function run() {
  const service = new AvailabilityService();
  try {
    const slots = await service.getAvailability({
      date: '2026-07-29',
      serviceDurationMin: 30
    });
    console.log(slots.length, 'slots found');
    console.log(slots.slice(0, 2));
  } catch(e) {
    console.error("ERROR:", e);
  }
}
run();
