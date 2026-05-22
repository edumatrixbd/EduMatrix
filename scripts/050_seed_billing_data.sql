-- Migration: Comprehensive Billing Hierarchy & Seeding
-- 050_seed_billing_data.sql

DO $$ 
BEGIN
    -- 1. Create Universities Table if missing
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'universities') THEN
        CREATE TABLE public.universities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            short_name TEXT NOT NULL UNIQUE,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
    END IF;

    -- 2. Create Departments Table if missing
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'departments') THEN
        CREATE TABLE public.departments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            short_name TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            UNIQUE(university_id, short_name)
        );
    END IF;

    -- 3. Create Academic Batches if missing (Ensure columns exist)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'academic_batches') THEN
        CREATE TABLE public.academic_batches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            batch TEXT NOT NULL,
            university TEXT NOT NULL,
            department TEXT NOT NULL,
            university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
            department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            UNIQUE(batch, university, department)
        );
    END IF;

    -- 4. Create Courses if missing
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'courses') THEN
        CREATE TABLE public.courses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            course_code TEXT NOT NULL UNIQUE,
            course_name TEXT NOT NULL,
            description TEXT,
            instructor TEXT,
            credits INTEGER DEFAULT 3,
            semester INTEGER DEFAULT 1,
            price DECIMAL DEFAULT 0,
            status TEXT DEFAULT 'active',
            university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
            department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
            batch_id UUID REFERENCES public.academic_batches(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
    END IF;

END $$;

-- 5. Seed Default Data
DO $$
DECLARE
    v_uni_id UUID;
    v_dept_id UUID;
    v_batch_id UUID;
BEGIN
    -- Seed DIU
    INSERT INTO public.universities (name, short_name, status) 
    VALUES ('Daffodil International University', 'DIU', 'active')
    ON CONFLICT (name) DO UPDATE SET status = 'active'
    RETURNING id INTO v_uni_id;

    -- Seed CSE
    INSERT INTO public.departments (university_id, name, short_name, status) 
    VALUES (v_uni_id, 'Computer Science and Engineering', 'CSE', 'active')
    ON CONFLICT (university_id, short_name) DO UPDATE SET status = 'active'
    RETURNING id INTO v_dept_id;

    -- Seed Batch 68
    INSERT INTO public.academic_batches (batch, university, department, university_id, department_id, status)
    VALUES ('68', 'DIU', 'CSE', v_uni_id, v_dept_id, 'active')
    ON CONFLICT (batch, university, department) DO UPDATE SET status = 'active'
    RETURNING id INTO v_batch_id;

    -- Seed Sample Courses
    INSERT INTO public.courses (course_code, course_name, credits, semester, university_id, department_id, batch_id, status, price)
    VALUES 
    ('CSE-101', 'Intro to Computing', 3, 1, v_uni_id, v_dept_id, v_batch_id, 'active', 500),
    ('CSE-102', 'Structured Programming', 3, 1, v_uni_id, v_dept_id, v_batch_id, 'active', 500)
    ON CONFLICT (course_code) DO NOTHING;

    -- Seed Plans
    INSERT INTO public.subscription_plans (name, type, phase, price, university_id, department_id)
    VALUES 
    ('Batch Mid', 'batch', 'mid', 1500, v_uni_id, v_dept_id),
    ('Batch Full', 'batch', 'full', 2500, v_uni_id, v_dept_id)
    ON CONFLICT DO NOTHING;

END $$;
