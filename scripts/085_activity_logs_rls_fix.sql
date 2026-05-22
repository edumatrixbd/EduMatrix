-- Migration: Fix recursive RLS policy on activity_logs
-- 085_activity_logs_rls_fix.sql

DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.activity_logs;

CREATE POLICY "Admins can insert activity logs" ON public.activity_logs
FOR INSERT TO authenticated
WITH CHECK (admin_id = auth.uid());
