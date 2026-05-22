-- Migration 079: Admin Permissions Schema

DO $$ 
BEGIN

    -- 1. Create admin_permissions table if not exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_permissions') THEN
        CREATE TABLE public.admin_permissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            permissions JSONB NOT NULL DEFAULT '{}',
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT unique_admin_permission UNIQUE (admin_id)
        );

        -- Enable RLS
        ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

        -- Policies for admin_permissions
        -- Allow authenticated admins to view permissions (they need to check their own/others)
        CREATE POLICY "Admins can view permissions" ON public.admin_permissions
            FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin')
                )
            );

        -- Allow super_admins to manage (insert/update/delete) permissions
        CREATE POLICY "Superadmins can manage permissions" ON public.admin_permissions
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role IN ('super_admin', 'superadmin')
                )
            );
            
    END IF;

END $$;
