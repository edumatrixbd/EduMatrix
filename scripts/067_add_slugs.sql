-- Migration: Slug-Based Hierarchy for Clean URLs
-- 067_add_slugs.sql

DO $$ 
BEGIN
    -- 1. Update Universities
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'slug') THEN
        ALTER TABLE public.universities ADD COLUMN slug TEXT;
        UPDATE public.universities SET slug = LOWER(short_name);
        ALTER TABLE public.universities ALTER COLUMN slug SET NOT NULL;
        ALTER TABLE public.universities ADD CONSTRAINT universities_slug_unique UNIQUE (slug);
    END IF;

    -- 2. Update Departments
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'slug') THEN
        ALTER TABLE public.departments ADD COLUMN slug TEXT;
        UPDATE public.departments SET slug = LOWER(short_name);
        -- Since departments are unique within university, slug should probably be unique per uni
        -- But for simplicity and to match frontend logic, we'll just allow it for now or make it unique.
        -- Actually, a department slug like 'cse' is common across unis.
    END IF;

END $$;
