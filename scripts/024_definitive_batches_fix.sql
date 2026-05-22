-- Migration: Definitive Batch System Fix
-- 024_definitive_batches_fix.sql

-- 1. Ensure the table is named 'batches' and has 'batch' column
DO $$ 
BEGIN
    -- If table doesn't exist, create it
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'batches') THEN
        CREATE TABLE public.batches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            batch TEXT NOT NULL,
            university TEXT NOT NULL,
            department TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            UNIQUE(batch, university, department)
        );
    ELSE
        -- Table exists, check for batch_name and rename if found
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'batches' AND column_name = 'batch_name'
        ) THEN
            ALTER TABLE public.batches RENAME COLUMN batch_name TO batch;
        END IF;

        -- Ensure batch column exists (if neither batch nor batch_name were there)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'batches' AND column_name = 'batch'
        ) THEN
            ALTER TABLE public.batches ADD COLUMN batch TEXT NOT NULL DEFAULT '68';
        END IF;
    END IF;
END $$;

-- 2. Reset Policies
DROP POLICY IF EXISTS "Admins can manage batches" ON public.batches;
CREATE POLICY "Admins can manage batches" ON public.batches FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'superadmin'))
);

DROP POLICY IF EXISTS "Anyone can view active batches" ON public.batches;
CREATE POLICY "Anyone can view active batches" ON public.batches FOR SELECT USING (status = 'active');

-- 3. Seed
INSERT INTO public.batches (batch, university, department)
VALUES ('68', 'DIU', 'CSE'), ('69', 'DIU', 'CSE'), ('70', 'DIU', 'CSE'), ('71', 'DIU', 'CSE'), ('72', 'DIU', 'CSE')
ON CONFLICT (batch, university, department) DO NOTHING;
