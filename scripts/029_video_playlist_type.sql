-- Migration: Add playlist_type to video_lectures
-- 029_video_playlist_type.sql

ALTER TABLE public.video_lectures
ADD COLUMN IF NOT EXISTS playlist_type text CHECK (playlist_type IN ('mid', 'final'));

-- Default existing videos to 'mid' if any
UPDATE public.video_lectures SET playlist_type = 'mid' WHERE playlist_type IS NULL;
