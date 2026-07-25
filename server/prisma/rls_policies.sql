-- ========================================================
-- FÍGARO — POLÍTICAS RLS BLINDADAS (Segurança por Role)
-- ========================================================
-- Execute este script no SQL Editor do Supabase APÓS o schema base.
-- Ele substitui as policies abertas (USING true) por policies
-- com escopo restrito por role (BARBER, OWNER, CLIENT).
-- ========================================================

-- =====================
-- HELPER: Função para buscar a role do usuário autenticado
-- =====================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;


-- ========================================================
-- APPOINTMENTS — Políticas de Leitura Restritas por Role
-- ========================================================

-- Remover policy aberta anterior
DROP POLICY IF EXISTS "Appointments read" ON public.appointments;

-- OWNER pode ver TODOS os agendamentos da barbearia
DROP POLICY IF EXISTS "Owner can read all appointments" ON public.appointments;
CREATE POLICY "Owner can read all appointments"
  ON public.appointments
  FOR SELECT
  USING (public.get_user_role() = 'OWNER');

-- BARBER só pode ver agendamentos onde ELE é o barbeiro
DROP POLICY IF EXISTS "Barber can read own appointments" ON public.appointments;
CREATE POLICY "Barber can read own appointments"
  ON public.appointments
  FOR SELECT
  USING (
    public.get_user_role() = 'BARBER'
    AND barber_id = auth.uid()
  );

-- CLIENT pode ver apenas os próprios agendamentos
DROP POLICY IF EXISTS "Client can read own appointments" ON public.appointments;
CREATE POLICY "Client can read own appointments"
  ON public.appointments
  FOR SELECT
  USING (
    public.get_user_role() = 'CLIENT'
    AND client_id = auth.uid()
  );

-- Manter INSERT aberto (clientes podem criar agendamentos)
-- (a policy "Appointments insert" existente já permite WITH CHECK (true))

-- UPDATE: Apenas OWNER e BARBER responsável podem alterar status
DROP POLICY IF EXISTS "Appointments update" ON public.appointments;

DROP POLICY IF EXISTS "Owner can update any appointment" ON public.appointments;
CREATE POLICY "Owner can update any appointment"
  ON public.appointments
  FOR UPDATE
  USING (public.get_user_role() = 'OWNER');

DROP POLICY IF EXISTS "Barber can update own appointments" ON public.appointments;
CREATE POLICY "Barber can update own appointments"
  ON public.appointments
  FOR UPDATE
  USING (
    public.get_user_role() = 'BARBER'
    AND barber_id = auth.uid()
  );


-- ========================================================
-- WAITLISTS — Políticas RLS
-- ========================================================
ALTER TABLE public.waitlists ENABLE ROW LEVEL SECURITY;

-- OWNER pode ver toda a lista de espera
DROP POLICY IF EXISTS "Owner can read all waitlists" ON public.waitlists;
CREATE POLICY "Owner can read all waitlists"
  ON public.waitlists
  FOR SELECT
  USING (public.get_user_role() = 'OWNER');

-- BARBER só vê a lista de espera DELE
DROP POLICY IF EXISTS "Barber can read own waitlists" ON public.waitlists;
CREATE POLICY "Barber can read own waitlists"
  ON public.waitlists
  FOR SELECT
  USING (
    public.get_user_role() = 'BARBER'
    AND barber_id = auth.uid()
  );

-- Qualquer pessoa autenticada pode se inscrever na lista
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlists;
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlists
  FOR INSERT
  WITH CHECK (true);


-- ========================================================
-- FINANÇAS (via appointments) — Blindagem Crítica
-- ========================================================
-- A tabela de finanças no Fígaro é derivada de appointments.
-- As policies acima já garantem que:
--
-- ✅ OWNER: Vê TODOS os agendamentos → pode calcular faturamento global
-- ✅ BARBER: Vê apenas SEUS agendamentos → só pode calcular sua comissão
-- ✅ CLIENT: Vê apenas SEUS agendamentos → não vê nada financeiro
--
-- Se no futuro for criada uma tabela `finance` dedicada,
-- as policies devem seguir o mesmo padrão:
--
-- CREATE POLICY "Owner reads all finance"
--   ON public.finance FOR SELECT
--   USING (public.get_user_role() = 'OWNER');
--
-- CREATE POLICY "Barber reads own commission"
--   ON public.finance FOR SELECT
--   USING (
--     public.get_user_role() = 'BARBER'
--     AND barber_id = auth.uid()
--   );
