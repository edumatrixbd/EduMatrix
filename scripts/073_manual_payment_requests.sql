-- Migration: Manual payment requests table
-- Stores the student-submitted manual payment request before admin approval.

CREATE TABLE IF NOT EXISTS public.manual_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  batch_id UUID NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  sender_number TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'manual_payment_requests_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.manual_payment_requests
      ADD CONSTRAINT manual_payment_requests_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'manual_payment_requests_plan_id_fkey'
  ) THEN
    ALTER TABLE public.manual_payment_requests
      ADD CONSTRAINT manual_payment_requests_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'manual_payment_requests_batch_id_fkey'
  ) THEN
    ALTER TABLE public.manual_payment_requests
      ADD CONSTRAINT manual_payment_requests_batch_id_fkey
      FOREIGN KEY (batch_id) REFERENCES public.academic_batches(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_manual_payment_requests_user
  ON public.manual_payment_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_manual_payment_requests_batch
  ON public.manual_payment_requests(batch_id);

CREATE INDEX IF NOT EXISTS idx_manual_payment_requests_status
  ON public.manual_payment_requests(status);

ALTER TABLE public.manual_payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own manual payment requests" ON public.manual_payment_requests;
CREATE POLICY "Users can view their own manual payment requests"
  ON public.manual_payment_requests
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own manual payment requests" ON public.manual_payment_requests;
CREATE POLICY "Users can insert their own manual payment requests"
  ON public.manual_payment_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all manual payment requests" ON public.manual_payment_requests;
CREATE POLICY "Admins can manage all manual payment requests"
  ON public.manual_payment_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
