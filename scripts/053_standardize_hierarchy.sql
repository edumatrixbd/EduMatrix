-- Migration: Standardizing Hierarchy Columns & RLS
-- 053_standardize_hierarchy.sql

DO $$ 
BEGIN
    -- 1. Standardize Universities Table
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'slug') THEN
        ALTER TABLE public.universities ADD COLUMN slug TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'active') THEN
        ALTER TABLE public.universities ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;

    -- Update slug from short_name if empty
    UPDATE public.universities SET slug = LOWER(short_name) WHERE slug IS NULL;
    UPDATE public.universities SET active = true WHERE active IS NULL;

    -- 2. Standardize Departments Table
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'active') THEN
        ALTER TABLE public.departments ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;

    UPDATE public.departments SET active = true WHERE active IS NULL;

END $$;

-- 3. Update RLS Policies
-- Universities
DROP POLICY IF EXISTS "Anyone can view universities" ON public.universities;
CREATE POLICY "Authenticated users can view active universities" 
ON public.universities FOR SELECT 
USING (auth.role() = 'authenticated' AND active = true);

-- Departments
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
CREATE POLICY "Authenticated users can view active departments" 
ON public.departments FOR SELECT 
USING (auth.role() = 'authenticated' AND active = true);

-- Semesters
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view active semesters" ON public.semesters;
CREATE POLICY "Authenticated users can view active semesters" 
ON public.semesters FOR SELECT 
USING (auth.role() = 'authenticated' AND status = 'active');
