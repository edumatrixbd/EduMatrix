-- Migration: Hardening Dashboard RPCs with UUID Cohort Filtering
-- 060_harden_dashboard_rpcs.sql

-- 1. Optimized Dashboard Statistics Function with UUID Cohort Filtering
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_university_id UUID DEFAULT NULL,
    p_department_id UUID DEFAULT NULL,
    p_batch_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'courses', (
            SELECT count(*) 
            FROM public.courses 
            WHERE status = 'active' 
            AND (p_university_id IS NULL OR university_id = p_university_id) 
            AND (p_department_id IS NULL OR department_id = p_department_id) 
            AND (p_batch_id IS NULL OR batch_id = p_batch_id)
        ),
        'questions', (
            SELECT count(*) 
            FROM public.previous_questions q
            JOIN public.courses c ON q.course_id = c.id
            WHERE (p_university_id IS NULL OR c.university_id = p_university_id) 
            AND (p_department_id IS NULL OR c.department_id = p_department_id) 
            AND (p_batch_id IS NULL OR c.batch_id = p_batch_id)
        ),
        'videos', (
            SELECT count(*) 
            FROM public.video_lectures v
            JOIN public.courses c ON v.course_id = c.id
            WHERE (p_university_id IS NULL OR c.university_id = p_university_id) 
            AND (p_department_id IS NULL OR c.department_id = p_department_id) 
            AND (p_batch_id IS NULL OR c.batch_id = p_batch_id)
        ),
        'notes', (
            SELECT count(*) 
            FROM public.study_notes n
            JOIN public.courses c ON n.course_id = c.id
            WHERE (p_university_id IS NULL OR c.university_id = p_university_id) 
            AND (p_department_id IS NULL OR c.department_id = p_department_id) 
            AND (p_batch_id IS NULL OR c.batch_id = p_batch_id)
        ),
        'students', (
            SELECT count(*) 
            FROM public.profiles 
            WHERE role = 'student' 
            AND (p_university_id IS NULL OR university_id = p_university_id) 
            AND (p_department_id IS NULL OR department_id = p_department_id)
        )
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Optimized Recent Activity Function with UUID Cohort Filtering
CREATE OR REPLACE FUNCTION get_recent_activity(
    limit_val INTEGER DEFAULT 5,
    p_university_id UUID DEFAULT NULL,
    p_department_id UUID DEFAULT NULL,
    p_batch_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content_type TEXT,
    course_name TEXT,
    course_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    (
        SELECT v.id, v.title, 'video'::TEXT as content_type, c.course_name, c.course_code, v.created_at
        FROM public.video_lectures v
        JOIN public.courses c ON v.course_id = c.id
        WHERE (p_university_id IS NULL OR c.university_id = p_university_id)
        AND (p_department_id IS NULL OR c.department_id = p_department_id)
        AND (p_batch_id IS NULL OR c.batch_id = p_batch_id)
        
        UNION ALL
        
        SELECT q.id, 'Question Paper'::TEXT as title, 'question'::TEXT as content_type, c.course_name, c.course_code, q.created_at
        FROM public.previous_questions q
        JOIN public.courses c ON q.course_id = c.id
        WHERE (p_university_id IS NULL OR c.university_id = p_university_id)
        AND (p_department_id IS NULL OR c.department_id = p_department_id)
        AND (p_batch_id IS NULL OR c.batch_id = p_batch_id)
        
        UNION ALL
        
        SELECT n.id, n.title, 'note'::TEXT as content_type, c.course_name, c.course_code, n.created_at
        FROM public.study_notes n
        JOIN public.courses c ON n.course_id = c.id
        WHERE (p_university_id IS NULL OR c.university_id = p_university_id)
        AND (p_department_id IS NULL OR c.department_id = p_department_id)
        AND (p_batch_id IS NULL OR c.batch_id = p_batch_id)
    )
    ORDER BY created_at DESC
    LIMIT limit_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
