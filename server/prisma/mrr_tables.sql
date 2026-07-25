-- ========================================================
-- TABELAS DO CLUBE DE ASSINATURA (MRR) E TRAVA DE HORÁRIOS
-- ========================================================

CREATE TABLE "public"."subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "cuts_per_period" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."customer_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "gateway_subscription_id" TEXT,
    "next_billing_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."recurring_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "barber_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_slots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."slot_exceptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recurring_slot_id" UUID NOT NULL,
    "original_date" TEXT NOT NULL,
    "new_date" TEXT,
    "new_time" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RESCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slot_exceptions_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "public"."customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."recurring_slots" ADD CONSTRAINT "recurring_slots_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."recurring_slots" ADD CONSTRAINT "recurring_slots_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."slot_exceptions" ADD CONSTRAINT "slot_exceptions_recurring_slot_id_fkey" FOREIGN KEY ("recurring_slot_id") REFERENCES "public"."recurring_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
