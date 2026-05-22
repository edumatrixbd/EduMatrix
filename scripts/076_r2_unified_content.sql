-- Migration: Unified Content Storage (R2) & Database-Driven Analytics

-- 1. Unified Content Materials
CREATE TABLE IF NOT EXISTS public.content_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'video', 'pdf', 'note', 'suggestion', 'previous_question', 'solved_answer'
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.academic_batches(id) ON DELETE SET NULL,
    file_key TEXT NOT NULL,
    file_url TEXT,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT true
);

-- 2. Advanced Analytics Tables
CREATE TABLE IF NOT EXISTS public.sessions (
    session_id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT REFERENCES public.sessions(session_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.material_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT REFERENCES public.sessions(session_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    material_id UUID REFERENCES public.content_materials(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.content_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_views ENABLE ROW LEVEL SECURITY;

-- Allow read access to active content for authenticated users
CREATE POLICY "Allow public read access to active content_materials" ON public.content_materials
    FOR SELECT USING (active = true);

-- Allow full access to admins/instructors
CREATE POLICY "Allow full access to admins/instructors for content" ON public.content_materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('superadmin', 'admin', 'instructor')
        )
    );

-- Anyone can insert into analytics tables (to track public views)
CREATE POLICY "Allow insert for sessions" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for sessions" ON public.sessions FOR UPDATE USING (true);
CREATE POLICY "Allow insert for page_views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for material_views" ON public.material_views FOR INSERT WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Allow admins to read analytics sessions" ON public.sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('superadmin', 'admin'))
);
CREATE POLICY "Allow admins to read analytics page_views" ON public.page_views FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('superadmin', 'admin'))
);
CREATE POLICY "Allow admins to read analytics material_views" ON public.material_views FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('superadmin', 'admin'))
);
