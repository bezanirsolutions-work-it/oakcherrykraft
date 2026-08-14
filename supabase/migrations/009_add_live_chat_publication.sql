-- 009_add_live_chat_publication.sql
-- Ensure live chat tables are included in the Supabase replication publication
-- Run this in the Supabase SQL editor or apply via your migration tooling.

DO $$
BEGIN
  -- If the standard supabase_realtime publication does not exist, create it and include the tables.
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE public.live_chat_sessions, public.live_chat_messages;
  ELSE
    -- Add live_chat_sessions if missing
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_chat_sessions'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_sessions';
    END IF;

    -- Add live_chat_messages if missing
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_chat_messages'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages';
    END IF;
  END IF;
END
$$;
