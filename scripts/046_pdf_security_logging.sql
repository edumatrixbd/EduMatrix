-- Migration: Secure PDF Viewer Tracking
-- 046_pdf_security_logging.sql

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pdf_access_logs') THEN
        CREATE TABLE public.pdf_access_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            pdf_id UUID NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            opened_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );

        -- Index for security analysis
        CREATE INDEX idx_pdf_access_user ON public.pdf_access_logs(user_id);
        CREATE INDEX idx_pdf_access_pdf ON public.pdf_access_logs(pdf_id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.pdf_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view pdf logs" ON public.pdf_access_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
);
CREATE POLICY "Users can insert their own logs" ON public.pdf_access_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
