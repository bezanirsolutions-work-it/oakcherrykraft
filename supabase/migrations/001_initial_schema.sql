-- 001_initial_schema.sql
-- Initial schema for Oak Cherry Kraft Supabase project.
-- Creates core tables, triggers, RLS, and policies for production-ready operation.

-- Enable required extensions.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create update timestamp helper function.
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT EXISTS (
  SELECT 1
  FROM public.profiles
  WHERE user_id = auth.uid()
    AND role = 'admin'
);
$$;

-- Profiles table.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer','admin')),
  avatar_url text
);

-- Products table.
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  description text,
  material text,
  finish text,
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  price_label text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true
);

-- Quote requests table.
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone text,
  project_type text,
  room_type text,
  dimensions text,
  budget text,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','reviewing','quoted','accepted','rejected'))
);

-- Configurator selections table.
CREATE TABLE IF NOT EXISTS public.configurator_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  material text,
  finish text,
  colour text,
  accessories jsonb,
  estimated_price text NOT NULL DEFAULT '₦100,000 – ₦500,000'
);

-- Contact messages table.
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone text,
  subject text,
  message text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','read','replied','closed'))
);

-- Indexes for performance.
CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON public.quote_requests(email);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON public.quote_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at_desc ON public.quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at_desc ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);
CREATE INDEX IF NOT EXISTS idx_configurator_selections_quote_request_id ON public.configurator_selections(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_configurator_selections_created_at ON public.configurator_selections(created_at);

-- Attach updated_at trigger to every table.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_profiles_updated_at') THEN
    CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_products_updated_at') THEN
    CREATE TRIGGER trigger_update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_quote_requests_updated_at') THEN
    CREATE TRIGGER trigger_update_quote_requests_updated_at
    BEFORE UPDATE ON public.quote_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_configurator_selections_updated_at') THEN
    CREATE TRIGGER trigger_update_configurator_selections_updated_at
    BEFORE UPDATE ON public.configurator_selections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_contact_messages_updated_at') THEN
    CREATE TRIGGER trigger_update_contact_messages_updated_at
    BEFORE UPDATE ON public.contact_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END;
$$;

-- Enable Row Level Security.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configurator_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policies for anonymous users.
DROP POLICY IF EXISTS anon_insert_quote_requests ON public.quote_requests;
CREATE POLICY anon_insert_quote_requests
ON public.quote_requests
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS anon_insert_contact_messages ON public.contact_messages;
CREATE POLICY anon_insert_contact_messages
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (true);

-- Policies for authenticated users.
DROP POLICY IF EXISTS auth_select_own_profile ON public.profiles;
CREATE POLICY auth_select_own_profile
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS auth_update_own_profile ON public.profiles;
CREATE POLICY auth_update_own_profile
ON public.profiles
FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Admin policies granting full access based on profile lookup.
DROP POLICY IF EXISTS admin_full_access_profiles ON public.profiles;
CREATE POLICY admin_full_access_profiles
ON public.profiles
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);

DROP POLICY IF EXISTS admin_full_access_products ON public.products;
CREATE POLICY admin_full_access_products
ON public.products
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);

DROP POLICY IF EXISTS admin_full_access_quote_requests ON public.quote_requests;
CREATE POLICY admin_full_access_quote_requests
ON public.quote_requests
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);

DROP POLICY IF EXISTS admin_full_access_configurator_selections ON public.configurator_selections;
CREATE POLICY admin_full_access_configurator_selections
ON public.configurator_selections
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);

DROP POLICY IF EXISTS admin_full_access_contact_messages ON public.contact_messages;
CREATE POLICY admin_full_access_contact_messages
ON public.contact_messages
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);

-- Public policies for products.
DROP POLICY IF EXISTS public_select_products ON public.products;
CREATE POLICY public_select_products
ON public.products
FOR SELECT
USING (is_active = true);

-- Expose quotes and related data to admin users only.
DROP POLICY IF EXISTS auth_select_quote_requests ON public.quote_requests;
CREATE POLICY auth_select_quote_requests
ON public.quote_requests
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);

DROP POLICY IF EXISTS auth_select_contact_messages ON public.contact_messages;
CREATE POLICY auth_select_contact_messages
ON public.contact_messages
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);

DROP POLICY IF EXISTS auth_select_configurator_selections ON public.configurator_selections;
CREATE POLICY auth_select_configurator_selections
ON public.configurator_selections
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);
