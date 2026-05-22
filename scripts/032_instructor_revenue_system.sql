-- Migration: Instructor Revenue and Payout System (Updated)
-- 032_instructor_revenue_system.sql

DO $$ 
BEGIN
    -- 1. Create batch_subscriptions table to track revenue
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'batch_subscriptions') THEN
        CREATE TABLE public.batch_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            batch_id UUID REFERENCES public.academic_batches(id) ON DELETE CASCADE,
            amount_paid NUMERIC(10, 2) NOT NULL,
            payment_id TEXT UNIQUE,
            status TEXT DEFAULT 'success', -- 'pending', 'success', 'failed'
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
    END IF;

    -- 2. Create instructor_payouts table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'instructor_payouts') THEN
        CREATE TABLE public.instructor_payouts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            batch_id UUID REFERENCES public.academic_batches(id) ON DELETE CASCADE,
            course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
            subscription_id UUID REFERENCES public.batch_subscriptions(id) ON DELETE CASCADE,
            amount NUMERIC(10, 2) NOT NULL,
            status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid'
            transaction_ref TEXT,
            calculated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            paid_at TIMESTAMP WITH TIME ZONE
        );
    END IF;
END $$;

-- 3. Trigger Function to calculate instructor share on subscription success
CREATE OR REPLACE FUNCTION public.calculate_instructor_payout()
RETURNS TRIGGER AS $$
DECLARE
    total_pool NUMERIC;
    course_count INTEGER;
    share_per_course NUMERIC;
    course_record RECORD;
    batch_val TEXT;
    uni_val TEXT;
    dept_val TEXT;
BEGIN
    -- Only process on successful status
    IF NEW.status = 'success' THEN
        -- 1. Calculate 30% Pool
        total_pool := NEW.amount_paid * 0.30;

        -- 2. Get batch info for the subscription
        SELECT batch, university, department INTO batch_val, uni_val, dept_val 
        FROM public.academic_batches 
        WHERE id = NEW.batch_id;

        -- 3. Count courses in this batch
        SELECT count(*) INTO course_count 
        FROM public.courses 
        WHERE batch = batch_val AND university = uni_val AND department = dept_val;

        IF course_count > 0 THEN
            share_per_course := total_pool / course_count;

            -- 4. Create payout record for each course instructor in the batch
            FOR course_record IN 
                SELECT id, instructor_id 
                FROM public.courses 
                WHERE batch = batch_val AND university = uni_val AND department = dept_val
            LOOP
                IF course_record.instructor_id IS NOT NULL THEN
                    INSERT INTO public.instructor_payouts (
                        instructor_id,
                        batch_id,
                        course_id,
                        subscription_id,
                        amount,
                        status
                    ) VALUES (
                        course_record.instructor_id,
                        NEW.batch_id,
                        course_record.id,
                        NEW.id,
                        share_per_course,
                        'pending'
                    );
                END IF;
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach Trigger
DROP TRIGGER IF EXISTS tr_calculate_payout ON public.batch_subscriptions;
CREATE TRIGGER tr_calculate_payout
AFTER INSERT OR UPDATE OF status ON public.batch_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_instructor_payout();
