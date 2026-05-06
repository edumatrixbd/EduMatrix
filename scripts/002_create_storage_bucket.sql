-- Create a storage bucket named "avatars"
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Set up Row Level Security (RLS) for the storage bucket

-- 1. Allow public access to view avatars
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- 2. Allow authenticated users to upload avatars
CREATE POLICY "Anyone can upload an avatar." 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 3. Allow users to update their own avatars
CREATE POLICY "Anyone can update their own avatar." 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'avatars' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 4. Allow users to delete their own avatars
CREATE POLICY "Anyone can delete their own avatar." 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
