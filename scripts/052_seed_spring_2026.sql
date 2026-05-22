-- Seed Specific Institutional Data
-- 052_seed_spring_2026.sql

DO $$
DECLARE
    v_uni_id UUID;
    v_dept_id UUID;
    v_sem_id UUID;
    v_batch_id UUID;
BEGIN
    -- 1. University: DIU
    INSERT INTO public.universities (name, short_name, status) 
    VALUES ('Daffodil International University', 'DIU', 'active')
    ON CONFLICT (name) DO UPDATE SET status = 'active'
    RETURNING id INTO v_uni_id;

    -- 2. Department: CSE
    INSERT INTO public.departments (university_id, name, short_name, status) 
    VALUES (v_uni_id, 'Computer Science and Engineering', 'CSE', 'active')
    ON CONFLICT (university_id, short_name) DO UPDATE SET status = 'active'
    RETURNING id INTO v_dept_id;

    -- 3. Semester: Spring 2026
    INSERT INTO public.semesters (university_id, name, code, is_current, status)
    VALUES (v_uni_id, 'Spring 2026', 'S26', true, 'active')
    ON CONFLICT (university_id, name) DO UPDATE SET is_current = true
    RETURNING id INTO v_sem_id;

    -- 4. Batch: 61
    INSERT INTO public.academic_batches (batch, university, department, university_id, department_id, status)
    VALUES ('61', 'DIU', 'CSE', v_uni_id, v_dept_id, 'active')
    ON CONFLICT (batch, university, department) DO UPDATE SET status = 'active'
    RETURNING id INTO v_batch_id;

    -- 5. Course: Data Structures
    INSERT INTO public.courses (course_code, course_name, credits, semester, semester_id, university_id, department_id, batch_id, status, price)
    VALUES 
    ('CSE-201', 'Data Structures', 3, 3, v_sem_id, v_uni_id, v_dept_id, v_batch_id, 'active', 800)
    ON CONFLICT (course_code) DO UPDATE SET semester_id = v_sem_id, batch_id = v_batch_id;

END $$;
