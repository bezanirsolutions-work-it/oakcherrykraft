-- 006_create_projects_table.sql
-- Create the public.projects table for the projects module.
-- This migration is idempotent and safe to apply multiple times.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL DEFAULT '',
  slug text NOT NULL UNIQUE DEFAULT '',
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  client_name text,
  location text,
  status text NOT NULL DEFAULT 'Planning',
  completion_date date,
  budget_range text,
  wood_species text,
  finish text,
  duration text,
  publication_status text NOT NULL DEFAULT 'Draft',
  progress integer NOT NULL DEFAULT 0,
  cover_image text,
  before_image text,
  after_image text,
  gallery_images text[] NOT NULL DEFAULT '{}'::text[],
  materials_used text,
  featured_project boolean NOT NULL DEFAULT false,
  project_of_the_month boolean NOT NULL DEFAULT false,
  show_in_gallery boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS short_description text NOT NULL DEFAULT '';

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'Draft';

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS finish text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS materials_used text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS duration text;

ALTER TABLE public.projects
  ALTER COLUMN title SET DEFAULT '';

ALTER TABLE public.projects
  ALTER COLUMN slug SET DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trigger_update_projects_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS authenticated_insert_projects ON public.projects;
CREATE POLICY authenticated_insert_projects
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_update_projects ON public.projects;
CREATE POLICY authenticated_update_projects
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_delete_projects ON public.projects;
CREATE POLICY authenticated_delete_projects
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS everyone_select_projects ON public.projects;
CREATE POLICY everyone_select_projects
  ON public.projects
  FOR SELECT
  TO public
  USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured_project);
CREATE INDEX IF NOT EXISTS idx_projects_project_of_the_month ON public.projects(project_of_the_month);
CREATE INDEX IF NOT EXISTS idx_projects_show_in_gallery ON public.projects(show_in_gallery);
CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON public.projects(sort_order);
