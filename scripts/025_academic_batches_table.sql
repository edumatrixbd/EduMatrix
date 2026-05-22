-- Migration: Final Schema Resolution - Academic Batches
-- 025_academic_batches_table.sql

-- 1. Create a brand new table with a unique name to avoid any schema cache conflicts
CREATE TABLE IF NOT EXISTS public.academic_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch TEXT NOT NULL,
    university TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(batch, university, department)
);

-- 2. Enable RLS
ALTER TABLE public.academic_batches ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Admins can manage academic batches" ON public.academic_batches;
CREATE POLICY "Admins can manage academic batches"
    ON public.academic_batches
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'superadmin')
        )
    );

DROP POLICY IF EXISTS "Anyone can view active academic batches" ON public.academic_batches;
CREATE POLICY "Anyone can view active academic batches"
    ON public.academic_batches
    FOR SELECT
    USING (status = 'active');

-- 4. Seed initial batches
INSERT INTO public.academic_batches (batch, university, department)
VALUES 
    ('68', 'DIU', 'CSE'),
    ('69', 'DIU', 'CSE'),
    ('70', 'DIU', 'CSE'),
    ('71', 'DIU', 'CSE'),
    ('72', 'DIU', 'CSE')
ON CONFLICT (batch, university, department) DO NOTHING;
