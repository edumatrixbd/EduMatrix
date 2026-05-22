
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SQL = `
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id) on delete set null,
  batch_id uuid references public.academic_batches(id) on delete set null,
  status text not null default 'pending_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users read own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'superadmin')
    )
  );
`;

async function runMigration() {
  console.log("Starting migration for subscriptions table...");
  
  // Try admin_run_sql or exec_sql
  const { data, error } = await supabase.rpc("admin_run_sql", { query: SQL });
  
  if (error) {
    console.error("Migration failed via admin_run_sql:", error);
    const { data: data2, error: error2 } = await supabase.rpc("exec_sql", { sql_query: SQL });
    if (error2) {
      console.error("Migration failed via exec_sql:", error2);
      process.exit(1);
    }
  }
  
  console.log("Migration successful!");
}

runMigration();
