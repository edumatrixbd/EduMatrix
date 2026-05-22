-- Migration: Remove semester column from courses table
-- 086_courses_remove_semester.sql

ALTER TABLE public.courses 
DROP COLUMN IF EXISTS semester;
