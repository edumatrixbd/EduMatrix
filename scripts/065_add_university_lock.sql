-- Migration: Adding Lock Status to Universities
-- 065_add_university_lock.sql

-- 1. Add is_locked column if not exists
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT true;

-- 2. Unlock DIU by default (as it's the primary institution)
UPDATE public.universities SET is_locked = false WHERE short_name = 'DIU';
