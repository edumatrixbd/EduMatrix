-- Migration: Add missing columns to profiles for User Management
-- 017_fix_profiles_columns.sql

DO $$ 
BEGIN
    -- registration_number
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'registration_number') THEN
        ALTER TABLE public.profiles ADD COLUMN registration_number TEXT;
    END IF;

    -- plan
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan') THEN
        ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free';
    END IF;

    -- is_blocked
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_blocked') THEN
        ALTER TABLE public.profiles ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
