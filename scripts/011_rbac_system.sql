-- Implement Role-Based Access Control (RBAC) System
-- Roles: super_admin, admin, instructor, student

DO $$ 
BEGIN
    -- 1. Create instructor_applications table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'instructor_applications') THEN
        CREATE TABLE public.instructor_applications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            expertise TEXT NOT NULL,
            experience TEXT,
            status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
            admin_note TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
    END IF;

    -- 2. Add permissions to profiles table
    -- super_admin: Full access
    -- admin: Limited access
    -- instructor: Manage own content
    -- student: Access content
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'permissions') THEN
        ALTER TABLE public.profiles ADD COLUMN permissions JSONB DEFAULT '[]'::JSONB;
    END IF;

    -- 3. Add instructor_status to profiles
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'instructor_status') THEN
        ALTER TABLE public.profiles ADD COLUMN instructor_status TEXT DEFAULT 'none'; -- 'none', 'pending', 'approved', 'rejected'
    END IF;

END $$;

-- 4. Enable RLS on applications
ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;

-- 5. Policies for instructor_applications
DROP POLICY IF EXISTS "Users can view their own applications" ON public.instructor_applications;
CREATE POLICY "Users can view their own applications" ON public.instructor_applications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own applications" ON public.instructor_applications;
CREATE POLICY "Users can insert their own applications" ON public.instructor_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all applications" ON public.instructor_applications;
CREATE POLICY "Admins can view all applications" ON public.instructor_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );
