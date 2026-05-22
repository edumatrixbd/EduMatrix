-- Migration: Extended Promo Codes & Pricing Control
-- 064_promo_codes_extended.sql

DO $$ 
BEGIN
    -- 1. Extend promo_codes table
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'promo_codes' AND column_name = 'discount_type') THEN
        ALTER TABLE public.promo_codes 
        ADD COLUMN discount_type TEXT DEFAULT 'percentage', -- 'percentage', 'fixed'
        ADD COLUMN discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
        ADD COLUMN expiry_date TIMESTAMP WITH TIME ZONE,
        ADD COLUMN usage_limit INTEGER,
        ADD COLUMN used_count INTEGER DEFAULT 0;
        
        -- Migrate old percentage logic to new column
        UPDATE public.promo_codes SET discount_value = discount_percentage;
    END IF;

    -- 2. Ensure subscription_plans has university/department mapping for admin control
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'university_id') THEN
        ALTER TABLE public.subscription_plans 
        ADD COLUMN university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
        ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE;
    END IF;

END $$;
