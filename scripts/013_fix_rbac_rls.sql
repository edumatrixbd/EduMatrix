-- Fix RLS policies for instructor_applications
ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own application
DROP POLICY IF EXISTS "Users can insert own application" ON public.instructor_applications;
CREATE POLICY "Users can insert own application" ON public.instructor_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own application
DROP POLICY IF EXISTS "Users view own app" ON public.instructor_applications;
CREATE POLICY "Users view own app" ON public.instructor_applications FOR SELECT USING (auth.uid() = user_id);

-- Allow admins full access
DROP POLICY IF EXISTS "Admins view all apps" ON public.instructor_applications;
CREATE POLICY "Admins view all apps" ON public.instructor_applications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin'))
);

-- Ensure profiles can be updated by the owner (for status updates)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
