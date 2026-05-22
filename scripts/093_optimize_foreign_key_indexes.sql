-- ============================================================
-- Migration 093: Add High-Performance Indexes
-- Fixes missing BTREE indexes on highly queried foreign keys
-- which would cause sequential scans at high user volumes.
-- ============================================================

-- 1. Profiles Table Indexes (Used heavily in authentication and RLS)
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON public.profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_batch_id ON public.profiles(batch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. Courses Table Indexes (Used heavily in course lists and Study Zone filtering)
CREATE INDEX IF NOT EXISTS idx_courses_university_id ON public.courses(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON public.courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_batch_id ON public.courses(batch_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);

-- 3. Content Materials Indexes (Used heavily for playlist fetching per course/batch)
CREATE INDEX IF NOT EXISTS idx_content_course_id ON public.content_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_content_batch_id ON public.content_materials(batch_id);
CREATE INDEX IF NOT EXISTS idx_content_university_id ON public.content_materials(university_id);
CREATE INDEX IF NOT EXISTS idx_content_department_id ON public.content_materials(department_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON public.content_materials(type);

-- 4. Activity Logs Indexes (Used for analytics and reporting)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- 5. Subscriptions Indexes (Used in middleware/RLS for fast access checks)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 6. Batch Subscriptions Indexes (Used in RLS for institutional checks)
CREATE INDEX IF NOT EXISTS idx_batch_subscriptions_batch_id ON public.batch_subscriptions(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_subscriptions_status ON public.batch_subscriptions(status);
