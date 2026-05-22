-- Migration: Actionable Analytics RPCs
-- 042_actionable_analytics.sql

-- 1. Get Top Performing Courses
CREATE OR REPLACE FUNCTION public.get_top_performing_courses(p_instructor_id UUID DEFAULT NULL)
RETURNS TABLE (
    course_id UUID,
    course_name TEXT,
    total_views BIGINT,
    avg_completion NUMERIC,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as course_id,
        c.course_name,
        COUNT(DISTINCT vp.user_id)::BIGINT as total_views,
        COALESCE(AVG(vp.progress_percentage), 0)::NUMERIC as avg_completion,
        COALESCE(SUM(ip.amount), 0)::NUMERIC as total_revenue
    FROM public.courses c
    LEFT JOIN public.video_progress vp ON c.id = vp.course_id
    LEFT JOIN public.instructor_payouts ip ON c.id = ip.course_id
    WHERE (p_instructor_id IS NULL OR c.instructor_id = p_instructor_id)
    GROUP BY c.id, c.course_name
    ORDER BY total_views DESC, total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Get Drop-off Alerts
CREATE OR REPLACE FUNCTION public.get_drop_off_alerts(p_instructor_id UUID DEFAULT NULL)
RETURNS TABLE (
    video_id UUID,
    video_title TEXT,
    course_name TEXT,
    drop_off_count BIGINT,
    total_viewers BIGINT,
    drop_off_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH video_stats AS (
        SELECT 
            vp.video_id,
            COUNT(*) FILTER (WHERE vp.progress_percentage < 30) as drop_offs,
            COUNT(*) as total_viewers
        FROM public.video_progress vp
        GROUP BY vp.video_id
    )
    SELECT 
        v.id as video_id,
        v.title as video_title,
        c.course_name,
        vs.drop_offs::BIGINT,
        vs.total_viewers::BIGINT,
        (vs.drop_offs::NUMERIC / vs.total_viewers::NUMERIC * 100)::NUMERIC as drop_off_percentage
    FROM video_stats vs
    JOIN public.video_lectures v ON vs.video_id = v.id
    JOIN public.courses c ON v.course_id = c.id
    WHERE (p_instructor_id IS NULL OR c.instructor_id = p_instructor_id)
      AND vs.total_viewers > 5 -- Minimum threshold to avoid noise
      AND (vs.drop_offs::NUMERIC / vs.total_viewers::NUMERIC) > 0.2 -- More than 20% drop off early
    ORDER BY drop_off_percentage DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Get Engagement Warnings
-- Returns low watch time courses, inactive students, and poor completion lessons
CREATE OR REPLACE FUNCTION public.get_engagement_warnings(p_instructor_id UUID DEFAULT NULL)
RETURNS TABLE (
    type TEXT, -- 'course_low_watch', 'inactive_student', 'lesson_poor_completion'
    id UUID,
    title TEXT,
    description TEXT,
    severity TEXT -- 'low', 'medium', 'high'
) AS $$
BEGIN
    -- Low Watch Time Courses
    RETURN QUERY
    SELECT 
        'course_low_watch'::TEXT,
        c.id,
        c.course_name,
        'Average watch time is below 20 minutes per student.'::TEXT,
        'medium'::TEXT
    FROM public.courses c
    JOIN public.video_progress vp ON c.id = vp.course_id
    WHERE (p_instructor_id IS NULL OR c.instructor_id = p_instructor_id)
    GROUP BY c.id, c.course_name
    HAVING AVG(vp.watched_seconds) < 1200;

    -- Inactive Students (7+ days)
    RETURN QUERY
    SELECT 
        'inactive_student'::TEXT,
        ce.student_id,
        s.name,
        'Student has not accessed the platform in 7+ days.'::TEXT,
        'high'::TEXT
    FROM public.course_enrollments ce
    JOIN public.students s ON ce.student_id = s.id
    JOIN public.courses c ON ce.course_id = c.id
    WHERE (p_instructor_id IS NULL OR c.instructor_id = p_instructor_id)
      AND ce.last_accessed_at < NOW() - INTERVAL '7 days'
      AND ce.status = 'active';

    -- Lessons with Poor Completion
    RETURN QUERY
    SELECT 
        'lesson_poor_completion'::TEXT,
        v.id,
        v.title,
        'Less than 40% of viewers completed this lesson.'::TEXT,
        'medium'::TEXT
    FROM public.video_lectures v
    JOIN public.video_progress vp ON v.id = vp.video_id
    JOIN public.courses c ON v.course_id = c.id
    WHERE (p_instructor_id IS NULL OR c.instructor_id = p_instructor_id)
    GROUP BY v.id, v.title
    HAVING AVG(vp.progress_percentage) < 40;
END;
$$ LANGUAGE plpgsql;
