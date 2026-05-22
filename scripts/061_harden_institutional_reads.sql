-- Migration: Hardening Institutional Read Access
-- 061_harden_institutional_reads.sql

-- 1. Ensure RLS is enabled
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_batches ENABLE ROW LEVEL SECURITY;

-- 2. Universities: Read-only for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view active universities" ON public.universities;
DROP POLICY IF EXISTS "Anyone can view universities" ON public.universities;
DROP POLICY IF EXISTS "public_read_universities" ON public.universities;
DROP POLICY IF EXISTS "allow authenticated read universities" ON public.universities;

CREATE POLICY "allow_authenticated_read_universities" 
ON public.universities FOR SELECT 
TO authenticated 
USING (status = 'active');

-- 3. Departments: Read-only for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view active departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
DROP POLICY IF EXISTS "allow authenticated read departments" ON public.departments;

CREATE POLICY "allow_authenticated_read_departments" 
ON public.departments FOR SELECT 
TO authenticated 
USING (status = 'active');

-- 4. Batches: Read-only for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view active batches" ON public.academic_batches;
DROP POLICY IF EXISTS "Anyone can view batches" ON public.academic_batches;
DROP POLICY IF EXISTS "allow authenticated read batches" ON public.academic_batches;

CREATE POLICY "allow_authenticated_read_batches" 
ON public.academic_batches FOR SELECT 
TO authenticated 
USING (status = 'active');
