import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Figaro Barbershop database with slugs and passwords...')

  // Clear existing data
  await prisma.appointmentService.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.blockedTime.deleteMany()
  await prisma.user.deleteMany()

  const defaultPasswordHash = await bcrypt.hash('123456', 10)

  // Seed Barbers with Slugs
  const barber1 = await prisma.user.create({
    data: {
      name: 'Henrique Navalha',
      slug: 'henrique-navalha',
      email: 'henrique@figaro.com',
      phone: '(11) 98765-4321',
      passwordHash: defaultPasswordHash,
      role: 'BARBER',
      notes: 'Especialista em Degradê Navalhado e Fade Americano',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80',
    },
  })

  await prisma.user.create({
    data: {
      name: 'Mateus Figaro',
      slug: 'mateus-figaro',
      email: 'mateus@figaro.com',
      phone: '(11) 97777-1234',
      passwordHash: defaultPasswordHash,
      role: 'BARBER',
      notes: 'Mestre em Barba Terapia e Alinhamento Clássico',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    },
  })

  await prisma.user.create({
    data: {
      name: 'Lucas Visagista',
      slug: 'lucas-visagista',
      email: 'lucas@figaro.com',
      phone: '(11) 96666-5555',
      passwordHash: defaultPasswordHash,
      role: 'BARBER',
      notes: 'Consultor de Visagismo Masculino e Cortes Tesoura',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    },
  })

  // Seed Services
  await prisma.service.create({
    data: {
      name: 'Corte Figaro Signature',
      description: 'Corte tesoura/máquina com lavagem especial, finalização e massagem capilar.',
      durationMin: 45,
      price: 75.0,
      sortOrder: 1,
    },
  })

  await prisma.service.create({
    data: {
      name: 'Barba Terapia com Toalha Quente',
      description: 'Modelagem de barba com óleo essencial, toalha aquecida e massagem facial.',
      durationMin: 30,
      price: 55.0,
      sortOrder: 2,
    },
  })

  const srv3 = await prisma.service.create({
    data: {
      name: 'Combo Imperial (Corte + Barba)',
      description: 'Experiência completa de corte e barba com alinhamento de sobrancelha cortesia.',
      durationMin: 70,
      price: 115.0,
      sortOrder: 3,
    },
  })

  // Seed Client
  const client1 = await prisma.user.create({
    data: {
      name: 'Carlos Oliveira',
      email: 'carlos@cliente.com',
      phone: '(11) 99999-8888',
      passwordHash: defaultPasswordHash,
      role: 'CLIENT',
    },
  })

  // Seed Appointment
  const today = new Date()
  today.setHours(10, 0, 0, 0)
  const endTime = new Date(today.getTime() + 70 * 60000)

  const appointment = await prisma.appointment.create({
    data: {
      clientId: client1.id,
      barberId: barber1.id,
      startTime: today,
      endTime: endTime,
      totalPrice: 115.0,
      status: 'CONFIRMED',
      clientNotes: 'Cliente VIP • Café sem açúcar',
    },
  })

  await prisma.appointmentService.create({
    data: {
      appointmentId: appointment.id,
      serviceId: srv3.id,
    },
  })

  console.log('Seeding completed successfully!')
  console.log('--- CREDENCIAIS DE TESTE (Senha: 123456) ---')
  console.log('Barbeiro: henrique@figaro.com (Slug: /henrique-navalha)')
  console.log('Cliente:  carlos@cliente.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
