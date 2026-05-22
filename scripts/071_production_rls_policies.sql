-- Migration 071: Production RLS policies
-- Apply after the schema/seed migrations. This replaces debug-era permissive
-- policies with launch-safe access for admin CRUD and cohort-scoped students.

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_instructor_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(coalesce(p.role, '')) = 'instructor'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_profile_cohort(
  target_university_id UUID,
  target_department_id UUID,
  target_batch_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.university_id = target_university_id
      AND p.department_id = target_department_id
      AND p.batch_id = target_batch_id
  );
$$;

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.previous_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solved_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow read universities" ON public.universities;
DROP POLICY IF EXISTS "allow_authenticated_read_universities" ON public.universities;
DROP POLICY IF EXISTS "production read universities" ON public.universities;
DROP POLICY IF EXISTS "production admin universities" ON public.universities;
CREATE POLICY "production read universities" ON public.universities
  FOR SELECT USING (coalesce(active, status = 'active', true));
CREATE POLICY "production admin universities" ON public.universities
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "allow read departments" ON public.departments;
DROP POLICY IF EXISTS "allow_authenticated_read_departments" ON public.departments;
DROP POLICY IF EXISTS "production read departments" ON public.departments;
DROP POLICY IF EXISTS "production admin departments" ON public.departments;
CREATE POLICY "production read departments" ON public.departments
  FOR SELECT USING (coalesce(active, status = 'active', true));
CREATE POLICY "production admin departments" ON public.departments
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "allow read batches" ON public.academic_batches;
DROP POLICY IF EXISTS "allow_authenticated_read_batches" ON public.academic_batches;
DROP POLICY IF EXISTS "production read batches" ON public.academic_batches;
DROP POLICY IF EXISTS "production admin batches" ON public.academic_batches;
CREATE POLICY "production read batches" ON public.academic_batches
  FOR SELECT USING (coalesce(active, status = 'active', true));
CREATE POLICY "production admin batches" ON public.academic_batches
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "production read semesters" ON public.semesters;
DROP POLICY IF EXISTS "production admin semesters" ON public.semesters;
CREATE POLICY "production read semesters" ON public.semesters
  FOR SELECT USING (coalesce(status, 'active') = 'active');
CREATE POLICY "production admin semesters" ON public.semesters
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
DROP POLICY IF EXISTS "Admins have full access to courses" ON public.courses;
DROP POLICY IF EXISTS "production read courses" ON public.courses;
DROP POLICY IF EXISTS "production admin courses" ON public.courses;
DROP POLICY IF EXISTS "production instructor courses" ON public.courses;
CREATE POLICY "production read courses" ON public.courses
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR instructor_id = auth.uid()
    OR (
      coalesce(active, status = 'active', true)
      AND public.has_profile_cohort(university_id, department_id, batch_id)
    )
  );
CREATE POLICY "production admin courses" ON public.courses
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "production instructor courses" ON public.courses
  FOR SELECT TO authenticated
  USING (public.is_instructor_user() AND instructor_id = auth.uid());

DROP POLICY IF EXISTS "production read profiles" ON public.profiles;
DROP POLICY IF EXISTS "production update own profile" ON public.profiles;
DROP POLICY IF EXISTS "production admin profiles" ON public.profiles;
CREATE POLICY "production read profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin_user());
CREATE POLICY "production update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
CREATE POLICY "production admin profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "production read videos" ON public.video_lectures;
DROP POLICY IF EXISTS "production admin videos" ON public.video_lectures;
CREATE POLICY "production read videos" ON public.video_lectures
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = video_lectures.course_id
        AND (c.instructor_id = auth.uid() OR public.has_profile_cohort(c.university_id, c.department_id, c.batch_id))
    )
  );
CREATE POLICY "production admin videos" ON public.video_lectures
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "production read previous questions" ON public.previous_questions;
DROP POLICY IF EXISTS "production admin previous questions" ON public.previous_questions;
CREATE POLICY "production read previous questions" ON public.previous_questions
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = previous_questions.course_id
        AND (c.instructor_id = auth.uid() OR public.has_profile_cohort(c.university_id, c.department_id, c.batch_id))
    )
  );
CREATE POLICY "production admin previous questions" ON public.previous_questions
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "production read study notes" ON public.study_notes;
DROP POLICY IF EXISTS "production admin study notes" ON public.study_notes;
CREATE POLICY "production read study notes" ON public.study_notes
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = study_notes.course_id
        AND (c.instructor_id = auth.uid() OR public.has_profile_cohort(c.university_id, c.department_id, c.batch_id))
    )
  );
CREATE POLICY "production admin study notes" ON public.study_notes
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "production read solved answers" ON public.solved_answers;
DROP POLICY IF EXISTS "production admin solved answers" ON public.solved_answers;
CREATE POLICY "production read solved answers" ON public.solved_answers
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = solved_answers.course_id
        AND (c.instructor_id = auth.uid() OR public.has_profile_cohort(c.university_id, c.department_id, c.batch_id))
    )
  );
CREATE POLICY "production admin solved answers" ON public.solved_answers
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "production read exam suggestions" ON public.exam_suggestions;
DROP POLICY IF EXISTS "production admin exam suggestions" ON public.exam_suggestions;
CREATE POLICY "production read exam suggestions" ON public.exam_suggestions
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user()
    OR (
      batch_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.batch_id = exam_suggestions.batch_id)
    )
    OR (
      course_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = exam_suggestions.course_id
          AND public.has_profile_cohort(c.university_id, c.department_id, c.batch_id)
      )
    )
  );
CREATE POLICY "production admin exam suggestions" ON public.exam_suggestions
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
