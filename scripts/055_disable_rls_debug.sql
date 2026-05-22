-- Migration: Disable RLS for Debugging
-- 055_disable_rls_debug.sql

ALTER TABLE public.universities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payments DISABLE ROW LEVEL SECURITY;

-- Ensure some data exists for the test
INSERT INTO public.universities (name, short_name, slug, active) 
VALUES ('DEBUG UNIVERSITY', 'DEBUG', 'debug', true)
ON CONFLICT DO NOTHING;
