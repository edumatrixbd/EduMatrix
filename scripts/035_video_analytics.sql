-- Migration: Video Analytics and Progress Tracking
-- 035_video_analytics.sql

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'video_progress') THEN
        CREATE TABLE public.video_progress (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            video_id UUID REFERENCES public.video_lectures(id) ON DELETE CASCADE,
            course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
            watched_seconds INTEGER DEFAULT 0,
            total_duration INTEGER DEFAULT 0,
            progress_percentage INTEGER DEFAULT 0,
            last_position INTEGER DEFAULT 0,
            completed BOOLEAN DEFAULT FALSE,
            drop_off_time INTEGER,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            UNIQUE(user_id, video_id)
        );
        
        CREATE INDEX idx_video_progress_user ON public.video_progress(user_id);
        CREATE INDEX idx_video_progress_course ON public.video_progress(course_id);
        CREATE INDEX idx_video_progress_video ON public.video_progress(video_id);
    END IF;
END $$;

-- 5. RPC for Course Analytics
CREATE OR REPLACE FUNCTION public.get_course_popularity()
RETURNS TABLE (
    course_id UUID,
    course_name TEXT,
    student_count BIGINT,
    total_watch_time BIGINT,
    avg_completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as course_id,
        c.course_name,
        COUNT(DISTINCT vp.user_id) as student_count,
        SUM(vp.watched_seconds)::BIGINT as total_watch_time,
        AVG(vp.progress_percentage)::NUMERIC as avg_completion_rate
    FROM public.courses c
    LEFT JOIN public.video_progress vp ON c.id = vp.course_id
    GROUP BY c.id, c.course_name
    ORDER BY student_count DESC;
END;
$$ LANGUAGE plpgsql;
