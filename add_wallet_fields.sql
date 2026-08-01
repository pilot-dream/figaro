-- Rode este script no SQL Editor do seu projeto Supabase
-- para adicionar os campos de Gamificação (Pontos e Tiers VIP).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'BRONZE' CHECK (tier IN ('BRONZE', 'SILVER', 'GOLD', 'BLACK'));
