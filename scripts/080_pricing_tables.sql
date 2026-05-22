-- Migration: Superadmin Pricing Panel Schema Setup
-- 080_pricing_tables.sql

-- 1. Create course_pricing table
CREATE TABLE IF NOT EXISTS public.course_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE UNIQUE,
    regular_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_percent INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Create offers table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percent', -- 'percent', 'fixed'
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed'
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    expiry_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Extend subscription_plans with additional duration and features column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'duration') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN duration TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'features') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN features TEXT[];
    END IF;
END $$;

-- 5. Enable RLS
ALTER TABLE public.course_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 6. Create permissive RLS policies for Select and Superadmin management
DROP POLICY IF EXISTS "Anyone can view course pricing" ON public.course_pricing;
CREATE POLICY "Anyone can view course pricing" ON public.course_pricing FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage course pricing" ON public.course_pricing;
CREATE POLICY "Admins can manage course pricing" ON public.course_pricing FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can view offers" ON public.offers;
CREATE POLICY "Anyone can view offers" ON public.offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;
CREATE POLICY "Admins can manage offers" ON public.offers FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can view promo codes" ON public.promo_codes;
CREATE POLICY "Anyone can view promo codes" ON public.promo_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans FOR ALL USING (true);
