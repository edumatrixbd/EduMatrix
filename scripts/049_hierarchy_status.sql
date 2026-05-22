-- Migration: Hierarchy Status Support
-- 049_hierarchy_status.sql

DO $$ 
BEGIN
    -- 1. Add status to universities
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'status') THEN
        ALTER TABLE public.universities ADD COLUMN status TEXT DEFAULT 'active';
    END IF;

    -- 2. Add status to departments
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'status') THEN
        ALTER TABLE public.departments ADD COLUMN status TEXT DEFAULT 'active';
    END IF;

    -- 3. Update existing records to active
    UPDATE public.universities SET status = 'active' WHERE status IS NULL;
    UPDATE public.departments SET status = 'active' WHERE status IS NULL;

END $$;
