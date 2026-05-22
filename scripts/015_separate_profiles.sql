-- Migration: Separate profiles into role-specific tables
-- 015_separate_profiles.sql

DO $$ 
BEGIN
    -- 1. Create student_profiles
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_profiles') THEN
        CREATE TABLE public.student_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name TEXT,
            phone_number TEXT,
            university TEXT,
            department TEXT,
            batch TEXT,
            semester INTEGER,
            onboarding_completed BOOLEAN DEFAULT FALSE,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
    END IF;

    -- 2. Create instructor_profiles
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'instructor_profiles') THEN
        CREATE TABLE public.instructor_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name TEXT,
            status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
            expertise TEXT,
            experience TEXT,
            institution TEXT,
            reason TEXT,
            portfolio_link TEXT,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
    END IF;

    -- 3. Create admin_profiles
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_profiles') THEN
        CREATE TABLE public.admin_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT DEFAULT 'admin', -- 'admin', 'super_admin'
            permissions JSONB DEFAULT '[]'::JSONB,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
    END IF;

    -- 4. Migrate existing data
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- Move students
        EXECUTE 'INSERT INTO public.student_profiles (id, full_name, university, department, batch, semester, onboarding_completed)
        SELECT 
            id, 
            COALESCE(full_name, name, email),
            ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='university') THEN 'university' ELSE 'NULL' END || ',
            ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='department') THEN 'department' ELSE 'NULL' END || ',
            ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='batch') THEN 'batch' ELSE 'NULL' END || ',
            ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='semester') THEN 'semester' ELSE 'NULL' END || ',
            ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='onboarding_completed') THEN 'onboarding_completed' ELSE 'FALSE' END || '
        FROM public.profiles
        WHERE role = ''student''
        ON CONFLICT (id) DO NOTHING';

        -- Move instructors
        EXECUTE 'INSERT INTO public.instructor_profiles (id, full_name, status, expertise, institution)
        SELECT 
            id, 
            COALESCE(full_name, name, email), 
            ''pending'', 
            '''', 
            ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='university') THEN 'university' ELSE 'NULL' END || '
        FROM public.profiles
        WHERE role = ''instructor''
        ON CONFLICT (id) DO NOTHING';

        -- Move admins
        EXECUTE 'INSERT INTO public.admin_profiles (id, role, permissions)
        SELECT 
            id, 
            role, 
            ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='permissions') THEN 'permissions' ELSE '''[]''::JSONB' END || '
        FROM public.profiles
        WHERE role IN (''admin'', ''super_admin'')
        ON CONFLICT (id) DO NOTHING';
    END IF;

    -- 5. Minimal profiles table cleanup
    -- We'll keep id, email, role, is_blocked, last_accessed_at in the main profiles table
    -- but we can eventually drop the student/instructor specific columns
END $$;

-- 6. Update handle_new_user trigger to handle separation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role TEXT;
BEGIN
    target_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    
    -- Insert into primary profiles table (minimal)
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (NEW.id, NEW.email, target_role, NEW.raw_user_meta_data->>'full_name')
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

-- Ensure phone_number column exists (handles re-runs and existing databases)
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- If old 'phone' column exists from a previous migration, rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'phone'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.student_profiles RENAME COLUMN phone TO phone_number;
  END IF;
END $$;
