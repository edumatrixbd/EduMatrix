-- Migration: Alter credits column type to NUMERIC to support decimal credits (e.g. 1.5, 3.5)
-- 087_courses_credits_numeric.sql

ALTER TABLE public.courses 
ALTER COLUMN credits TYPE NUMERIC(4,2);
