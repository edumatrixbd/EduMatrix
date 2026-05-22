-- Temporary test: Ensure RLS is not blocking reads
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- Proper RLS implementation
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;

-- Create the new policy allowing users to select only their own subscriptions
CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Optional: You may also need policies for insert/update if students are modifying subscriptions directly via client,
-- but typically manual_payment inserts are handled via Admin API (service_role) which bypasses RLS.
