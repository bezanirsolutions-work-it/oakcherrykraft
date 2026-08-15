-- 011_fix_live_chat_assigned_agent_fk.sql
-- Correct the live-chat assignment foreign key to match the app's actual profile identity model.
--
-- Runtime evidence from the application:
-- - profile lookups use public.profiles.id (see src/lib/profile.ts and src/lib/AuthContext.tsx)
-- - admin assignment stores the authenticated user id in live_chat_sessions.assigned_agent_id (see src/lib/liveChat.ts and src/pages/admin/LiveChat.tsx)
-- - the original migration used public.profiles(user_id), which is a separate auth.users linkage and does not match the app's profile identity pattern.
--
-- This migration preserves the existing column and data while correcting only the FK target.
-- It does not add a new user_id column and does not alter unrelated security policies.

ALTER TABLE public.live_chat_sessions
  DROP CONSTRAINT IF EXISTS live_chat_sessions_assigned_agent_id_fkey;

ALTER TABLE public.live_chat_sessions
  ADD CONSTRAINT live_chat_sessions_assigned_agent_id_fkey
  FOREIGN KEY (assigned_agent_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;
