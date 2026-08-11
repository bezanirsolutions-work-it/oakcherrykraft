-- 008_create_live_chat_tables.sql
-- Add live chat sessions and messages tables for real-time visitor handover.

CREATE TABLE IF NOT EXISTS public.live_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','resolved','closed')),
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  visitor_token text NOT NULL,
  assigned_agent_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS public.live_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_chat_sessions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  author text NOT NULL CHECK (author IN ('visitor', 'assistant', 'agent', 'system')),
  content text NOT NULL,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_live_chat_sessions_status ON public.live_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_chat_sessions_updated_at ON public.live_chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_chat_sessions_visitor_token ON public.live_chat_sessions(visitor_token);
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_session_id_created_at ON public.live_chat_messages(session_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_live_chat_sessions_updated_at') THEN
    CREATE TRIGGER trigger_update_live_chat_sessions_updated_at
    BEFORE UPDATE ON public.live_chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_live_chat_messages_updated_at') THEN
    CREATE TRIGGER trigger_update_live_chat_messages_updated_at
    BEFORE UPDATE ON public.live_chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.live_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_insert_live_chat_sessions ON public.live_chat_sessions;
-- NOTE: For security we do NOT create public SELECT/INSERT policies here.
-- Live chat operations from website visitors must be proxied through a
-- trusted server or Edge Function that uses the Supabase service role key.
-- This migration intentionally does not allow unauthenticated clients to
-- read or modify other visitors' conversations.

DROP POLICY IF EXISTS public_insert_live_chat_messages ON public.live_chat_messages;
-- NOTE: same as above — do not allow public SELECT/INSERT on messages.
-- Use a server-side proxy (Edge Function) with service role credentials.

DROP POLICY IF EXISTS admin_full_access_live_chat_sessions ON public.live_chat_sessions;
CREATE POLICY admin_full_access_live_chat_sessions
ON public.live_chat_sessions
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);

DROP POLICY IF EXISTS admin_full_access_live_chat_messages ON public.live_chat_messages;
CREATE POLICY admin_full_access_live_chat_messages
ON public.live_chat_messages
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);
