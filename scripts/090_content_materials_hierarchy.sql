-- 090_content_materials_hierarchy.sql
-- Add university_id, department_id, and description columns to content_materials
-- These columns support the strict University → Department → Batch → Course hierarchy

ALTER TABLE public.content_materials 
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL;

ALTER TABLE public.content_materials 
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.content_materials 
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Index for fast hierarchy-based queries
CREATE INDEX IF NOT EXISTS idx_content_materials_university_id ON public.content_materials(university_id);
CREATE INDEX IF NOT EXISTS idx_content_materials_department_id ON public.content_materials(department_id);
CREATE INDEX IF NOT EXISTS idx_content_materials_batch_id ON public.content_materials(batch_id);
CREATE INDEX IF NOT EXISTS idx_content_materials_course_id ON public.content_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_content_materials_type ON public.content_materials(type);
