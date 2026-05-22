-- Migration: Standardizing Content Tables with Cohort Metadata
-- 028_standardize_content_tables.sql

-- 1. video_lectures
ALTER TABLE public.video_lectures 
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS batch TEXT,
ADD COLUMN IF NOT EXISTS file_key TEXT;

-- 2. previous_questions
ALTER TABLE public.previous_questions 
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS batch TEXT,
ADD COLUMN IF NOT EXISTS file_key TEXT;

-- 3. exam_suggestions
ALTER TABLE public.exam_suggestions 
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS batch TEXT,
ADD COLUMN IF NOT EXISTS file_key TEXT;

-- 4. study_notes
ALTER TABLE public.study_notes 
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS batch TEXT,
ADD COLUMN IF NOT EXISTS file_key TEXT;

-- 5. solved_answers
ALTER TABLE public.solved_answers 
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS batch TEXT,
ADD COLUMN IF NOT EXISTS file_key TEXT;

-- 6. Add indexes for faster cohort-based filtering
CREATE INDEX IF NOT EXISTS idx_video_lectures_cohort ON public.video_lectures(university, department, batch);
CREATE INDEX IF NOT EXISTS idx_previous_questions_cohort ON public.previous_questions(university, department, batch);
CREATE INDEX IF NOT EXISTS idx_exam_suggestions_cohort ON public.exam_suggestions(university, department, batch);
CREATE INDEX IF NOT EXISTS idx_study_notes_cohort ON public.study_notes(university, department, batch);
CREATE INDEX IF NOT EXISTS idx_solved_answers_cohort ON public.solved_answers(university, department, batch);
