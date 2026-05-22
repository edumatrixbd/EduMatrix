-- Temporary testing migration requested for admin manual payment visibility.
-- Re-enable RLS and policies before production hardening.

ALTER TABLE manual_payment_requests DISABLE ROW LEVEL SECURITY;
