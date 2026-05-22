-- Migration: Enhanced Profiles for Onboarding
-- 057_enhanced_profiles.sql

-- 1. Ensure Columns Exist in Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id),
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.academic_batches(id),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS student_phone TEXT,
ADD COLUMN IF NOT EXISTS student_id_number TEXT;

-- 2. Ensure supporting columns exist in hierarchy tables (fix for legacy environments)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'short_name') THEN
        ALTER TABLE public.universities ADD COLUMN short_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'short_name') THEN
        ALTER TABLE public.departments ADD COLUMN short_name TEXT;
    END IF;
END $$;

-- 3. Update RLS to allow users to update their own onboarding status
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. View for easier student data access (using unique name to avoid table conflict)
DROP VIEW IF EXISTS public.student_details_view;
CREATE OR REPLACE VIEW public.student_details_view AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.onboarding_completed,
    u.name as university_name,
    u.short_name as university_short_name,
    d.name as department_name,
    d.short_name as department_short_name,
    b.batch as batch_number
FROM public.profiles p
LEFT JOIN public.universities u ON p.university_id = u.id
LEFT JOIN public.departments d ON p.department_id = d.id
LEFT JOIN public.academic_batches b ON p.batch_id = b.id;
