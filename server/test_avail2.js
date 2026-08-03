const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const barber = await prisma.user.findFirst({ where: { slug: 'filipe-lacerda-1' } })
  
  const recSlots = await prisma.recurringSlot.findMany({ where: { barberId: barber.id } })
  console.log('Recurring Slots:', recSlots)
}

main().catch(console.error).finally(() => prisma.$disconnect())
