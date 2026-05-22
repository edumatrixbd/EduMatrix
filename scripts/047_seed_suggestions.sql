-- Seed Exam Suggestions
-- 047_seed_suggestions.sql

DO $$ 
DECLARE
    v_uni_id UUID;
    v_dept_id UUID;
    v_course_id UUID;
    v_batch_id UUID;
BEGIN
    -- Get some existing IDs
    SELECT id INTO v_uni_id FROM public.universities WHERE short_name = 'DIU' LIMIT 1;
    SELECT id INTO v_dept_id FROM public.departments WHERE university_id = v_uni_id LIMIT 1;
    SELECT id, batch_id INTO v_course_id, v_batch_id FROM public.courses WHERE university_id = v_uni_id AND department_id = v_dept_id LIMIT 1;

    IF v_course_id IS NOT NULL THEN
        INSERT INTO public.exam_suggestions (title, description, university_id, department_id, semester_id, batch_id, course_id, priority, study_tips, status)
        VALUES 
        ('Midterm Blueprint: Algorithm Analysis', 'Focus on asymptotic notation and recurrence relations. Expect 3 proofs and 2 complexity analysis questions.', v_uni_id, v_dept_id, 3, v_batch_id, v_course_id, 'high', '1. Master Big O, Omega and Theta definitions.\n2. Practice Master Method and Recursion Tree method.\n3. Solve previous 3 years questions.', 'active'),
        ('Final Exam Focus: Data Structures', 'Crucial topics: AVL trees, Red-Black trees, and Dijkstra algorithm.', v_uni_id, v_dept_id, 3, v_batch_id, v_course_id, 'medium', 'Review implementation of priority queues and their applications in graph algorithms.', 'active');
    END IF;
END $$;
