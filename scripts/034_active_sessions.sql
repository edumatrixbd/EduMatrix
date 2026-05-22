-- Migration: Concurrent Session Control
-- 034_active_sessions.sql

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'active_sessions') THEN
        CREATE TABLE public.active_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            session_id TEXT NOT NULL,
            device_info TEXT,
            last_active_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            status TEXT DEFAULT 'active', -- 'active', 'deactivated'
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
        
        CREATE INDEX idx_active_sessions_user_status ON public.active_sessions(user_id, status);
    END IF;
END $$;
