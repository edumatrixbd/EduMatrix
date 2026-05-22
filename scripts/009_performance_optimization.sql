-- Database Optimization for High Concurrency (1000+ users)

-- 1. Indexes for frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_university ON public.profiles(university);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

CREATE INDEX IF NOT EXISTS idx_courses_semester ON public.courses(semester);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);

CREATE INDEX IF NOT EXISTS idx_video_lectures_course_id ON public.video_lectures(course_id);
CREATE INDEX IF NOT EXISTS idx_study_notes_course_id ON public.study_notes(course_id);
CREATE INDEX IF NOT EXISTS idx_previous_questions_course_id ON public.previous_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_suggestions_course_id ON public.exam_suggestions(course_id);
CREATE INDEX IF NOT EXISTS idx_solved_answers_course_id ON public.solved_answers(course_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON public.course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_student_id ON public.activity_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_usage_sessions_student_id ON public.usage_sessions(student_id);

CREATE INDEX IF NOT EXISTS idx_course_sales_course_id ON public.course_sales(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sales_student_id ON public.course_sales(student_id);

-- 2. Optimized Dashboard Statistics Function (Single Query instead of 4+)
-- 2. Optimized Dashboard Statistics Function with Cohort Filtering
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_university TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_batch TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'courses', (SELECT count(*) FROM public.courses WHERE status = 'active' AND (p_university IS NULL OR university = p_university) AND (p_department IS NULL OR department = p_department) AND (p_batch IS NULL OR batch = p_batch)),
        'questions', (SELECT count(*) FROM public.previous_questions WHERE (p_university IS NULL OR university = p_university) AND (p_department IS NULL OR department = p_department) AND (p_batch IS NULL OR batch = p_batch)),
        'videos', (SELECT count(*) FROM public.video_lectures WHERE (p_university IS NULL OR university = p_university) AND (p_department IS NULL OR department = p_department) AND (p_batch IS NULL OR batch = p_batch)),
        'notes', (SELECT count(*) FROM public.study_notes WHERE (p_university IS NULL OR university = p_university) AND (p_department IS NULL OR department = p_department) AND (p_batch IS NULL OR batch = p_batch)),
        'students', (SELECT count(*) FROM public.profiles WHERE role = 'student' AND (p_university IS NULL OR university = p_university) AND (p_department IS NULL OR department = p_department))
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Optimized Recent Activity Function (Unified Stream)
-- 3. Optimized Recent Activity Function with Cohort Filtering
CREATE OR REPLACE FUNCTION get_recent_activity(
    limit_val INTEGER DEFAULT 5,
    p_university TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_batch TEXT DEFAULT NULL
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
        WHERE (p_university IS NULL OR v.university = p_university)
        AND (p_department IS NULL OR v.department = p_department)
        AND (p_batch IS NULL OR v.batch = p_batch)
        
        UNION ALL
        
        SELECT q.id, 'Question Paper'::TEXT as title, 'question'::TEXT as content_type, c.course_name, c.course_code, q.created_at
        FROM public.previous_questions q
        JOIN public.courses c ON q.course_id = c.id
        WHERE (p_university IS NULL OR q.university = p_university)
        AND (p_department IS NULL OR q.department = p_department)
        AND (p_batch IS NULL OR q.batch = p_batch)
        
        UNION ALL
        
        SELECT n.id, n.title, 'note'::TEXT as content_type, c.course_name, c.course_code, n.created_at
        FROM public.study_notes n
        JOIN public.courses c ON n.course_id = c.id
        WHERE (p_university IS NULL OR n.university = p_university)
        AND (p_department IS NULL OR n.department = p_department)
        AND (p_batch IS NULL OR n.batch = p_batch)
    )
    ORDER BY created_at DESC
    LIMIT limit_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
