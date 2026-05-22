-- Add missing columns to profiles table to support User Management dashboard
DO $$ 
BEGIN
    -- registration_number
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'registration_number') THEN
        ALTER TABLE public.profiles ADD COLUMN registration_number TEXT UNIQUE;
    END IF;

    -- plan
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan') THEN
        ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free';
    END IF;

    -- is_blocked
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_blocked') THEN
        ALTER TABLE public.profiles ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
    END IF;

    -- last_accessed_at (used in students/page.tsx)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_accessed_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
    END IF;
END $$;
