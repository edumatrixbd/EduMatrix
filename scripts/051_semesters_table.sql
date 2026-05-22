-- Migration: Semester Management
-- 051_semesters_table.sql

DO $$ 
BEGIN
    -- 1. Create Semesters Table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'semesters') THEN
        CREATE TABLE public.semesters (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
            name TEXT NOT NULL, -- e.g. 'Spring 2026'
            code TEXT, -- e.g. 'S26'
            is_current BOOLEAN DEFAULT false,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            UNIQUE(university_id, name)
        );
    END IF;

    -- 2. Add semester_id to courses if not exists
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'semester_id') THEN
        ALTER TABLE public.courses ADD COLUMN semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;
    END IF;

END $$;
