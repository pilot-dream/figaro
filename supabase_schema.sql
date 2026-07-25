-- ========================================================
-- FÍGARO / ORKA — SUPABASE COMPLETE DATABASE SCHEMA & RLS
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/pwrwustjaghywdzghkbh/sql
-- ========================================================

-- 1. Profiles Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('CLIENT', 'BARBER', 'MANAGER', 'OWNER')),
  avatar_url TEXT,
  notes TEXT,
  google_refresh_token TEXT,
  google_email TEXT,
  google_sync_enabled BOOLEAN DEFAULT false,
  google_sync_busy_times BOOLEAN DEFAULT false,
  whatsapp_instance_id TEXT,
  whatsapp_status TEXT DEFAULT 'DISCONNECTED',
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_reminder_24h BOOLEAN DEFAULT false,
  whatsapp_reminder_2h BOOLEAN DEFAULT false,
  whatsapp_template_base TEXT DEFAULT 'Olá {{client_name}}, lembrete do seu agendamento: {{services}} com {{barber_name}} às {{time}}.',
  specialty TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Services Table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_min INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- 3. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  barber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  client_name TEXT,
  client_phone TEXT,
  client_notes TEXT,
  google_event_id TEXT,
  wp_confirmation_sent BOOLEAN DEFAULT false,
  wp_reminder_24h_sent BOOLEAN DEFAULT false,
  wp_reminder_2h_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Appointment Services (Join Table)
CREATE TABLE IF NOT EXISTS public.appointment_services (
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  PRIMARY KEY (appointment_id, service_id)
);

-- 5. Blocked Times Table
CREATE TABLE IF NOT EXISTS public.blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Services Policies
DROP POLICY IF EXISTS "Services read" ON public.services;
CREATE POLICY "Services read" ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Services insert" ON public.services;
CREATE POLICY "Services insert" ON public.services FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Services update" ON public.services;
CREATE POLICY "Services update" ON public.services FOR UPDATE USING (true);

-- Appointments Policies
DROP POLICY IF EXISTS "Appointments read" ON public.appointments;
CREATE POLICY "Appointments read" ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Appointments insert" ON public.appointments;
CREATE POLICY "Appointments insert" ON public.appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Appointments update" ON public.appointments;
CREATE POLICY "Appointments update" ON public.appointments FOR UPDATE USING (true);

-- Appointment Services Policies
DROP POLICY IF EXISTS "Appointment services read" ON public.appointment_services;
CREATE POLICY "Appointment services read" ON public.appointment_services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Appointment services insert" ON public.appointment_services;
CREATE POLICY "Appointment services insert" ON public.appointment_services FOR INSERT WITH CHECK (true);

-- Blocked Times Policies
DROP POLICY IF EXISTS "Blocked times read" ON public.blocked_times;
CREATE POLICY "Blocked times read" ON public.blocked_times FOR SELECT USING (true);

DROP POLICY IF EXISTS "Blocked times insert" ON public.blocked_times;
CREATE POLICY "Blocked times insert" ON public.blocked_times FOR INSERT WITH CHECK (true);

-- ========================================================
-- AUTO-PROFILE TRIGGER ON SIGNUP
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, slug, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CLIENT'),
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'BARBER'
      THEN LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', 'barbeiro'), '[^a-zA-Z0-9]+', '-', 'g'))
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    slug = EXCLUDED.slug,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Realtime for Appointments Table
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
