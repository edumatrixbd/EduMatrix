-- ============================================================
-- Migration 094: Subscription Auto-Suspend Cron Job
-- Automatically marks subscriptions as 'expired' if their
-- expires_at date has passed.
-- ============================================================

-- Ensure the pg_cron extension is enabled (Requires superuser privileges in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the function that will perform the update
CREATE OR REPLACE FUNCTION public.auto_suspend_expired_subscriptions()
RETURNS void AS $$
BEGIN
  -- Update individual user subscriptions
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();

  -- Update batch subscriptions (if applicable)
  UPDATE public.batch_subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
    
  -- Log the activity (optional, requires a system user ID or null user)
  -- INSERT INTO public.activity_logs (action, target_type, created_at)
  -- VALUES ('SYSTEM_CRON_SUSPEND', 'subscriptions', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cron job to run every day at midnight (UTC)
-- The job name is 'suspend_expired_subs'
SELECT cron.schedule(
  'suspend_expired_subs',
  '0 0 * * *',
  $$SELECT public.auto_suspend_expired_subscriptions();$$
);
