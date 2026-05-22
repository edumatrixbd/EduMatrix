-- Migration: Hard Reset Universities RLS
-- 062_reset_universities_rls.sql

-- 1. Drop existing policies
DROP POLICY IF EXISTS "allow authenticated read universities" ON public.universities;
DROP POLICY IF EXISTS "Anyone can view active universities" ON public.universities;
DROP POLICY IF EXISTS "Authenticated users can view active universities" ON public.universities;
DROP POLICY IF EXISTS "Anyone can view universities" ON public.universities;

-- 2. Create a truly public policy for now to ensure onboarding works
CREATE POLICY "public_read_universities"
ON public.universities FOR SELECT
TO public
USING (active = true OR status = 'active');

-- 3. Ensure columns exist and are set
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
UPDATE public.universities SET active = true WHERE active IS NULL;

-- 4. Re-enable RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
