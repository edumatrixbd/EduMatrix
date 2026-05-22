-- Migration: Renaming is_locked to locked for Consistency
-- 068_rename_university_locked.sql

-- 1. Rename column in universities
ALTER TABLE public.universities RENAME COLUMN is_locked TO locked;
