import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
  const queries = [
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES auth.users(id);`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_name TEXT;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_address TEXT;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'PERCENTAGE';`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_value NUMERIC(10,2) DEFAULT 0;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'FREE';`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS saas_status TEXT DEFAULT 'TRIAL';`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cakto_customer_id TEXT;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cakto_subscription_id TEXT;`
  ];

  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
      console.log('Success:', q);
    } catch (e: any) {
      console.error('Error on query:', q, e.message);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect())
