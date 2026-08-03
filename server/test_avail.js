const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const barber = await prisma.user.findFirst({ where: { slug: 'filipe-lacerda-1' } })
  if (!barber) {
    console.log('Barber not found')
    return
  }
  console.log('Barber ID:', barber.id)
  
  // Find blocked times
  const blocked = await prisma.blockedTime.findMany({ where: { barberId: barber.id } })
  console.log('Blocked times:', blocked)
  
  // Find appointments
  const apps = await prisma.appointment.findMany({ where: { barberId: barber.id } })
  console.log('Appointments:', apps.map(a => a.startTime))
}

main().catch(console.error).finally(() => prisma.$disconnect())
