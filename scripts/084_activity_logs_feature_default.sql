-- Migration: Relax feature constraint on activity_logs
-- 084_activity_logs_feature_default.sql

ALTER TABLE public.activity_logs 
ALTER COLUMN feature DROP NOT NULL,
ALTER COLUMN feature SET DEFAULT 'general';
