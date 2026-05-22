-- ============================================================
-- Migration 092: Enable RLS on ALL tables + production policies
-- Fixes the Supabase security advisory: tables publicly accessible
-- because RLS was disabled during debugging (055, 066 migrations).
--
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1 — Shared helper functions (idempotent)
-- ─────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────
-- STEP 2 — Enable RLS on every table that may have it OFF
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.universities              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_batches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_materials         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payment_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payments           ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- STEP 3 — universities
-- Any visitor can read active universities (needed for signup/onboarding).
-- Only admins can write.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "production read universities"  ON public.universities;
DROP POLICY IF EXISTS "production admin universities" ON public.universities;
DROP POLICY IF EXISTS "allow read universities"       ON public.universities;
DROP POLICY IF EXISTS "allow_authenticated_read_universities" ON public.universities;
DROP POLICY IF EXISTS "public read universities"      ON public.universities;
DROP POLICY IF EXISTS "Anyone can view active universities" ON public.universities;

-- Authenticated users can read active universities (required for onboarding dropdowns)
CREATE POLICY "universities: authenticated read"
  ON public.universities
  FOR SELECT
  TO authenticated
  USING (coalesce(active, true));

-- Admins have full control
CREATE POLICY "universities: admin all"
  ON public.universities
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ─────────────────────────────────────────────────────────────
-- STEP 4 — departments
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "production read departments"  ON public.departments;
DROP POLICY IF EXISTS "production admin departments" ON public.departments;
DROP POLICY IF EXISTS "allow read departments"       ON public.departments;
DROP POLICY IF EXISTS "allow_authenticated_read_departments" ON public.departments;

CREATE POLICY "departments: authenticated read"
  ON public.departments
  FOR SELECT
  TO authenticated
  USING (coalesce(active, true));

CREATE POLICY "departments: admin all"
  ON public.departments
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ─────────────────────────────────────────────────────────────
-- STEP 5 — academic_batches
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "production read batches"  ON public.academic_batches;
DROP POLICY IF EXISTS "production admin batches" ON public.academic_batches;
DROP POLICY IF EXISTS "allow read batches"       ON public.academic_batches;
DROP POLICY IF EXISTS "allow_authenticated_read_batches" ON public.academic_batches;

CREATE POLICY "batches: authenticated read"
  ON public.academic_batches
  FOR SELECT
  TO authenticated
  USING (coalesce(active, true));

CREATE POLICY "batches: admin all"
  ON public.academic_batches
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ─────────────────────────────────────────────────────────────
-- STEP 6 — semesters
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "production read semesters"  ON public.semesters;
DROP POLICY IF EXISTS "production admin semesters" ON public.semesters;

CREATE POLICY "semesters: authenticated read"
  ON public.semesters
  FOR SELECT
  TO authenticated
  USING (coalesce(status, 'active') = 'active');

CREATE POLICY "semesters: admin all"
  ON public.semesters
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ─────────────────────────────────────────────────────────────
-- STEP 7 — courses
-- Students see only courses in their cohort.
-- Instructors see their own courses.
-- Admins see everything.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "production read courses"       ON public.courses;
DROP POLICY IF EXISTS "production admin courses"      ON public.courses;
DROP POLICY IF EXISTS "production instructor courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
DROP POLICY IF EXISTS "Admins have full access to courses" ON public.courses;

-- Note: courses.instructor is a TEXT name column, not a UUID.
-- Instructors are identified by role; admins manage all courses.
CREATE POLICY "courses: student read"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_user()
    OR public.is_instructor_user()
    OR (
      coalesce(active, true)
      AND public.has_profile_cohort(university_id, department_id, batch_id)
    )
  );

CREATE POLICY "courses: admin all"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "courses: instructor manage"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (public.is_instructor_user())
  WITH CHECK (public.is_instructor_user());

-- ─────────────────────────────────────────────────────────────
-- STEP 8 — content_materials
-- Students read active content within their cohort.
-- Admins/instructors have full control.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow public read access to active content_materials" ON public.content_materials;
DROP POLICY IF EXISTS "Allow full access to admins/instructors for content"  ON public.content_materials;
DROP POLICY IF EXISTS "Allow read for authenticated users"   ON public.content_materials;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.content_materials;
DROP POLICY IF EXISTS "Allow update"  ON public.content_materials;
DROP POLICY IF EXISTS "Allow delete"  ON public.content_materials;

