create table if not exists public.material_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  material_type text not null,
  material_id text,
  page_url text,
  message text not null,
  status text default 'open',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.material_feedback enable row level security;

-- Drop existing policies if running multiple times
drop policy if exists "Students can insert own feedback" on public.material_feedback;
drop policy if exists "Students can view own feedback" on public.material_feedback;
drop policy if exists "Admins can view all feedback" on public.material_feedback;
drop policy if exists "Admins can update feedback" on public.material_feedback;

-- Student Policies
create policy "Students can insert own feedback"
on public.material_feedback for insert
with check (auth.uid() = user_id);

create policy "Students can view own feedback"
on public.material_feedback for select
using (auth.uid() = user_id);

-- Admin Policies
-- Note: Admin operations typically use service_role key which bypasses RLS,
-- but we define these just in case authenticated admin clients are used.
create policy "Admins can view all feedback"
on public.material_feedback for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'super_admin', 'superadmin')
  )
);

create policy "Admins can update feedback"
on public.material_feedback for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'super_admin', 'superadmin')
  )
);
