-- Migration: Final Logo URL Synchronization
-- 064_final_logo_fix.sql

-- 1. Ensure column exists
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Update EXACT paths
UPDATE public.universities SET logo_url = '/logos/diu.png' WHERE short_name = 'DIU';
UPDATE public.universities SET logo_url = '/logos/nsu.png' WHERE short_name = 'NSU';
UPDATE public.universities SET logo_url = '/logos/brac.png' WHERE short_name = 'BRAC';
UPDATE public.universities SET logo_url = '/logos/aust.png' WHERE short_name = 'AUST';
UPDATE public.universities SET logo_url = '/logos/aiub.png' WHERE short_name = 'AIUB';
UPDATE public.universities SET logo_url = '/logos/uiu.png' WHERE short_name = 'UIU';
UPDATE public.universities SET logo_url = '/logos/city.jpg' WHERE short_name = 'CITY';
UPDATE public.universities SET logo_url = '/logos/eastern.png' WHERE short_name = 'EASTERN';
UPDATE public.universities SET logo_url = '/logos/manarat.png' WHERE short_name = 'MANARAT';
