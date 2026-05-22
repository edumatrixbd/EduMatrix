-- Migration 071: Standardize Batch Column Name
-- Renames 'batch' to 'batch_number' in academic_batches for consistency with Admin UI and Views

DO $$
BEGIN
    -- 1. Rename column in academic_batches if it exists as 'batch'
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'academic_batches' AND column_name = 'batch'
    ) THEN
        ALTER TABLE public.academic_batches RENAME COLUMN batch TO batch_number;
    END IF;

    -- 2. Update the student_details_view to use the new column name
    -- (Actually the view uses 'b.batch as batch_number', so we update it to 'b.batch_number')
    DROP VIEW IF EXISTS public.student_details_view;
    CREATE OR REPLACE VIEW public.student_details_view AS
    SELECT 
        p.id,
        p.full_name,
        p.email,
        p.onboarding_completed,
        u.name as university_name,
        u.short_name as university_short_name,
        d.name as department_name,
        d.short_name as department_short_name,
        b.batch_number
    FROM public.profiles p
    LEFT JOIN public.universities u ON p.university_id = u.id
    LEFT JOIN public.departments d ON p.department_id = d.id
    LEFT JOIN public.academic_batches b ON p.batch_id = b.id;

END $$;
