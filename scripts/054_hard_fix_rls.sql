-- Migration: Hard Fix for RLS & Visibility
-- 054_hard_fix_rls.sql

-- 1. Ensure columns are correct
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'active') THEN
        ALTER TABLE public.universities ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'active') THEN
        ALTER TABLE public.departments ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view universities" ON public.universities;
DROP POLICY IF EXISTS "Authenticated users can view active universities" ON public.universities;
DROP POLICY IF EXISTS "allow authenticated read universities" ON public.universities;

DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can view active departments" ON public.departments;
DROP POLICY IF EXISTS "allow authenticated read departments" ON public.departments;

-- 3. Add explicit authenticated read policies
CREATE POLICY "allow authenticated read universities"
ON public.universities FOR SELECT
TO authenticated
USING (active = true);

CREATE POLICY "allow authenticated read departments"
ON public.departments FOR SELECT
TO authenticated
USING (active = true);

-- 4. Ensure RLS is actually enabled
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 5. Final verification update
UPDATE public.universities SET active = true WHERE active IS NULL;
UPDATE public.departments SET active = true WHERE active IS NULL;
