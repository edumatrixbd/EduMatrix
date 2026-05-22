-- 060_update_university_logos.sql
-- Updates the logo_url for universities to match the new standardized folder structure

UPDATE public.universities SET logo_url = '/logos/diu.png' WHERE slug = 'diu';
UPDATE public.universities SET logo_url = '/logos/nsu.png' WHERE slug = 'nsu';
UPDATE public.universities SET logo_url = '/logos/brac.png' WHERE slug = 'brac';
UPDATE public.universities SET logo_url = '/logos/aiub.png' WHERE slug = 'aiub';
UPDATE public.universities SET logo_url = '/logos/aust.png' WHERE slug = 'aust';
UPDATE public.universities SET logo_url = '/logos/uiu.png' WHERE slug = 'uiu';
UPDATE public.universities SET logo_url = '/logos/city.jpg' WHERE slug = 'city';
UPDATE public.universities SET logo_url = '/logos/manarat.png' WHERE slug = 'manarat';
UPDATE public.universities SET logo_url = '/logos/eastern.png' WHERE slug = 'eastern';
