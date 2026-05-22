-- Migration: Repair Batch Management System
-- 021_repair_batches.sql

DO $$ 
BEGIN
    -- 1. Ensure batches table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'batches') THEN
        CREATE TABLE public.batches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            batch_name TEXT NOT NULL,
            university TEXT NOT NULL,
            department TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            UNIQUE(batch_name, university, department)
        );
    END IF;

    -- 2. Ensure RLS is enabled
    ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

    -- 3. Ensure Policies exist (Drop and recreate to be sure)
    DROP POLICY IF EXISTS "Admins can manage batches" ON public.batches;
    CREATE POLICY "Admins can manage batches"
        ON public.batches
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin', 'super_admin', 'superadmin')
            )
        );

    DROP POLICY IF EXISTS "Anyone can view active batches" ON public.batches;
    CREATE POLICY "Anyone can view active batches"
        ON public.batches
        FOR SELECT
        USING (status = 'active');

    -- 4. Seed initial batches if missing
    INSERT INTO public.batches (batch_name, university, department)
    VALUES 
        ('68', 'DIU', 'CSE'),
        ('69', 'DIU', 'CSE'),
        ('70', 'DIU', 'CSE'),
        ('71', 'DIU', 'CSE'),
        ('72', 'DIU', 'CSE')
    ON CONFLICT (batch_name, university, department) DO NOTHING;

END $$;
