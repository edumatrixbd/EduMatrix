-- Migration 070: Add active boolean to courses and academic_batches
-- Ensures consistency across the institutional hierarchy

DO $$
BEGIN
  -- academic_batches: add active column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'academic_batches' AND column_name = 'active'
  ) THEN
    ALTER TABLE public.academic_batches ADD COLUMN active BOOLEAN DEFAULT true;
    -- Sync from status column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'academic_batches' AND column_name = 'status') THEN
        UPDATE public.academic_batches SET active = (status = 'active') WHERE status IS NOT NULL;
    END IF;
  END IF;

  -- courses: add active column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'active'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN active BOOLEAN DEFAULT true;
    -- Sync from status column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'status') THEN
        UPDATE public.courses SET active = (status = 'active') WHERE status IS NOT NULL;
    END IF;
  END IF;

  -- courses: ensure university_id, department_id, batch_id are present (they should be, but let's be safe)
  -- These were added in script 050, so we just ensure RLS and indices
END $$;

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_courses_uni_dept_batch ON public.courses(university_id, department_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_uni_dept ON public.academic_batches(university_id, department_id);

-- RLS: Allow everyone to select active courses
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
CREATE POLICY "Anyone can view active courses" ON public.courses
  FOR SELECT USING (active = true);

-- RLS: Admin full access
DROP POLICY IF EXISTS "Admins have full access to courses" ON public.courses;
CREATE POLICY "Admins have full access to courses" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
    )
  );
