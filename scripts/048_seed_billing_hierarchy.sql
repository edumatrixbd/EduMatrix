-- Seed Billing Hierarchy
-- 048_seed_billing_hierarchy.sql

DO $$ 
DECLARE
    v_uni_id UUID;
    v_dept_id UUID;
    v_batch_id UUID;
BEGIN
    -- 1. Ensure University exists
    INSERT INTO public.universities (name, short_name) 
    VALUES ('Daffodil International University', 'DIU')
    ON CONFLICT (name) DO UPDATE SET short_name = EXCLUDED.short_name
    RETURNING id INTO v_uni_id;

    -- 2. Ensure Department exists
    INSERT INTO public.departments (university_id, name, short_name) 
    VALUES (v_uni_id, 'Computer Science and Engineering', 'CSE')
    ON CONFLICT (university_id, short_name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_dept_id;

    -- 3. Ensure Batch exists
    INSERT INTO public.academic_batches (batch, university, department, university_id, department_id, status)
    VALUES ('68', 'DIU', 'CSE', v_uni_id, v_dept_id, 'active')
    ON CONFLICT (batch, university, department) DO UPDATE SET status = 'active'
    RETURNING id INTO v_batch_id;

    -- 4. Seed some courses if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.courses WHERE batch_id = v_batch_id) THEN
        INSERT INTO public.courses (course_code, course_name, credits, semester, university_id, department_id, batch_id, status, price)
        VALUES 
        ('CSE-101', 'Introduction to Computing', 3, 1, v_uni_id, v_dept_id, v_batch_id, 'active', 500),
        ('CSE-102', 'Structured Programming', 3, 1, v_uni_id, v_dept_id, v_batch_id, 'active', 500);
    END IF;

    -- 5. Seed default plans
    INSERT INTO public.subscription_plans (name, type, phase, price, university_id, department_id)
    VALUES 
    ('Batch Mid', 'batch', 'mid', 1500, v_uni_id, v_dept_id),
    ('Batch Full', 'batch', 'full', 2500, v_uni_id, v_dept_id),
    ('Day Pass', 'day', 'full', 50, v_uni_id, v_dept_id)
    ON CONFLICT DO NOTHING;

END $$;
