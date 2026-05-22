-- Migration: Public Read Access for Billing
-- 065_public_access_billing.sql

-- Ensure tables exist and are accessible
DO $$ 
BEGIN
    -- 1. Subscription Plans
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'subscription_plans') THEN
        ALTER TABLE public.subscription_plans DISABLE ROW LEVEL SECURITY;
        -- Or alternatively, a public policy
        -- DROP POLICY IF EXISTS "Allow public read" ON public.subscription_plans;
        -- CREATE POLICY "Allow public read" ON public.subscription_plans FOR SELECT USING (true);
    END IF;

    -- 2. Promo Codes
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'promo_codes') THEN
        ALTER TABLE public.promo_codes DISABLE ROW LEVEL SECURITY;
        -- DROP POLICY IF EXISTS "Allow public read" ON public.promo_codes;
        -- CREATE POLICY "Allow public read" ON public.promo_codes FOR SELECT USING (true);
    END IF;

END $$;
