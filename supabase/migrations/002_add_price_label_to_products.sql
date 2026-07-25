-- Add price_label to the products table.
-- This migration keeps the frontend and Supabase schema in sync.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_label text;
