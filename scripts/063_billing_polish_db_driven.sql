-- Migration: Final Billing Schema Hardening (Fully DB-Driven)
-- 063_billing_polish_db_driven.sql

DO $$ 
BEGIN
    -- 1. Create Promo Codes Table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'promo_codes') THEN
        CREATE TABLE public.promo_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code TEXT NOT NULL UNIQUE,
            discount_percentage INTEGER NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
        
        -- Seed initial promos
        INSERT INTO public.promo_codes (code, discount_percentage) VALUES 
        ('SAVE10', 10),
        ('UNIHUB20', 20),
        ('WELCOME50', 50);
    END IF;

    -- 2. Add Styling Columns to Subscription Plans
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'icon_name') THEN
        ALTER TABLE public.subscription_plans 
        ADD COLUMN icon_name TEXT DEFAULT 'Zap',
        ADD COLUMN gradient_class TEXT DEFAULT 'from-blue-600/20 to-purple-600/20',
        ADD COLUMN icon_bg_class TEXT DEFAULT 'bg-blue-500/10 text-blue-600',
        ADD COLUMN tag_text TEXT,
        ADD COLUMN is_premium BOOLEAN DEFAULT false,
        ADD COLUMN status TEXT DEFAULT 'active';
    END IF;

    -- 3. Update existing plans with premium visuals
    -- Full Semester Plan
    UPDATE public.subscription_plans 
    SET 
        icon_name = 'ShieldCheck',
        gradient_class = 'from-amber-500/30 to-yellow-600/20',
        icon_bg_class = 'bg-yellow-500/10 text-yellow-600',
        tag_text = 'Recommended',
        is_premium = true
    WHERE type = 'batch' AND phase = 'full';

    -- Mid Season Plan
    UPDATE public.subscription_plans 
    SET 
        icon_name = 'Target',
        gradient_class = 'from-orange-600/20 to-pink-600/20',
        icon_bg_class = 'bg-orange-500/10 text-orange-600',
        tag_text = 'Phase 1'
    WHERE type = 'batch' AND phase = 'mid';

    -- Final Season Plan
    UPDATE public.subscription_plans 
    SET 
        icon_name = 'Crown',
        gradient_class = 'from-purple-600/20 to-pink-600/20',
        icon_bg_class = 'bg-purple-500/10 text-purple-600',
        tag_text = 'Phase 2'
    WHERE type = 'batch' AND phase = 'final';

END $$;

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active promos" ON public.promo_codes;
CREATE POLICY "Anyone can view active promos" ON public.promo_codes FOR SELECT USING (status = 'active');
