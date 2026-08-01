import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient({ log: ['query', 'error'] })
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  console.log('Testing registration...');
  const email = `test-${Date.now()}@test.com`;
  
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
    user_metadata: { name: 'Test User', phone: '123' }
  })

  if (authError) {
    console.error('Supabase Auth Error:', authError)
    return
  }

  console.log('Created in Supabase:', authData.user?.id);

  try {
    const updated = await prisma.user.update({
      where: { id: authData.user?.id },
      data: { role: 'CLIENT' }
    })
    console.log('Prisma Update Success:', updated);
  } catch (error: any) {
    console.error('Prisma Update Error:', error.message);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect())
