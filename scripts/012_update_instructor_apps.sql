-- Update instructor_applications table with more detailed fields
ALTER TABLE public.instructor_applications 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS portfolio_link TEXT;
