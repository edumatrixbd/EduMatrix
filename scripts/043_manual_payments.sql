-- Migration: Manual Payment System
-- 043_manual_payments.sql

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'manual_payments') THEN
        CREATE TABLE public.manual_payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            trx_id TEXT UNIQUE NOT NULL,
            sender_number TEXT NOT NULL,
            method TEXT NOT NULL, -- 'bkash', 'nagad', 'rocket', 'upay'
            amount NUMERIC(10, 2) NOT NULL,
            plan_id UUID REFERENCES public.academic_batches(id) ON DELETE CASCADE,
            subscription_type TEXT DEFAULT 'batch',
            phase TEXT DEFAULT 'full',
            course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
            approved_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );

        CREATE INDEX idx_manual_payments_user ON public.manual_payments(user_id);
        CREATE INDEX idx_manual_payments_trx ON public.manual_payments(trx_id);
        CREATE INDEX idx_manual_payments_status ON public.manual_payments(status);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own manual payments" ON public.manual_payments;
CREATE POLICY "Users can view their own manual payments" ON public.manual_payments
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own manual payments" ON public.manual_payments;
CREATE POLICY "Users can insert their own manual payments" ON public.manual_payments
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all manual payments" ON public.manual_payments;
CREATE POLICY "Admins can manage all manual payments" ON public.manual_payments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
