-- Create course_enrollments table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    progress INTEGER DEFAULT 0, -- percentage
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'dropped'
    UNIQUE(student_id, course_id)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    feature TEXT NOT NULL, -- 'video', 'notes', 'questions', 'solves', 'study_zone', 'search', 'download'
    action TEXT NOT NULL, -- 'view', 'open', 'watch', 'search', 'download'
    metadata JSONB DEFAULT '{}'::JSONB, -- { title: '...', id: '...' }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create usage_sessions table
CREATE TABLE IF NOT EXISTS public.usage_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    feature TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Enrollments
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.course_enrollments;
CREATE POLICY "Students can view their own enrollments" ON public.course_enrollments 
FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.course_enrollments;
CREATE POLICY "Admins can manage all enrollments" ON public.course_enrollments 
FOR ALL USING (true); -- Restricted by app logic (role check)

-- Activity Logs
DROP POLICY IF EXISTS "Students can insert their own logs" ON public.activity_logs;
CREATE POLICY "Students can insert their own logs" ON public.activity_logs 
FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can view all logs" ON public.activity_logs;
CREATE POLICY "Admins can view all logs" ON public.activity_logs 
FOR SELECT USING (true);

-- Usage Sessions
DROP POLICY IF EXISTS "Students can manage their own sessions" ON public.usage_sessions;
CREATE POLICY "Students can manage their own sessions" ON public.usage_sessions 
FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can view all sessions" ON public.usage_sessions;
CREATE POLICY "Admins can view all sessions" ON public.usage_sessions 
FOR SELECT USING (true);
