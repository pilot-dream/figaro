-- ========================================================
-- OTIMIZAÇÃO DE PERFORMANCE: ÍNDICE PARA BUSCA DE AGENDAMENTOS
-- ========================================================
-- Como a tabela 'appointments' é a mais acessada e frequentemente filtrada por 
-- 'barber_id' e 'start_time' (ao renderizar a agenda do dia), a criação deste 
-- índice composto reduzirá o tempo de busca de O(N) para O(log N).

CREATE INDEX IF NOT EXISTS "appointments_barberId_startTime_idx" 
ON "public"."appointments" ("barber_id", "start_time");

-- Observação: Esse índice já foi refletido no schema.prisma via instrução:
-- @@index([barberId, startTime])
