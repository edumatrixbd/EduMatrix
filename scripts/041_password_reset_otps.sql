-- Create password_reset_otps table
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    hashed_otp TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_verified ON password_reset_otps(verified);

-- RLS Policies (Optional but good practice)
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table by default
CREATE POLICY "Service role access only" ON password_reset_otps
    FOR ALL
    USING (auth.role() = 'service_role');
