-- Migration: Relax user_id constraint on instructor_applications
-- 038_relax_app_user_id.sql

ALTER TABLE public.instructor_applications 
ALTER COLUMN user_id DROP NOT NULL;
