-- HARDEN RLS POLICIES FOR UNI HUB

-- 1. Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Courses Table
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_all" ON public.courses;
CREATE POLICY "Courses are viewable by everyone" 
ON public.courses FOR SELECT USING (true);

CREATE POLICY "Admins can manage courses" 
ON public.courses FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Video Lectures Table
ALTER TABLE public.video_lectures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_lectures_all" ON public.video_lectures;
CREATE POLICY "Videos are viewable by students" 
ON public.video_lectures FOR SELECT USING (true);

CREATE POLICY "Admins/Instructors can manage videos" 
ON public.video_lectures FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')));

-- 4. Previous Questions Table
ALTER TABLE public.previous_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "previous_questions_all" ON public.previous_questions;
CREATE POLICY "Questions are viewable by everyone" 
ON public.previous_questions FOR SELECT USING (true);

CREATE POLICY "Admins/Instructors can manage questions" 
ON public.previous_questions FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')));

-- 5. Study Notes Table
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_notes_all" ON public.study_notes;
CREATE POLICY "Notes are viewable by everyone" 
ON public.study_notes FOR SELECT USING (true);

CREATE POLICY "Admins/Instructors can manage notes" 
ON public.study_notes FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')));

-- 6. Exam Suggestions Table
ALTER TABLE public.exam_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exam_suggestions_all" ON public.exam_suggestions;
CREATE POLICY "Suggestions are viewable by everyone" 
ON public.exam_suggestions FOR SELECT USING (true);

CREATE POLICY "Admins/Instructors can manage suggestions" 
ON public.exam_suggestions FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')));

-- 7. Solved Answers Table
ALTER TABLE public.solved_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "solved_answers_all" ON public.solved_answers;
CREATE POLICY "Solved answers are viewable by everyone" 
ON public.solved_answers FOR SELECT USING (true);

CREATE POLICY "Admins/Instructors can manage solved answers" 
ON public.solved_answers FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')));
