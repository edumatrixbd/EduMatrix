-- Migration: Supabase Storage Setup for UniHub
-- 027_storage_setup.sql

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (already enabled by default in Supabase, but good to be sure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. DROP existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can upload study materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update study materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete study materials" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for study materials" ON storage.objects;

-- 4. Create Policies

-- a) Public Read Access
CREATE POLICY "Public read access for study materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'study-materials');

-- b) Admin Upload Access
CREATE POLICY "Admins can upload study materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'study-materials' AND 
    (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'super_admin', 'superadmin')
    ))
);

-- c) Admin Update Access
CREATE POLICY "Admins can update study materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'study-materials' AND 
    (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'super_admin', 'superadmin')
    ))
);

-- d) Admin Delete Access
CREATE POLICY "Admins can delete study materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'study-materials' AND 
    (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'super_admin', 'superadmin')
    ))
);
