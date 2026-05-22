-- Migration: public university logo storage

INSERT INTO storage.buckets (id, name, public)
VALUES ('university-logos', 'university-logos', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

DROP POLICY IF EXISTS "University logos are publicly readable" ON storage.objects;
CREATE POLICY "University logos are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'university-logos');

DROP POLICY IF EXISTS "Authenticated users can upload university logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload university logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'university-logos'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can update university logos" ON storage.objects;
CREATE POLICY "Authenticated users can update university logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'university-logos'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'university-logos'
  AND auth.role() = 'authenticated'
);
