-- Migration: Profile Security Columns & Trigger Setup
-- 081_profile_security_columns.sql

-- 1. Ensure columns exist on profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Migrate existing profiles to be active & approved to prevent lockouts
UPDATE public.profiles
SET 
  status = 'active',
  approved = true,
  is_active = true
WHERE status IS NULL OR status = 'pending' OR approved IS NULL;

-- 3. Update the handle_new_user() trigger to correctly assign pending defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role TEXT;
BEGIN
    target_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    
    -- Insert into primary profiles table (minimal)
    INSERT INTO public.profiles (id, email, role, full_name, status, approved, is_active)
    VALUES (
        NEW.id, 
        NEW.email, 
        target_role, 
        NEW.raw_user_meta_data->>'full_name',
        'pending',
        false,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name;

    -- Insert into role-specific table
    IF target_role = 'student' THEN
        INSERT INTO public.student_profiles (id, full_name, phone_number)
        VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone_number')
        ON CONFLICT (id) DO NOTHING;
    ELSIF target_role = 'instructor' THEN
        INSERT INTO public.instructor_profiles (id, full_name, status)
        VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'pending')
        ON CONFLICT (id) DO NOTHING;
    ELSIF target_role = 'admin' OR target_role = 'super_admin' THEN
        INSERT INTO public.admin_profiles (id, role)
        VALUES (NEW.id, target_role)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
