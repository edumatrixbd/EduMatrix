-- Migration: Add is_free column for Freemium model
-- 058_freemium_content.sql

ALTER TABLE public.video_lectures ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
ALTER TABLE public.study_notes ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
ALTER TABLE public.previous_questions ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
ALTER TABLE public.exam_suggestions ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
ALTER TABLE public.solved_answers ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- Add index for freemium filtering
CREATE INDEX IF NOT EXISTS idx_video_lectures_free ON public.video_lectures(is_free);
CREATE INDEX IF NOT EXISTS idx_study_notes_free ON public.study_notes(is_free);
CREATE INDEX IF NOT EXISTS idx_previous_questions_free ON public.previous_questions(is_free);
CREATE INDEX IF NOT EXISTS idx_exam_suggestions_free ON public.exam_suggestions(is_free);
CREATE INDEX IF NOT EXISTS idx_solved_answers_free ON public.solved_answers(is_free);
