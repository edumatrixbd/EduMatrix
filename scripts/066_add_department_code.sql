-- Migration: Adding Code column to Departments
-- 066_add_department_code.sql

-- 1. Add code column if not exists
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS code TEXT;

-- 2. Backfill code from short_name
UPDATE public.departments SET code = short_name WHERE code IS NULL;
