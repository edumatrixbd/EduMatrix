-- Migration: Force Reset Batch Management
-- 023_force_reset_batches.sql

-- 1. Drop existing table to resolve schema confusion
DROP TABLE IF EXISTS public.batches CASCADE;

-- 2. Create batches table with the correct 'batch' column name from the start
CREATE TABLE public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch TEXT NOT NULL,
    university TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(batch, university, department)
);

-- 3. Enable RLS
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
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

CREATE POLICY "Anyone can view active batches"
    ON public.batches
    FOR SELECT
    USING (status = 'active');

-- 5. Seed initial batches
INSERT INTO public.batches (batch, university, department)
VALUES 
    ('68', 'DIU', 'CSE'),
    ('69', 'DIU', 'CSE'),
    ('70', 'DIU', 'CSE'),
    ('71', 'DIU', 'CSE'),
    ('72', 'DIU', 'CSE');
