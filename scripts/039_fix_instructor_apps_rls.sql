-- Consolidated Fix: Instructor Applications Table
-- 039_fix_instructor_apps_rls.sql

-- 1. Relax Constraints & Schema Updates
-- Allow user_id to be NULL for guest applicants
ALTER TABLE public.instructor_applications 
ALTER COLUMN user_id DROP NOT NULL;

-- Ensure all required columns exist with requested names
ALTER TABLE public.instructor_applications ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.instructor_applications ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE public.instructor_applications ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.instructor_applications ADD COLUMN IF NOT EXISTS expertise TEXT;
ALTER TABLE public.instructor_applications ADD COLUMN IF NOT EXISTS experience TEXT;

-- Rename portfolio_link to portfolio_url or ensure portfolio_url exists
DO $$ 
BEGIN
  -- If portfolio_url already exists, just make sure portfolio_link is gone
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='instructor_applications' AND column_name='portfolio_url') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='instructor_applications' AND column_name='portfolio_link') THEN
      ALTER TABLE public.instructor_applications DROP COLUMN portfolio_link;
    END IF;
  -- If portfolio_link exists but portfolio_url doesn't, rename it
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='instructor_applications' AND column_name='portfolio_link') THEN
    ALTER TABLE public.instructor_applications RENAME COLUMN portfolio_link TO portfolio_url;
  -- If neither exists, create portfolio_url
  ELSE
    ALTER TABLE public.instructor_applications ADD COLUMN portfolio_url TEXT;
  END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;

-- 3. Clean up existing policies
DROP POLICY IF EXISTS "Enable insert for all" ON public.instructor_applications;
DROP POLICY IF EXISTS "Enable select for owners" ON public.instructor_applications;
DROP POLICY IF EXISTS "Enable all for admins" ON public.instructor_applications;
DROP POLICY IF EXISTS "Anyone can submit application" ON public.instructor_applications;
DROP POLICY IF EXISTS "Admins can view all" ON public.instructor_applications;
DROP POLICY IF EXISTS "Users can view own" ON public.instructor_applications;
DROP POLICY IF EXISTS "Admins can manage all" ON public.instructor_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.instructor_applications;
DROP POLICY IF EXISTS "Admins view all apps" ON public.instructor_applications;
DROP POLICY IF EXISTS "Enable full access for admins" ON public.instructor_applications;
DROP POLICY IF EXISTS "Users view own app" ON public.instructor_applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON public.instructor_applications;
DROP POLICY IF EXISTS "Users can insert own application" ON public.instructor_applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.instructor_applications;

-- 4. Create robust policies
-- INSERT: Anyone can submit a 'pending' application
CREATE POLICY "Anyone can submit application" 
ON public.instructor_applications 
FOR INSERT 
WITH CHECK (status = 'pending');

-- SELECT: Admins see everything, users see their own
CREATE POLICY "Admins can view all" 
ON public.instructor_applications 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR role = 'super_admin' OR role = 'superadmin')
    )
);

CREATE POLICY "Users can view own" 
ON public.instructor_applications 
FOR SELECT 
USING (
    (auth.uid() = user_id) OR 
    (auth.jwt() ->> 'email' = email)
);

-- UPDATE/DELETE: Only admins
CREATE POLICY "Admins can manage all" 
ON public.instructor_applications 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR role = 'super_admin' OR role = 'superadmin')
    )
);

-- 5. Grant basic permissions
GRANT ALL ON public.instructor_applications TO authenticated;
GRANT INSERT ON public.instructor_applications TO anon;
GRANT SELECT ON public.instructor_applications TO anon; -- Allow anon to select (needed for some frontend checks)
