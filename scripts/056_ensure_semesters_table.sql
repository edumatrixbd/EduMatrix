-- Migration: Ensure Hierarchy Tables Exist
-- 056_ensure_semesters_table.sql

-- 1. Semesters Table
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    is_current BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure departments has active column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'active') THEN
        ALTER TABLE public.departments ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. RLS Policies
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow authenticated read semesters" ON public.semesters;
CREATE POLICY "allow authenticated read semesters"
ON public.semesters FOR SELECT
TO authenticated
USING (status = 'active');

-- 4. Enable RLS on other tables too
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
