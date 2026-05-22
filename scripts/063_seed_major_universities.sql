-- Migration: Seeding Major Universities
-- 063_seed_major_universities.sql

DO $$
BEGIN
    -- Ensure active column exists if not already there (safety check)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='universities' AND column_name='active') THEN
        ALTER TABLE public.universities ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;

    -- Ensure slug column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='universities' AND column_name='slug') THEN
        ALTER TABLE public.universities ADD COLUMN slug TEXT;
    END IF;

    -- Ensure logo_url column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='universities' AND column_name='logo_url') THEN
        ALTER TABLE public.universities ADD COLUMN logo_url TEXT;
    END IF;

    -- Insert Universities
    INSERT INTO public.universities (name, short_name, slug, active, logo_url, status)
    VALUES
    ('Daffodil International University', 'DIU', 'diu', true, '/logos/diu.png', 'active'),
    ('North South University','NSU','nsu',true,'/logos/nsu.png', 'active'),
    ('BRAC University','BRAC','brac',true,'/logos/brac.png', 'active'),
    ('AUST','AUST','aust',true,'/logos/aust.png', 'active'),
    ('AIUB','AIUB','aiub',true,'/logos/aiub.png', 'active'),
    ('UIU','UIU','uiu',true,'/logos/uiu.png', 'active'),
    ('City University','CITY','city',true,'/logos/city.jpg', 'active'),
    ('Eastern University','EASTERN','eastern',true,'/logos/eastern.png', 'active'),
    ('Manarat International University','MANARAT','manarat',true,'/logos/manarat.png', 'active')
    ON CONFLICT (short_name) DO UPDATE SET 
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        active = EXCLUDED.active,
        logo_url = EXCLUDED.logo_url,
        status = EXCLUDED.status;

END $$;
