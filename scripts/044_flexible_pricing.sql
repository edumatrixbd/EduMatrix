-- Migration: Flexible Pricing System
-- 044_flexible_pricing.sql

DO $$ 
BEGIN
    -- 1. Create subscription_plans table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_plans') THEN
        CREATE TABLE public.subscription_plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            type TEXT NOT NULL, -- 'day', 'course', 'batch'
            phase TEXT NOT NULL, -- 'mid', 'final', 'full'
            price NUMERIC(10, 2) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );

        -- Insert default plans
        INSERT INTO public.subscription_plans (name, type, phase, price, description) VALUES
        ('24h Instant Access', 'day', 'full', 50.00, 'Full access to everything for 24 hours'),
        ('Single Course - Mid Prep', 'course', 'mid', 250.00, 'Access to one course till Mid-term'),
        ('Single Course - Final Prep', 'course', 'final', 250.00, 'Access to one course from Mid to Final'),
        ('Single Course - Complete', 'course', 'full', 450.00, 'Full semester access to one course'),
        ('Batch Pass - Mid Season', 'batch', 'mid', 1500.00, 'Access to all courses in batch till Mid-term'),
        ('Batch Pass - Final Season', 'batch', 'final', 1500.00, 'Access to all courses in batch from Mid to Final'),
        ('Full Semester Batch Pass', 'batch', 'full', 2500.00, 'Complete access to all batch courses for the entire semester');
    END IF;

    -- 2. Update batch_subscriptions to handle flexible types
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'batch_subscriptions') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'batch_subscriptions' AND column_name = 'subscription_type') THEN
            ALTER TABLE public.batch_subscriptions 
            ADD COLUMN subscription_type TEXT DEFAULT 'batch',
            ADD COLUMN phase TEXT DEFAULT 'full',
            ADD COLUMN course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
            ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        END IF;
    ELSE
        -- Create it if it somehow doesn't exist (e.g. 032 was missed)
        CREATE TABLE public.batch_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            batch_id UUID REFERENCES public.academic_batches(id) ON DELETE CASCADE,
            amount_paid NUMERIC(10, 2) NOT NULL,
            payment_id TEXT UNIQUE,
            status TEXT DEFAULT 'success',
            subscription_type TEXT DEFAULT 'batch',
            phase TEXT DEFAULT 'full',
            course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
    END IF;
END $$;

-- Enable RLS for plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans FOR SELECT USING (true);
-- 3. Add exam dates to academic_batches for expiry calculation
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'academic_batches' AND column_name = 'mid_exam_date') THEN
        ALTER TABLE public.academic_batches 
        ADD COLUMN mid_exam_date TIMESTAMP WITH TIME ZONE,
        ADD COLUMN final_exam_date TIMESTAMP WITH TIME ZONE,
        ADD COLUMN semester_end_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 4. Add exam dates to courses for subject-specific expiry
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'mid_exam_date') THEN
        ALTER TABLE public.courses 
        ADD COLUMN mid_exam_date TIMESTAMP WITH TIME ZONE,
        ADD COLUMN final_exam_date TIMESTAMP WITH TIME ZONE,
        ADD COLUMN semester_end_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 5. Add category to video_lectures for phase-based access
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'video_lectures' AND column_name = 'category') THEN
        ALTER TABLE public.video_lectures 
        ADD COLUMN category TEXT DEFAULT 'mid';
    END IF;
END $$;

-- 6. Add semester to subscriptions and payments
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'batch_subscriptions' AND column_name = 'semester') THEN
        ALTER TABLE public.batch_subscriptions ADD COLUMN semester INTEGER;
        ALTER TABLE public.manual_payments ADD COLUMN semester INTEGER;
    END IF;
END $$;
