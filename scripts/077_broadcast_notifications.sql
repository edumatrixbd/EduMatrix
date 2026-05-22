-- Migration 077: Broadcast Notifications Schema

DO $$ 
BEGIN

    -- 1. Modify notifications table to support broadcast targets
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'target_role') THEN
        ALTER TABLE public.notifications 
        ADD COLUMN target_role TEXT DEFAULT 'all',
        ADD COLUMN category TEXT,
        ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- 2. Create notification_reads tracking table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_reads') THEN
        CREATE TABLE public.notification_reads (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
            read_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, notification_id)
        );

        -- Enable RLS for notification_reads
        ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

        -- Policies for notification_reads
        CREATE POLICY "Users can manage their own read receipts" ON public.notification_reads
        FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- 3. Update Notifications RLS to allow global viewing based on target_role
    -- Drop the restrictive previous policy
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    
    -- Anyone authenticated can read targeted or 'all' notifications
    CREATE POLICY "Users can view targeted notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (
        target_role = 'all' OR 
        (target_role = 'students' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')) OR
        (target_role = 'instructors' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'instructor')) OR
        (target_role = 'admins' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin'))) OR
        user_id = auth.uid()
    );

    -- Admins can manage notifications
    DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
    CREATE POLICY "Admins can manage notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin')
        )
    );

END $$;
