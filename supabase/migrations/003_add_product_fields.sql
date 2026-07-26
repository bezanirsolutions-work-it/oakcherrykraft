-- Add missing product columns needed by the admin UI and import workflow.
-- This migration keeps the frontend and Supabase schema aligned with the product model.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS colour text,
  ADD COLUMN IF NOT EXISTS wood text,
  ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS specifications text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS cover_image text;
