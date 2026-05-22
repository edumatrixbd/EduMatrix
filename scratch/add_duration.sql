ALTER TABLE public.content_materials ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE public.content_materials ADD COLUMN IF NOT EXISTS playlist_type TEXT;
ALTER TABLE public.content_materials ADD COLUMN IF NOT EXISTS category TEXT;
