-- Migration: Hardened Onboarding Trigger and RLS
-- 059_harden_onboarding_trigger.sql

-- 1. Ensure the profiles table is fully standardized
DO $$ 
BEGIN
    -- Columns for institutional hierarchy
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id);
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.academic_batches(id);
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
    
    -- Cleanup legacy columns if they exist as text
    -- We keep them for now to avoid breaking old data, but mark as legacy
    -- ALTER TABLE public.profiles RENAME COLUMN university TO legacy_university;
END $$;

-- 2. Hardened Trigger for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role TEXT;
BEGIN
    -- Determine role (default to student)
    target_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    
    -- Insert into primary profiles table
    -- Using ON CONFLICT to ensure idempotency
    INSERT INTO public.profiles (
        id, 
        email, 
        role, 
        full_name,
        onboarding_completed
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        target_role, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name;

    -- Role-specific supplemental data (optional but good for backwards compatibility)
    IF target_role = 'student' THEN
        INSERT INTO public.student_profiles (id, full_name, onboarding_completed)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), false)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Global RLS for Onboarding
-- Allow any authenticated user to update THEIR OWN profile for onboarding fields
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can complete their own onboarding" ON public.profiles;
CREATE POLICY "Students can complete their own onboarding"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND (
        -- Allow updating hierarchy and onboarding status
        university_id IS NOT NULL OR
        department_id IS NOT NULL OR
        batch_id IS NOT NULL OR
        onboarding_completed IS NOT NULL
    )
);

-- Ensure they can also view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 4. Fix for Existing Users: Ensure all current profiles have onboarding_completed set
UPDATE public.profiles 
SET onboarding_completed = false 
WHERE onboarding_completed IS NULL;
