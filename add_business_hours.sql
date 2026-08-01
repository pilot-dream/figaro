-- Rode este script no SQL Editor do seu projeto Supabase
-- para adicionar os campos de Horário de Funcionamento (Agenda Real).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS business_hours JSONB,
ADD COLUMN IF NOT EXISTS slot_interval INTEGER DEFAULT 15;
