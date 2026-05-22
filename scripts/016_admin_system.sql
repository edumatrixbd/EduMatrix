-- Migration: Admin Role System and Activity Logging
-- 016_admin_system.sql

-- 1. Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'APPROVE_INSTRUCTOR', 'CREATE_ADMIN', 'DELETE_USER'
    target_id UUID, -- ID of the student, instructor, or admin affected
    target_type TEXT, -- 'student', 'instructor', 'admin', 'payment'
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Add indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- 3. Update profiles role check if needed
-- Assuming profiles table already exists and handles roles 'student', 'instructor', 'admin', 'super_admin'

-- 4. Set up RLS for activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and super_admins can view logs
CREATE POLICY "Admins can view activity logs"
    ON public.activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'superadmin')
        )
    );

-- System can insert logs (via service role or security definer functions)
-- We'll use a security definer function to log actions
CREATE OR REPLACE FUNCTION public.log_activity(
    p_action TEXT,
    p_target_id UUID DEFAULT NULL,
    p_target_type TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.activity_logs (user_id, action, target_id, target_type, details)
    VALUES (auth.uid(), p_action, p_target_id, p_target_type, p_details)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
