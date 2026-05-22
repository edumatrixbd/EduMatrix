-- Migration: Add cohort columns to courses table
-- 030_courses_cohort_columns.sql

DO $$ 
BEGIN
    -- Add university column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'university') THEN
        ALTER TABLE public.courses ADD COLUMN university TEXT;
    END IF;

    -- Add department column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'department') THEN
        ALTER TABLE public.courses ADD COLUMN department TEXT;
    END IF;

    -- Add batch column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'batch') THEN
        ALTER TABLE public.courses ADD COLUMN batch TEXT;
    END IF;
END $$;
