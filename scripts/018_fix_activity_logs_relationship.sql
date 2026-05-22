-- Migration: Fix activity_logs relationship to profiles
-- 018_fix_activity_logs_relationship.sql

DO $$ 
BEGIN
    -- 1. Ensure activity_logs table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
        CREATE TABLE public.activity_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID, -- We'll add the FK next
            action TEXT NOT NULL,
            target_id UUID,
            target_type TEXT,
            details JSONB DEFAULT '{}'::JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
    END IF;

    -- 2. Ensure user_id references public.profiles(id) for easier joining in Supabase
    -- Drop existing FK if it points to auth.users
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'activity_logs_user_id_fkey' AND table_name = 'activity_logs'
    ) THEN
        ALTER TABLE public.activity_logs DROP CONSTRAINT activity_logs_user_id_fkey;
    END IF;

    -- Add FK to public.profiles
    ALTER TABLE public.activity_logs 
    ADD CONSTRAINT activity_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

END $$;
