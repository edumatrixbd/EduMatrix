-- Add is_locked column to registry tables if they do not exist
-- 088_add_is_locked_columns.sql

ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
ALTER TABLE public.academic_batches ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
