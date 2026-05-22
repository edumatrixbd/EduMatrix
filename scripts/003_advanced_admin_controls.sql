-- Update students table with role, plan, and block status
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- Update study_notes and solved_answers with category
ALTER TABLE public.study_notes 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'mid'; -- 'mid', 'final'

ALTER TABLE public.solved_answers 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'mid'; -- 'mid', 'final'

-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_banner_text TEXT DEFAULT 'Welcome to tensionনাই! Join our exam preparation series now.',
  promo_banner_cta TEXT DEFAULT 'Join Now',
  show_promo_banner BOOLEAN DEFAULT TRUE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  contact_email TEXT DEFAULT 'support@tensionনাই.com',
  contact_phone TEXT DEFAULT '+880123456789',
  social_links JSONB DEFAULT '{"facebook": "#", "twitter": "#", "github": "#", "linkedin": "#"}'::JSONB,
  seo_title TEXT DEFAULT 'tensionনাই - tensionনাই Student Portal',
  seo_description TEXT DEFAULT 'Your one-stop destination for tensionনাই courses, notes, and exam preparation.',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default settings if not exists
INSERT INTO public.site_settings (id) 
SELECT gen_random_uuid() 
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings)
ON CONFLICT DO NOTHING;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'announcement', -- 'announcement', 'exam', 'content'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create study_zone_playlists table
CREATE TABLE IF NOT EXISTS public.study_zone_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.video_lectures(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'mid', 'final'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create content_views table for analytics
CREATE TABLE IF NOT EXISTS public.content_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'video', 'note', 'question', 'solved'
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create website_visits table if not exists (referenced in admin dashboard)
CREATE TABLE IF NOT EXISTS public.website_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_zone_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to read settings
DROP POLICY IF EXISTS "site_settings_read" ON public.site_settings;
CREATE POLICY "site_settings_read" ON public.site_settings FOR SELECT USING (true);

-- Allow admins to manage settings (restricted by app logic for now)
DROP POLICY IF EXISTS "site_settings_all_admin" ON public.site_settings;
CREATE POLICY "site_settings_all_admin" ON public.site_settings FOR ALL USING (true);

-- Notifications
DROP POLICY IF EXISTS "notifications_read" ON public.notifications;
CREATE POLICY "notifications_read" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "notifications_all_admin" ON public.notifications;
CREATE POLICY "notifications_all_admin" ON public.notifications FOR ALL USING (true);

-- Study Zone
DROP POLICY IF EXISTS "study_zone_playlists_read" ON public.study_zone_playlists;
CREATE POLICY "study_zone_playlists_read" ON public.study_zone_playlists FOR SELECT USING (true);

DROP POLICY IF EXISTS "study_zone_playlists_all_admin" ON public.study_zone_playlists;
CREATE POLICY "study_zone_playlists_all_admin" ON public.study_zone_playlists FOR ALL USING (true);

-- Content Views
DROP POLICY IF EXISTS "content_views_insert" ON public.content_views;
CREATE POLICY "content_views_insert" ON public.content_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "content_views_read_admin" ON public.content_views;
CREATE POLICY "content_views_read_admin" ON public.content_views FOR SELECT USING (true);

-- Website Visits
DROP POLICY IF EXISTS "website_visits_all" ON public.website_visits;
CREATE POLICY "website_visits_all" ON public.website_visits FOR ALL USING (true);
