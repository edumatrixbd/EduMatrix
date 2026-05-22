-- ============================================================
-- FULL SETUP: content_materials + hierarchy columns + indexes + RLS
-- Run this ONCE in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the unified content_materials table
CREATE TABLE IF NOT EXISTS public.content_materials (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    title         TEXT         NOT NULL,
    description   TEXT,
    type          TEXT         NOT NULL,
      -- Allowed values: 'video', 'note', 'previous_question', 'solved_answer', 'suggestion'
    course_id     UUID         REFERENCES public.courses(id)           ON DELETE CASCADE,
    batch_id      UUID         REFERENCES public.academic_batches(id)  ON DELETE SET NULL,
    university_id UUID         REFERENCES public.universities(id)      ON DELETE SET NULL,
    department_id UUID         REFERENCES public.departments(id)       ON DELETE SET NULL,
    file_key      TEXT,
    file_url      TEXT,
    uploaded_by   UUID         REFERENCES public.profiles(id)          ON DELETE SET NULL,
    active        BOOLEAN      DEFAULT true,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- 2. If the table already existed without some columns, add them safely
ALTER TABLE public.content_materials
    ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL;

ALTER TABLE public.content_materials
    ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.content_materials
    ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Indexes for fast hierarchy-based queries
CREATE INDEX IF NOT EXISTS idx_cm_university_id ON public.content_materials(university_id);
CREATE INDEX IF NOT EXISTS idx_cm_department_id ON public.content_materials(department_id);
CREATE INDEX IF NOT EXISTS idx_cm_batch_id      ON public.content_materials(batch_id);
CREATE INDEX IF NOT EXISTS idx_cm_course_id     ON public.content_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_cm_type          ON public.content_materials(type);
CREATE INDEX IF NOT EXISTS idx_cm_active        ON public.content_materials(active);
CREATE INDEX IF NOT EXISTS idx_cm_uploaded_by   ON public.content_materials(uploaded_by);

-- 4. Enable Row-Level Security
ALTER TABLE public.content_materials ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (drop first to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Allow public read access to active content_materials" ON public.content_materials;
DROP POLICY IF EXISTS "Allow full access to admins/instructors for content"  ON public.content_materials;

-- Students/public can read active content
CREATE POLICY "Allow public read access to active content_materials"
    ON public.content_materials
    FOR SELECT
    USING (active = true);

-- Admins & instructors get full CRUD
CREATE POLICY "Allow full access to admins/instructors for content"
    ON public.content_materials
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('superadmin', 'admin', 'instructor')
        )
    );
