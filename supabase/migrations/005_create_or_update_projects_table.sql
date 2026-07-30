-- Add or update the projects table for the admin project management system.

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  client_name text,
  location text,
  wood_species text,
  finish text,
  duration text,
  budget_range text,
  completion_date date,
  status text NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'In Progress', 'Completed', 'Delivered')),
  publication_status text NOT NULL DEFAULT 'Draft' CHECK (publication_status IN ('Draft', 'Published')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  cover_image text,
  before_image text,
  after_image text,
  gallery_images text[] DEFAULT '{}'::text[],
  featured_project boolean NOT NULL DEFAULT false,
  project_of_the_month boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  materials_used text
);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS short_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS wood_species text,
  ADD COLUMN IF NOT EXISTS finish text,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS budget_range text,
  ADD COLUMN IF NOT EXISTS completion_date date,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Planning',
  ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS before_image text,
  ADD COLUMN IF NOT EXISTS after_image text,
  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS featured_project boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS project_of_the_month boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS materials_used text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_projects_updated_at') THEN
    CREATE TRIGGER trigger_update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_projects ON public.projects;
CREATE POLICY admin_full_access_projects
  ON public.projects
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND public.is_admin()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.is_admin()
  );

DROP POLICY IF EXISTS public_select_projects ON public.projects;
CREATE POLICY public_select_projects
  ON public.projects
  FOR SELECT
  USING (publication_status = 'Published');

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured_project);
CREATE INDEX IF NOT EXISTS idx_projects_project_of_the_month ON public.projects(project_of_the_month);
CREATE INDEX IF NOT EXISTS idx_projects_publication_status ON public.projects(publication_status);
CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON public.projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
