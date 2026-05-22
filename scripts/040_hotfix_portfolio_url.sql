-- Hotfix: Ensure portfolio_url column exists safely
-- 040_hotfix_portfolio_url.sql

DO $$ 
BEGIN
  -- 1. If portfolio_url already exists, just cleanup portfolio_link if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='instructor_applications' AND column_name='portfolio_url') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='instructor_applications' AND column_name='portfolio_link') THEN
      ALTER TABLE public.instructor_applications DROP COLUMN portfolio_link;
    END IF;
  -- 2. If portfolio_link exists but portfolio_url doesn't, rename it
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='instructor_applications' AND column_name='portfolio_link') THEN
    ALTER TABLE public.instructor_applications RENAME COLUMN portfolio_link TO portfolio_url;
  -- 3. If neither exists, create portfolio_url
  ELSE
    ALTER TABLE public.instructor_applications ADD COLUMN portfolio_url TEXT;
  END IF;
END $$;

-- 4. Ensure other requested columns exist
ALTER TABLE public.instructor_applications ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.instructor_applications ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE public.instructor_applications ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.instructor_applications ADD COLUMN IF NOT EXISTS expertise TEXT;
ALTER TABLE public.instructor_applications ADD COLUMN IF NOT EXISTS experience TEXT;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
