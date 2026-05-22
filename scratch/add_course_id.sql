
import { createAdminClient } from "@/lib/supabase/admin";

const SQL = `
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
          AND column_name = 'course_id'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;
    END IF;
END $$;
`;

// This is just for documentation of what needs to run.
// I will try to run it via an API call to a temporary route if I can't run it here.
