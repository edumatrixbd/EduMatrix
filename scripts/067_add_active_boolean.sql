-- Migration: Adding Active Boolean to Universities and Departments
-- 067_add_active_boolean.sql

-- 1. Add active column if not exists to universities
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 2. Add active column if not exists to departments
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 3. Synchronize active with status ONLY IF status exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'status') THEN
        UPDATE public.universities SET active = (status = 'active') WHERE status IS NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'status') THEN
        UPDATE public.departments SET active = (status = 'active') WHERE status IS NOT NULL;
    END IF;
END $$;
