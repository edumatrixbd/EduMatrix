-- Migration 078: Activity Logs Schema

DO $$ 
BEGIN

    -- 1. Create activity_logs table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
        CREATE TABLE public.activity_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            admin_email TEXT,
            action TEXT NOT NULL,
            target_type TEXT,
            target_id TEXT,
            details JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

        -- Policies for activity_logs
        -- Allow admins to insert activity logs
        CREATE POLICY "Admins can insert activity logs" ON public.activity_logs
        FOR INSERT TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin')
            )
        );

        -- Allow admins to read activity logs
        CREATE POLICY "Admins can view activity logs" ON public.activity_logs
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin')
            )
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON public.activity_logs(admin_id);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
    END IF;

    -- Ensure admin_id column exists on pre-existing tables
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'admin_id') THEN
        ALTER TABLE public.activity_logs ADD COLUMN admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Ensure admin_email column exists on pre-existing tables
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'admin_email') THEN
        ALTER TABLE public.activity_logs ADD COLUMN admin_email TEXT;
    END IF;

    -- Ensure target_id column exists on pre-existing tables
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'target_id') THEN
        ALTER TABLE public.activity_logs ADD COLUMN target_id TEXT;
    ELSE
        -- Alter existing target_id column to TEXT if it was created as UUID
        ALTER TABLE public.activity_logs ALTER COLUMN target_id TYPE TEXT;
    END IF;

    -- Ensure target_type column exists on pre-existing tables
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'target_type') THEN
        ALTER TABLE public.activity_logs ADD COLUMN target_type TEXT;
    END IF;

    -- Ensure details column exists on pre-existing tables
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'details') THEN
        ALTER TABLE public.activity_logs ADD COLUMN details JSONB DEFAULT '{}'::JSONB;
    END IF;

END $$;
