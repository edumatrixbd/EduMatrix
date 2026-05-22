-- Migration: Exam Suggestions System
-- 046_exam_suggestions.sql

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exam_suggestions') THEN
        CREATE TABLE public.exam_suggestions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT,
            university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
            department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
            semester_id INTEGER, -- 1-12
            batch_id UUID REFERENCES public.academic_batches(id) ON DELETE SET NULL,
            course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
            priority TEXT DEFAULT 'medium', -- high, medium, low
            study_tips TEXT,
            status TEXT DEFAULT 'active', -- active, inactive
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );

        -- Add indexes for performance
        CREATE INDEX idx_suggestions_course ON public.exam_suggestions(course_id);
        CREATE INDEX idx_suggestions_batch ON public.exam_suggestions(batch_id);
        CREATE INDEX idx_suggestions_status ON public.exam_suggestions(status);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.exam_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view active suggestions" ON public.exam_suggestions;
CREATE POLICY "Anyone can view active suggestions" ON public.exam_suggestions
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage suggestions" ON public.exam_suggestions;
CREATE POLICY "Admins can manage suggestions" ON public.exam_suggestions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin' OR profiles.role = 'superadmin')
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_update_suggestions_updated_at ON public.exam_suggestions;
CREATE TRIGGER tr_update_suggestions_updated_at
    BEFORE UPDATE ON public.exam_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
