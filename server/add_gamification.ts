import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
  const queries = [
    // Create Enums (if Prisma doesn't create them, but since we are executing raw, Postgres enums are better, OR we just use text. In Prisma, enums are mapped to Postgres Enums if supported. Let's create the types in Postgres first to be safe, or just use TEXT if Prisma created it. Wait, Prisma creates proper ENUM types.)
    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CustomerTier') THEN
         CREATE TYPE "CustomerTier" AS ENUM ('NOVATO', 'FIEL', 'VIP', 'NAVALHA_DE_OURO');
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReferralStatus') THEN
         CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'REWARDED');
       END IF;
     END
     $$;`,

    // Add fields to profiles
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date TIMESTAMPTZ;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_visit_at TIMESTAMPTZ;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS visit_count INT DEFAULT 0;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_spent NUMERIC DEFAULT 0;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points_balance INT DEFAULT 0;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier "CustomerTier" DEFAULT 'NOVATO';`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT false;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;`,
    `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES auth.users(id);`,

    // Create GamificationConfig table
    `CREATE TABLE IF NOT EXISTS public.gamification_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      points_per_currency DOUBLE PRECISION DEFAULT 1.0,
      signup_discount_value DOUBLE PRECISION DEFAULT 0,
      referral_reward_value DOUBLE PRECISION DEFAULT 0,
      enable_birthdays BOOLEAN DEFAULT true,
      enable_win_backs BOOLEAN DEFAULT true,
      enable_referrals BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    );`,

    // Create ReferralHistory table
    `CREATE TABLE IF NOT EXISTS public.referral_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      referred_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      status "ReferralStatus" DEFAULT 'PENDING',
      created_at TIMESTAMPTZ DEFAULT now(),
      rewarded_at TIMESTAMPTZ
    );`
  ];

  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
      console.log('Success:', q.substring(0, 50) + '...');
    } catch (e: any) {
      console.error('Error on query:', q.substring(0, 50), e.message);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect())
