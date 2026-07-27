-- Add settings table for site-wide admin configuration.

CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Attach update timestamp trigger.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_settings_updated_at') THEN
    CREATE TRIGGER trigger_update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_settings ON public.settings;
CREATE POLICY admin_full_access_settings
ON public.settings
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);
