-- Migration: Add instructor_id to courses
-- 033_course_instructor_id.sql

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'instructor_id') THEN
        ALTER TABLE public.courses ADD COLUMN instructor_id UUID REFERENCES auth.users(id);
    END IF;
END $$;
