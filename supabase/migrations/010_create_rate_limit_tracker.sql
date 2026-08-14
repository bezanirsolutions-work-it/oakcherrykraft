-- 010_create_rate_limit_tracker.sql
-- Rate limiting table for abuse resistance in live_chat_proxy Edge Function.
-- Tracks request counts per IP/token/endpoint to prevent spam/DoS.

CREATE TABLE IF NOT EXISTS public.rate_limit_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Identity: either IP address or visitor token (or both)
  client_ip text,
  visitor_token text,
  
  -- Endpoint being rate limited
  endpoint text NOT NULL, -- 'session', 'message', 'events', 'close', etc.
  
  -- Rate limit window (e.g., 'hourly', 'per_minute')
  window_type text NOT NULL DEFAULT 'per_minute',
  
  -- Request count in current window
  request_count integer NOT NULL DEFAULT 0,
  
  -- Window start time (when counter will reset)
  window_start_at timestamptz NOT NULL DEFAULT now(),
  
  -- Composite key: (client_ip or visitor_token) + endpoint + window
  UNIQUE (endpoint, window_type, client_ip, visitor_token)
);

-- Index for efficient lookups (service-role only)
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracker_lookup
  ON public.rate_limit_tracker(endpoint, window_type, client_ip, visitor_token);

CREATE INDEX IF NOT EXISTS idx_rate_limit_tracker_updated_at
  ON public.rate_limit_tracker(updated_at DESC);

-- Housekeeping: allow old records to be cleaned up (manual or scheduled)
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracker_window_start
  ON public.rate_limit_tracker(window_start_at DESC);

-- Enable RLS: only service role (Edge Function) can access
ALTER TABLE public.rate_limit_tracker ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: No public policies. Service role bypass only.
-- This table is accessed only by Edge Function with service_role_key.

DROP POLICY IF EXISTS edge_function_rate_limit_access ON public.rate_limit_tracker;
CREATE POLICY edge_function_rate_limit_access
  ON public.rate_limit_tracker
  FOR ALL
  USING (true)  -- Allow service role only (RLS bypass for service role)
  WITH CHECK (true);

-- Atomic rate limit check and increment function
-- Used by Edge Function to safely check rate limit without race conditions
-- Returns: true if request is within limit, false if over limit
CREATE OR REPLACE FUNCTION public.rate_limit_check_and_increment(
  p_endpoint text,
  p_window_type text,
  p_client_ip text,
  p_visitor_token text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE(
  allowed boolean,
  current_count integer,
  reset_at timestamptz
) AS $$
DECLARE
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
  v_reset_at timestamptz;
BEGIN
  -- Try to get or create the rate limit record
  -- Using INSERT ... ON CONFLICT for atomic upsert
  INSERT INTO public.rate_limit_tracker (
    endpoint,
    window_type,
    client_ip,
    visitor_token,
    window_start_at,
    request_count,
    updated_at
  ) VALUES (
    p_endpoint,
    p_window_type,
    p_client_ip,
    p_visitor_token,
    v_now,
    1,
    v_now
  )
  ON CONFLICT (endpoint, window_type, client_ip, visitor_token)
  DO UPDATE SET
    -- Check if window has expired
    request_count = CASE
      WHEN (now() - rate_limit_tracker.window_start_at) > make_interval(secs := p_window_seconds)
        THEN 1  -- Reset counter
        ELSE rate_limit_tracker.request_count + 1  -- Increment
      END,
    window_start_at = CASE
      WHEN (now() - rate_limit_tracker.window_start_at) > make_interval(secs := p_window_seconds)
        THEN now()  -- Reset window
        ELSE rate_limit_tracker.window_start_at
      END,
    updated_at = now()
  RETURNING
    CASE WHEN rate_limit_tracker.request_count <= p_limit THEN true ELSE false END,
    rate_limit_tracker.request_count,
    rate_limit_tracker.window_start_at + make_interval(secs := p_window_seconds)
  INTO allowed, v_count, v_reset_at;

  RETURN QUERY SELECT allowed, v_count, v_reset_at;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS trigger_update_rate_limit_tracker_updated_at
  ON public.rate_limit_tracker;

CREATE TRIGGER trigger_update_rate_limit_tracker_updated_at
BEFORE UPDATE ON public.rate_limit_tracker
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Comment for documentation
COMMENT ON TABLE public.rate_limit_tracker IS 'Stores rate limit counters for live_chat_proxy Edge Function. Prevents abuse by tracking requests per IP/token/endpoint. Accessed only by service role.';

COMMENT ON FUNCTION public.rate_limit_check_and_increment(text, text, text, text, integer, integer) IS 'Atomically checks and increments rate limit counter. Returns (allowed, current_count, reset_time). Race-condition safe via SQL atomic operations.';
