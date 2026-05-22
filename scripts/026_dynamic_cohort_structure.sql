-- Migration: Dynamic University and Department System
-- 026_dynamic_cohort_structure.sql

-- 1. Create universities table
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    short_name TEXT NOT NULL UNIQUE, -- e.g., 'DIU'
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL, -- e.g., 'CSE'
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(university_id, short_name)
);

-- 3. Enable RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Admins can manage universities" ON public.universities FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'superadmin'))
);
CREATE POLICY "Anyone can view active universities" ON public.universities FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'superadmin'))
);
CREATE POLICY "Anyone can view active departments" ON public.departments FOR SELECT USING (status = 'active');

-- 5. Seed initial data
DO $$
DECLARE
    diu_id UUID;
BEGIN
    -- Seed DIU
    INSERT INTO public.universities (name, short_name)
    VALUES ('Daffodil International University', 'DIU')
    ON CONFLICT (short_name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO diu_id;

    -- Seed CSE Department for DIU
    INSERT INTO public.departments (university_id, name, short_name)
    VALUES (diu_id, 'Computer Science and Engineering', 'CSE')
    ON CONFLICT (university_id, short_name) DO NOTHING;
END $$;
