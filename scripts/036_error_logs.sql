-- Migration: Production Error Logging System
-- 036_error_logs.sql

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'error_logs') THEN
        CREATE TABLE public.error_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            error_type TEXT NOT NULL, -- 'video_load', 'hls_error', 'token_expiry', 'payment_failed', 'api_error', 'r2_error', 'auth_error'
            page_url TEXT,
            message TEXT,
            details JSONB,
            status TEXT DEFAULT 'open', -- 'open', 'resolved'
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
        
        CREATE INDEX idx_error_logs_type ON public.error_logs(error_type);
        CREATE INDEX idx_error_logs_status ON public.error_logs(status);
        CREATE INDEX idx_error_logs_created ON public.error_logs(created_at DESC);
    END IF;
END $$;
