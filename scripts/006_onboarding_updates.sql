-- Update students table to support onboarding
ALTER TABLE public.students ALTER COLUMN registration_number DROP NOT NULL;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS batch TEXT;

-- Create a trigger to automatically create a student record when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.students (id, email, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
