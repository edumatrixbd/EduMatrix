-- Migration: Add hls_url to video_lectures
-- 030_video_hls_support.sql

ALTER TABLE public.video_lectures
ADD COLUMN IF NOT EXISTS hls_url text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_lectures_hls ON public.video_lectures(hls_url) WHERE hls_url IS NOT NULL;
