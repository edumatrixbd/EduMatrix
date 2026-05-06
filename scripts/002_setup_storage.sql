-- Insert the 'study-materials' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable Row Level Security on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to the 'study-materials' bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'study-materials');

-- Allow authenticated users to upload files to the 'study-materials' bucket
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'study-materials' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'study-materials' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'study-materials' AND auth.role() = 'authenticated');
