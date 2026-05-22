-- Migration: Make price column in courses table nullable with a default of 0
-- 083_courses_price_nullable.sql

ALTER TABLE public.courses 
ALTER COLUMN price DROP NOT NULL,
ALTER COLUMN price SET DEFAULT 0;
