const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const barber = await prisma.user.findFirst({ where: { slug: 'filipe-lacerda-1' } })
  console.log('googleSyncBusyTimes:', barber.googleSyncBusyTimes, barber.googleRefreshToken ? 'Has token' : 'No token')
}

main().catch(console.error).finally(() => prisma.$disconnect())
