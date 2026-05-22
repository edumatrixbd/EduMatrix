-- Migration 072: Admin Universities CRUD column contract
-- Keeps the UI contract explicit: Add writes rows, Lock writes locked,
-- Delete writes active=false, and onboarding reads the same active/locked state.

ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false;

UPDATE public.universities
SET locked = COALESCE(locked, false),
    active = COALESCE(active, true);
