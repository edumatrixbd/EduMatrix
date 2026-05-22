-- Migration: Multi-University Scalability
-- 045_multi_university_hierarchy.sql

DO $$ 
BEGIN
    -- 1. Create Universities Table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'universities') THEN
        CREATE TABLE public.universities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            short_name TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
        -- Seed initial
        INSERT INTO public.universities (name, short_name) VALUES ('Daffodil International University', 'DIU');
    END IF;

    -- 2. Create Departments Table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'departments') THEN
        CREATE TABLE public.departments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            short_name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            UNIQUE(university_id, short_name)
        );
        -- Seed initial (Assuming DIU is first)
        INSERT INTO public.departments (university_id, name, short_name) 
        SELECT id, 'Computer Science and Engineering', 'CSE' FROM public.universities WHERE short_name = 'DIU';
    END IF;

    -- 3. Update academic_batches to use IDs
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'academic_batches' AND column_name = 'university_id') THEN
        ALTER TABLE public.academic_batches 
        ADD COLUMN university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
        ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE;

        -- Migrate existing data (String to ID mapping)
        UPDATE public.academic_batches b
        SET university_id = u.id, department_id = d.id
        FROM public.universities u, public.departments d
        WHERE b.university = u.short_name AND b.department = d.short_name;
    END IF;

    -- 4. Update courses to use IDs
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'university_id') THEN
        ALTER TABLE public.courses 
        ADD COLUMN university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
        ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
        ADD COLUMN batch_id UUID REFERENCES public.academic_batches(id) ON DELETE CASCADE;

        -- Migrate existing data
        UPDATE public.courses c
        SET university_id = u.id, department_id = d.id, batch_id = b.id
        FROM public.universities u, public.departments d, public.academic_batches b
        WHERE c.university = u.short_name AND c.department = d.short_name AND c.batch = b.batch;
    END IF;

    -- 5. Refactor Subscription Plans (Pricing)
    -- Allow different pricing per Uni/Dept
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'university_id') THEN
        ALTER TABLE public.subscription_plans 
        ADD COLUMN university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
        ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
        ADD COLUMN semester_id INTEGER; -- Using integer for semester level (1-8)
    END IF;

    -- 6. Refactor Subscriptions (Final Resolution)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'batch_subscriptions' AND column_name = 'university_id') THEN
        ALTER TABLE public.batch_subscriptions 
        ADD COLUMN university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
        ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
        ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
    END IF;

    -- 7. Update manual_payments to match
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'manual_payments' AND column_name = 'university_id') THEN
        ALTER TABLE public.manual_payments 
        ADD COLUMN university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
        ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE;
    END IF;

END $$;

-- Enable RLS for new tables
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT USING (true);
