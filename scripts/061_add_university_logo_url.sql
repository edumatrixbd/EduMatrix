-- Migration: Add logo_url to Universities
-- 061_add_university_logo_url.sql

ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Update existing records if they exist
UPDATE public.universities SET logo_url = '/logos/diu.png' WHERE slug = 'diu';
UPDATE public.universities SET logo_url = '/logos/nsu.png' WHERE slug = 'nsu';
UPDATE public.universities SET logo_url = '/logos/brac.png' WHERE slug = 'brac';
UPDATE public.universities SET logo_url = '/logos/aiub.png' WHERE slug = 'aiub';
UPDATE public.universities SET logo_url = '/logos/aust.png' WHERE slug = 'aust';
UPDATE public.universities SET logo_url = '/logos/uiu.png' WHERE slug = 'uiu';
UPDATE public.universities SET logo_url = '/logos/city.jpg' WHERE slug = 'city';
UPDATE public.universities SET logo_url = '/logos/manarat.png' WHERE slug = 'manarat';
UPDATE public.universities SET logo_url = '/logos/eastern.png' WHERE slug = 'eastern';
