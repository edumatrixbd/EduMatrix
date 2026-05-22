-- Migration: Align batches table schema
-- 022_align_batches_schema.sql

DO $$ 
BEGIN
    -- 1. Rename batch_name to batch for consistency across the platform
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'batches' AND column_name = 'batch_name'
    ) THEN
        ALTER TABLE public.batches RENAME COLUMN batch_name TO batch;
    END IF;

    -- 2. Ensure the column is TEXT and NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'batches' AND column_name = 'batch'
    ) THEN
        ALTER TABLE public.batches ALTER COLUMN batch SET NOT NULL;
    END IF;

END $$;
