-- Migration: Institutional RLS Deactivation for Onboarding
-- 066_disable_rls_institutional.sql

DO $$ 
BEGIN
    -- Disable RLS for institutional hierarchy to ensure student visibility during billing
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'universities') THEN
        ALTER TABLE public.universities DISABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'departments') THEN
        ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'academic_batches') THEN
        ALTER TABLE public.academic_batches DISABLE ROW LEVEL SECURITY;
    END IF;

END $$;
