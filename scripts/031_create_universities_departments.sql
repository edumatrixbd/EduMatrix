-- Migration: Create universities and departments tables
-- 031_create_universities_departments.sql

DO $$ 
BEGIN
    -- 1. Create universities table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'universities') THEN
        CREATE TABLE public.universities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            short_name TEXT NOT NULL UNIQUE,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
        
        -- Insert default university
        INSERT INTO public.universities (name, short_name) 
        VALUES ('Daffodil International University', 'DIU')
        ON CONFLICT (short_name) DO NOTHING;
    END IF;

    -- 2. Create departments table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'departments') THEN
        CREATE TABLE public.departments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            short_name TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            UNIQUE(university_id, short_name)
        );

        -- Insert default department for DIU
        INSERT INTO public.departments (university_id, name, short_name)
        SELECT id, 'Computer Science and Engineering', 'CSE'
        FROM public.universities 
        WHERE short_name = 'DIU'
        ON CONFLICT (university_id, short_name) DO NOTHING;
    END IF;

    -- 3. Update academic_batches to reference these if needed (optional for now as we use text)
    -- We keep text columns for university/department in other tables for simplicity/flexibility
    -- but these tables provide the dropdown source.

END $$;
