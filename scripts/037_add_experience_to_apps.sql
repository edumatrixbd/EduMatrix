-- Migration: Add experience column to instructor_applications
-- 037_add_experience_to_apps.sql

ALTER TABLE public.instructor_applications 
ADD COLUMN IF NOT EXISTS experience TEXT;
