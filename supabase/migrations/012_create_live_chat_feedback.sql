-- 012_create_live_chat_feedback.sql
-- Add a single post-chat rating per live chat session.

CREATE TABLE IF NOT EXISTS public.live_chat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.live_chat_sessions(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_chat_feedback_session_id
  ON public.live_chat_feedback(session_id);

ALTER TABLE public.live_chat_feedback
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_live_chat_feedback ON public.live_chat_feedback;
CREATE POLICY admin_full_access_live_chat_feedback
ON public.live_chat_feedback
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_admin()
);

-- Intentionally do not create public INSERT/SELECT policies here.
-- Visitor feedback must be submitted through the trusted server-side live chat proxy.
