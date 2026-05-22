-- Migration 089: Add foreign key constraints to academic_batches
-- This ensures PostgREST schema cache knows about the relationship,
-- enabling nested joins like .select('university:university_id(name)')

-- 1. Ensure university_id is NOT NULL since all batches must be linked
ALTER TABLE public.academic_batches 
ALTER COLUMN university_id SET NOT NULL;

-- 2. Add foreign key constraint for university_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'academic_batches_university_id_fkey'
    ) THEN
        ALTER TABLE public.academic_batches
        ADD CONSTRAINT academic_batches_university_id_fkey
        FOREIGN KEY (university_id)
        REFERENCES public.universities(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Add foreign key constraint for department_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'academic_batches_department_id_fkey'
    ) THEN
        ALTER TABLE public.academic_batches
        ADD CONSTRAINT academic_batches_department_id_fkey
        FOREIGN KEY (department_id)
        REFERENCES public.departments(id)
        ON DELETE CASCADE;
    END IF;
END $$;
