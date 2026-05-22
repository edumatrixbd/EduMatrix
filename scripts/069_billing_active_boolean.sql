-- Migration 069: Add active boolean to subscription_plans and promo_codes
-- Replaces string-based 'status' with boolean 'active' for consistency

DO $$
BEGIN
  -- subscription_plans: add active column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'active'
  ) THEN
    ALTER TABLE public.subscription_plans ADD COLUMN active BOOLEAN DEFAULT true;
    -- Sync from status column if it exists
    UPDATE public.subscription_plans SET active = (status = 'active') WHERE status IS NOT NULL;
  END IF;

  -- promo_codes: add active column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'promo_codes' AND column_name = 'active'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN active BOOLEAN DEFAULT true;
    UPDATE public.promo_codes SET active = (status = 'active') WHERE status IS NOT NULL;
  END IF;

  -- batch_subscriptions: ensure access_granted column exists for post-payment unlock
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'batch_subscriptions' AND column_name = 'access_granted'
  ) THEN
    ALTER TABLE public.batch_subscriptions ADD COLUMN access_granted BOOLEAN DEFAULT false;
    -- Mark existing successful subscriptions as granted
    UPDATE public.batch_subscriptions SET access_granted = true WHERE status = 'success';
  END IF;
END $$;

-- RLS: allow students to read active plans
DROP POLICY IF EXISTS "Students can view active plans" ON public.subscription_plans;
CREATE POLICY "Students can view active plans" ON public.subscription_plans
  FOR SELECT USING (active = true);

-- RLS: allow students to read active promos
DROP POLICY IF EXISTS "Students can view active promos" ON public.promo_codes;
CREATE POLICY "Students can view active promos" ON public.promo_codes
  FOR SELECT USING (active = true);

-- RLS: students can read their own subscriptions
DROP POLICY IF EXISTS "Students read own subscriptions" ON public.batch_subscriptions;
CREATE POLICY "Students read own subscriptions" ON public.batch_subscriptions
  FOR SELECT USING (auth.uid() = student_id);

-- RLS: students can insert their own subscriptions
DROP POLICY IF EXISTS "Students insert own subscriptions" ON public.batch_subscriptions;
CREATE POLICY "Students insert own subscriptions" ON public.batch_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = student_id);
