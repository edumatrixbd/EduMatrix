-- Relax RLS for instructor_applications to allow new applicants to submit
ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a pending application
DROP POLICY IF EXISTS "Anyone can submit application" ON public.instructor_applications;
CREATE POLICY "Anyone can submit application" ON public.instructor_applications FOR INSERT WITH CHECK (status = 'pending');

-- Maintain strict viewing policies
DROP POLICY IF EXISTS "Users view own app" ON public.instructor_applications;
CREATE POLICY "Users view own app" ON public.instructor_applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all apps" ON public.instructor_applications;
CREATE POLICY "Admins view all apps" ON public.instructor_applications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin'))
);
