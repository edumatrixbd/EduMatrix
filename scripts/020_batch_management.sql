-- Migration: Batch Management System
-- 020_batch_management.sql

-- 1. Create batches table
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name TEXT NOT NULL, -- e.g., '68', '69'
    university TEXT NOT NULL, -- e.g., 'DIU'
    department TEXT NOT NULL, -- e.g., 'CSE'
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(batch_name, university, department)
);

-- 2. Enable RLS
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
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

-- 4. Seed initial batches for DIU CSE
INSERT INTO public.batches (batch_name, university, department)
VALUES 
    ('68', 'DIU', 'CSE'),
    ('69', 'DIU', 'CSE'),
    ('70', 'DIU', 'CSE'),
    ('71', 'DIU', 'CSE'),
    ('72', 'DIU', 'CSE')
ON CONFLICT DO NOTHING;