-- Students can read active content scoped to their cohort
CREATE POLICY "content_materials: student read"
  ON public.content_materials
  FOR SELECT
  TO authenticated
  USING (
    coalesce(active, true)
    AND (
      public.is_admin_user()
      OR public.is_instructor_user()
      OR (
        -- Course-scoped: student belongs to the course's cohort
        course_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.courses c
          WHERE c.id = content_materials.course_id
            AND public.has_profile_cohort(c.university_id, c.department_id, c.batch_id)
        )
      )
      OR (
        -- Batch-scoped without a course: student belongs to the batch
        course_id IS NULL
        AND batch_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.batch_id = content_materials.batch_id
        )
      )
    )
  );

-- Admins have full CRUD
CREATE POLICY "content_materials: admin all"
  ON public.content_materials
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Instructors manage content they uploaded (instructor column is TEXT, not UUID)
CREATE POLICY "content_materials: instructor manage own"
  ON public.content_materials
  FOR ALL
  TO authenticated
  USING (
    public.is_instructor_user()
    AND uploaded_by = auth.uid()
  )
  WITH CHECK (
    public.is_instructor_user()
    AND uploaded_by = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────
-- STEP 9 — profiles
-- Users can read/update only their own profile.
-- Admins can manage all profiles.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "production read profiles"        ON public.profiles;
DROP POLICY IF EXISTS "production update own profile"   ON public.profiles;
DROP POLICY IF EXISTS "production admin profiles"       ON public.profiles;

CREATE POLICY "profiles: read own or admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin_user());

CREATE POLICY "profiles: update own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: admin all"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ─────────────────────────────────────────────────────────────
-- STEP 10 — activity_logs
-- Only admins can insert or read logs.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can view activity logs"   ON public.activity_logs;

CREATE POLICY "activity_logs: admin insert"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user());

CREATE POLICY "activity_logs: admin select"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- ─────────────────────────────────────────────────────────────
-- STEP 11 — subscriptions
-- Users see only their own subscription row.
-- Admins see everything.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;

CREATE POLICY "subscriptions: read own"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "subscriptions: admin all"
  ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ─────────────────────────────────────────────────────────────
-- STEP 12 — subscription_plans
-- Any authenticated user can read plans (required for billing page).
-- Only admins can write.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;

CREATE POLICY "subscription_plans: authenticated read"
  ON public.subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "subscription_plans: admin all"
  ON public.subscription_plans
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ─────────────────────────────────────────────────────────────
-- STEP 13 — batch_subscriptions
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "batch_subscriptions: authenticated read" ON public.batch_subscriptions;

CREATE POLICY "batch_subscriptions: authenticated read"
  ON public.batch_subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "batch_subscriptions: admin all"
  ON public.batch_subscriptions
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ─────────────────────────────────────────────────────────────
-- STEP 14 — manual_payment_requests
-- Undoes the temporary 076 disable. Users see/submit their own,
-- admins manage all.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their own manual payment requests"   ON public.manual_payment_requests;
DROP POLICY IF EXISTS "Users can insert their own manual payment requests" ON public.manual_payment_requests;
DROP POLICY IF EXISTS "Admins can manage all manual payment requests"      ON public.manual_payment_requests;

CREATE POLICY "manual_payment_requests: read own"
  ON public.manual_payment_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "manual_payment_requests: insert own"
  ON public.manual_payment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "manual_payment_requests: admin all"
  ON public.manual_payment_requests
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ─────────────────────────────────────────────────────────────
-- STEP 15 — manual_payments (admin-created payment records)
-- Only admins read/write. Students don't interact directly.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "manual_payments: admin all" ON public.manual_payments;

CREATE POLICY "manual_payments: admin all"
  ON public.manual_payments
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ─────────────────────────────────────────────────────────────
-- Done.
-- All tables now enforce RLS. Public (anon) access is blocked.
-- service_role bypasses RLS server-side — keep it OUT of the frontend.
-- ─────────────────────────────────────────────────────────────
