-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- e.g. bkash, nagad, rocket, upay
    display_name TEXT NOT NULL, -- e.g. bKash, Nagad
    number TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access for payment_methods" ON payment_methods
    FOR SELECT USING (active = true);

-- Allow admin full access
CREATE POLICY "Allow admin full access for payment_methods" ON payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Seed initial data
INSERT INTO payment_methods (name, display_name, number, logo_url)
VALUES 
    ('bkash', 'bKash', '01977967580', '/payment/bkash.png'),
    ('nagad', 'Nagad', '01352467585', '/payment/nagad.png'),
    ('rocket', 'Rocket', '01842230442', '/payment/rocket.png'),
    ('upay', 'Upay', '01842230442', '/payment/upay.png')
ON CONFLICT (name) DO UPDATE 
SET number = EXCLUDED.number, logo_url = EXCLUDED.logo_url;
