-- Migration: Add missing batch_id column to courses
-- 082_courses_batch_id.sql

ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.academic_batches(id) ON DELETE CASCADE;
