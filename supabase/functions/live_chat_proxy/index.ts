import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function environment');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

function isValidUuid(value: string): boolean {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

// In-memory cache for rate limit results (performance optimization)
// Maps: "endpoint:identity:window" -> { allowed: boolean, expireAt: number }
const rateLimitCache = new Map<string, { allowed: boolean; expireAt: number }>();

function normalizeClientIp(value: string | null): string | null {
  if (!value) return null;

  const candidate = value.trim();
  if (!candidate || candidate === 'unknown') {
    return null;
  }

  const normalized = candidate
    .replace(/^\[|\]$/g, '')
    .replace(/\/$/, '');

  if (!normalized || normalized.includes(' ') || !/^[0-9A-Fa-f:.]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function getClientIp(req: Request): string {
  // The browser can set proxy headers arbitrarily, so we never trust x-forwarded-for as a
  // client-chosen identity. Prefer platform-provided headers that are normally populated by a
  // trusted proxy or CDN, and fall back to a shared anonymous bucket when no trusted source exists.
  for (const headerName of ['cf-connecting-ip', 'x-real-ip']) {
    const normalized = normalizeClientIp(req.headers.get(headerName));
    if (normalized) {
      return normalized;
    }
  }

  return 'unknown';
}

async function checkRateLimit(
  endpoint: string,
  identity: string, // IP or visitor_token
  identityType: 'ip' | 'token', // Type of identity
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const cacheKey = `${endpoint}:${identity}:${windowSeconds}`;

  // Check cache first (1-second TTL for performance)
  const cached = rateLimitCache.get(cacheKey);
  if (cached && cached.expireAt > now) {
    if (cached.allowed) {
      return { allowed: true };
    }
    return { allowed: false, retryAfter: Math.ceil((cached.expireAt - now) / 1000) };
  }

  try {
    // Call database rate limit function
    const { data, error } = await supabase.rpc('rate_limit_check_and_increment', {
      p_endpoint: endpoint,
      p_window_type: windowSeconds === 3600 ? 'per_hour' : 'per_minute',
      p_client_ip: identityType === 'ip' ? identity : null,
      p_visitor_token: identityType === 'token' ? identity : null,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error('[rate-limit] RPC error:', error);
      // Fail safe: if rate limit check fails, allow request but log it
      return { allowed: true };
    }

    const result = data?.[0];
    if (!result) {
      return { allowed: true };
    }

    const allowed = result.allowed === true;
    const retryAfter = result.reset_at
      ? Math.ceil((new Date(result.reset_at).getTime() - now) / 1000)
      : windowSeconds;

    // Cache the result (1 second TTL)
    rateLimitCache.set(cacheKey, {
      allowed,
      expireAt: now + 1000,
    });

    return { allowed, retryAfter: allowed ? undefined : retryAfter };
  } catch (err) {
    console.error('[rate-limit] Exception:', err);
    // Fail safe: allow request if rate limit system fails
    return { allowed: true };
  }
}

// Track SSE connections per visitor token (in-memory)
// Maps: visitor_token -> Set of connection IDs
const sseConnections = new Map<string, Set<string>>();
const MAX_CONCURRENT_SSE_PER_TOKEN = 1;

async function validateVisitorOwnership(
  sessionId: string,
  visitorToken: string
): Promise<{ valid: boolean; session?: any; error?: string }> {
  if (!sessionId || !visitorToken) {
    return { valid: false, error: 'Forbidden' };
  }

  const { data: session, error } = await supabase
    .from('live_chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('visitor_token', visitorToken)
    .maybeSingle();

  if (error) {
    return { valid: false, error: 'Forbidden' };
  }

  if (!session) {
    return { valid: false, error: 'Forbidden' };
  }

  return { valid: true, session };
}

function normalizeStoragePath(value: string): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('..')) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const objectIndex = pathParts.findIndex((segment) => segment === 'object');
      if (objectIndex >= 0) {
        const bucket = pathParts[objectIndex + 1];
        if (bucket === 'public' || bucket === 'private') {
          const startIndex = objectIndex + 2;
          return pathParts.slice(startIndex + 1).join('/');
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  return trimmed.replace(/^\/+/, '');
}

async function resolveAuthenticatedUser(req: Request): Promise<{ user?: any; isAdmin: boolean; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Unauthorized' };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { isAdmin: false, error: 'Unauthorized' };
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return { isAdmin: false, error: 'Unauthorized' };
    }

    const role = (data.user as any)?.user_metadata?.role ?? (data.user as any)?.app_metadata?.role ?? null;
    if (role === 'admin' || role === 'super_admin') {
      return { user: data.user, isAdmin: true, error: undefined };
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    const profileRole = profileData?.role ?? null;
    return { user: data.user, isAdmin: profileRole === 'admin' || profileRole === 'super_admin', error: profileError ? 'Unauthorized' : undefined };
  } catch {
    return { isAdmin: false, error: 'Unauthorized' };
  }
}

async function attachmentBelongsToAuthorizedSession(path: string, sessionId?: string, visitorToken?: string): Promise<boolean> {
  const normalized = normalizeStoragePath(path);
  if (!normalized) return false;

  const { data: messages, error } = await supabase.from('live_chat_messages').select('*');
  if (error || !messages) return false;

  for (const message of messages) {
    const messageSessionId = typeof message.session_id === 'string' ? message.session_id : '';
    const metadata = message.metadata || {};
    const attachments = Array.isArray(metadata.attachments) ? metadata.attachments : [];

    const matchesPath = attachments.some((attachment: any) => {
      const candidate = typeof attachment?.path === 'string' ? attachment.path : '';
      return normalizeStoragePath(candidate) === normalized;
    });

    if (!matchesPath) continue;

    if (sessionId && messageSessionId !== sessionId) continue;
    if (visitorToken) {
      const sessionValidation = await validateVisitorOwnership(messageSessionId, visitorToken);
      if (!sessionValidation.valid) return false;
    }

    return true;
  }

  return false;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/\/$/, '');

    const origin = req.headers.get('origin') || '*';
    
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Helper to add CORS headers to any response
    const addCorsHeaders = (res: Response): Response => {
      const newHeaders = new Headers(res.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      return new Response(res.body, { 
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders
      });
    };

    // Alias for backward compatibility
    const withCors = addCorsHeaders;

    if (req.method === 'POST' && pathname.endsWith('/session')) {
      // Rate limit: 5 new sessions per IP per hour
      const clientIp = getClientIp(req);
      const rateLimitCheck = await checkRateLimit('session_create', clientIp, 'ip', 5, 3600);
      
      if (!rateLimitCheck.allowed) {
        const retryAfter = rateLimitCheck.retryAfter || 3600;
        return withCors(
          new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          })
        );
      }

      // Validate request body size
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 50000) {
        return withCors(new Response(JSON.stringify({ error: 'Request body too large' }), { status: 413 }));
      }

      let body: any;
      try {
        body = await req.json();
      } catch {
        return withCors(new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 }));
      }
      
      const visitor_token = body?.visitor_token;
      if (!visitor_token) return withCors(new Response(JSON.stringify({ error: 'visitor_token required' }), { status: 400 }));

      // Validate visitor_token format
      if (typeof visitor_token !== 'string' || visitor_token.length > 2048) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid visitor_token' }), { status: 400 }));
      }

      // Return the current open session only. Historical closed sessions must not block a new pending session.
      const { data: openSessions } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .eq('visitor_token', visitor_token)
        .in('status', ['pending', 'active'])
        .order('last_activity_at', { ascending: false })
        .limit(1);

      const existing = openSessions && openSessions.length > 0 ? openSessions[0] : null;

      if (existing) return withCors(new Response(JSON.stringify(existing), { status: 200 }));

      const payload = {
        visitor_token,
        visitor_name: body.name ?? null,
        visitor_email: body.email ?? null,
        visitor_phone: body.phone ?? null,
        status: 'pending',
        last_activity_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('live_chat_sessions').insert(payload).select('*').maybeSingle();
      if (error) return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
      return withCors(new Response(JSON.stringify(data), { status: 201 }));
    }

    if (req.method === 'GET' && pathname.endsWith('/session')) {
      const token = url.searchParams.get('token');
      if (!token) return withCors(new Response(JSON.stringify({ error: 'token required' }), { status: 400 }));

      // Validate token length
      if (typeof token !== 'string' || token.length > 2048) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400 }));
      }

      // Rate limit: 30 queries per token per minute
      const rateLimitCheck = await checkRateLimit('session_get', token, 'token', 30, 60);
      
      if (!rateLimitCheck.allowed) {
        const retryAfter = rateLimitCheck.retryAfter || 60;
        return withCors(
          new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          })
        );
      }

      const { data, error } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .eq('visitor_token', token)
        .in('status', ['pending', 'active'])
        .order('last_activity_at', { ascending: false })
        .limit(1);

      if (error) return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
      const currentOpenSession = data && data.length > 0 ? data[0] : null;
      return withCors(new Response(JSON.stringify(currentOpenSession), { status: 200 }));
    }

    if (req.method === 'POST' && pathname.endsWith('/message')) {
      // Validate request body size
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 50000) {
        return withCors(new Response(JSON.stringify({ error: 'Request body too large' }), { status: 413 }));
      }

      let body: any;
      try {
        body = await req.json();
      } catch {
        return withCors(new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 }));
      }

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 }));
      }

      const session_id = typeof body.session_id === 'string' ? body.session_id.trim() : '';
      const visitor_token = typeof body.visitor_token === 'string' ? body.visitor_token.trim() : '';
      const providedAuthor = body.author;
      const author = providedAuthor === undefined ? 'visitor' : providedAuthor;
      const content = typeof body.content === 'string' ? body.content : '';

      // Validate session_id is a UUID
      if (!session_id || !isValidUuid(session_id)) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid session_id' }), { status: 400 }));
      }

      // Validate visitor_token
      if (!visitor_token || visitor_token.length > 2048) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid visitor_token' }), { status: 400 }));
      }

      // CRITICAL SECURITY: Validate author is exactly 'visitor' or reject
      if (typeof author !== 'string' || author !== 'visitor') {
        return withCors(new Response(JSON.stringify({ error: 'Invalid author' }), { status: 400 }));
      }

      // Validate content - allow empty content if attachments present
      const trimmedContent = content.trim();
      const hasAttachments = Array.isArray(body?.attachments) && body.attachments.length > 0;
      if ((!trimmedContent && !hasAttachments) || trimmedContent.length > 4000) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid content' }), { status: 400 }));
      }

      // Rate limit: 15 messages per token per minute
      const rateLimitCheck = await checkRateLimit('message_create', visitor_token, 'token', 15, 60);
      
      if (!rateLimitCheck.allowed) {
        const retryAfter = rateLimitCheck.retryAfter || 60;
        return withCors(
          new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          })
        );
      }

      // Verify visitor ownership of session
      const validation = await validateVisitorOwnership(session_id, visitor_token);
      if (!validation.valid) {
        return withCors(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
      }

      // Server-side enforcement: always insert 'visitor' as author
      const attachments = Array.isArray(body?.attachments) ? body.attachments : [];
      const payload = {
        session_id,
        author: 'visitor',
        content: trimmedContent,
        metadata: attachments.length > 0 ? { attachments } : null,
      };
      const { data, error } = await supabase.from('live_chat_messages').insert(payload).select('*').maybeSingle();
      if (error) return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
      // update session last_activity_at
      await supabase.from('live_chat_sessions').update({ last_activity_at: new Date().toISOString() }).eq('id', session_id);
      return withCors(new Response(JSON.stringify(data), { status: 201 }));
    }

    if (req.method === 'GET' && pathname.endsWith('/messages')) {
      const session_id = url.searchParams.get('session_id');
      const visitor_token = url.searchParams.get('visitor_token');
      
      if (!session_id || !session_id.trim() || !visitor_token || !visitor_token.trim()) {
        return withCors(new Response(JSON.stringify({ error: 'session_id and visitor_token required' }), { status: 400 }));
      }

      // Validate parameter lengths
      if (session_id.length > 2048 || visitor_token.length > 2048) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 }));
      }

      // Rate limit: 30 queries per token per minute
      const rateLimitCheck = await checkRateLimit('messages_get', visitor_token, 'token', 30, 60);
      
      if (!rateLimitCheck.allowed) {
        const retryAfter = rateLimitCheck.retryAfter || 60;
        return withCors(
          new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          })
        );
      }

      // Verify visitor ownership
      const validation = await validateVisitorOwnership(session_id, visitor_token);
      if (!validation.valid) {
        return withCors(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
      }

      const { data, error } = await supabase.from('live_chat_messages').select('*').eq('session_id', session_id).order('created_at', { ascending: true });
      if (error) return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
      return withCors(new Response(JSON.stringify(data), { status: 200 }));
    }

    // Server-Sent Events stream for realtime updates for a session.
    if (req.method === 'GET' && pathname.endsWith('/events')) {
      const session_id = url.searchParams.get('session_id');
      const visitor_token = url.searchParams.get('visitor_token');

      if (!session_id || !session_id.trim() || !visitor_token || !visitor_token.trim()) {
        return withCors(new Response(JSON.stringify({ error: 'session_id and visitor_token required' }), { status: 400 }));
      }

      // Validate parameter lengths
      if (session_id.length > 2048 || visitor_token.length > 2048) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 }));
      }

      // Rate limit: 1 concurrent connection per token
      const existingConnections = sseConnections.get(visitor_token) || new Set();
      if (existingConnections.size >= MAX_CONCURRENT_SSE_PER_TOKEN) {
        return withCors(
          new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Retry-After': '60' },
          })
        );
      }

      // Verify visitor ownership
      const validation = await validateVisitorOwnership(session_id, visitor_token);
      if (!validation.valid) {
        return withCors(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
      }

      const connectionId = crypto.randomUUID();
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const responseStream = stream.readable;
      let closed = false;
      let heartbeatTimer: number | undefined;
      let channel: any = null;
      let cleanupStarted = false;
      let abortListener: (() => void) | undefined;

      const stopHeartbeat = () => {
        if (heartbeatTimer !== undefined) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = undefined;
        }
      };

      const cleanup = async () => {
        if (cleanupStarted) return;
        cleanupStarted = true;
        closed = true;
        stopHeartbeat();
        clearTimeout(timeoutId);

        if (abortListener) {
          req.signal.removeEventListener('abort', abortListener);
          abortListener = undefined;
        }

        if (channel && typeof channel.unsubscribe === 'function') {
          try {
            channel.unsubscribe();
          } catch (err) {
          }
        }

        const connections = sseConnections.get(visitor_token);
        if (connections) {
          connections.delete(connectionId);
          if (connections.size === 0) {
            sseConnections.delete(visitor_token);
          }
        }

        try {
          await writer.close();
        } catch (err) {
          try {
            await writer.abort();
          } catch {}
        }
      };

      const writeEvent = async (event: string, data: any) => {
        if (closed) {
          return;
        }

        try {
          const payload = JSON.stringify(data);
          await writer.write(encoder.encode(`event: ${event}\n`));
          await writer.write(encoder.encode(`data: ${payload}\n\n`));
        } catch (err) {
          await cleanup();
        }
      };

      const writeHeartbeat = async () => {
        if (closed) return;

        try {
          await writer.write(encoder.encode(': heartbeat\n\n'));
        } catch (err) {
          await cleanup();
        }
      };

      // Register this connection
      if (!sseConnections.has(visitor_token)) {
        sseConnections.set(visitor_token, new Set());
      }
      sseConnections.get(visitor_token)!.add(connectionId);

      void writeHeartbeat();
      heartbeatTimer = setInterval(() => {
        void writeHeartbeat();
      }, 20000);

      // initial send of existing messages
      (async () => {
        try {
          const { data } = await supabase.from('live_chat_messages').select('*').eq('session_id', session_id).order('created_at', { ascending: true });
          await writeEvent('history', data ?? []);
        } catch (err) {
        }
      })();

      channel = supabase
        .channel(`live_chat_messages_proxy:${session_id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `session_id=eq.${session_id}` }, async (payload) => {
          if (closed) return;
          await writeEvent('message', payload.new);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_chat_sessions', filter: `id=eq.${session_id}` }, async (payload) => {
          if (closed) return;
          await writeEvent('session', payload.new);
        })
        .subscribe((status) => {
        });

      abortListener = () => {
        void cleanup();
      };
      req.signal.addEventListener('abort', abortListener, { once: true });

      const timeoutId = setTimeout(() => {
        if (!closed) {
          void cleanup();
        }
      }, 2 * 60 * 60 * 1000);

      return withCors(
        new Response(responseStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          },
        })
      );
    }

    if (req.method === 'POST' && pathname.endsWith('/session/feedback')) {
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 50000) {
        return withCors(new Response(JSON.stringify({ error: 'Request body too large' }), { status: 413 }));
      }

      let body: any;
      try {
        body = await req.json();
      } catch {
        return withCors(new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 }));
      }

      const session_id = typeof body?.session_id === 'string' ? body.session_id.trim() : '';
      const visitor_token = typeof body?.visitor_token === 'string' ? body.visitor_token.trim() : '';
      const rawRating = Number(body?.rating);
      const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';

      if (!session_id || !visitor_token) {
        return withCors(new Response(JSON.stringify({ error: 'session_id and visitor_token required' }), { status: 400 }));
      }

      if (!isValidUuid(session_id)) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid session_id' }), { status: 400 }));
      }

      if (!Number.isInteger(rawRating) || rawRating < 1 || rawRating > 5) {
        return withCors(new Response(JSON.stringify({ error: 'rating must be between 1 and 5' }), { status: 400 }));
      }

      if (comment.length > 1000) {
        return withCors(new Response(JSON.stringify({ error: 'Comment exceeds maximum length' }), { status: 400 }));
      }

      const validation = await validateVisitorOwnership(session_id, visitor_token);
      if (!validation.valid) {
        return withCors(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
      }

      const sessionStatus = validation.session?.status;
      if (sessionStatus !== 'closed' && sessionStatus !== 'resolved') {
        return withCors(new Response(JSON.stringify({ error: 'Feedback can only be submitted after a chat is closed' }), { status: 409 }));
      }

      const payload = {
        session_id,
        rating: rawRating,
        comment: comment || null,
        updated_at: new Date().toISOString(),
      };

      const { data: existing, error: lookupError } = await supabase
        .from('live_chat_feedback')
        .select('*')
        .eq('session_id', session_id)
        .maybeSingle();

      if (lookupError) {
        return withCors(new Response(JSON.stringify({ error: lookupError.message }), { status: 500 }));
      }

      if (existing) {
        const { data, error } = await supabase
          .from('live_chat_feedback')
          .update(payload)
          .eq('session_id', session_id)
          .select('*')
          .maybeSingle();

        if (error) return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
        return withCors(new Response(JSON.stringify(data ?? existing), { status: 200 }));
      }

      const { data, error } = await supabase
        .from('live_chat_feedback')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select('*')
        .maybeSingle();

      if (error) return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
      return withCors(new Response(JSON.stringify(data), { status: 201 }));
    }

    if (req.method === 'GET' && pathname.endsWith('/session/feedback')) {
      // Admin-only endpoint to fetch feedback for a session
      // This bypasses RLS by using the service role key via the edge function
      const sessionId = new URL(req.url).searchParams.get('session_id');
      
      if (!sessionId || typeof sessionId !== 'string') {
        return withCors(new Response(JSON.stringify({ error: 'session_id required' }), { status: 400 }));
      }

      if (!isValidUuid(sessionId)) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid session_id' }), { status: 400 }));
      }

      // Fetch feedback using service role (bypasses RLS policy issues with is_admin() function)
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('live_chat_feedback')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (feedbackError) {
        console.error('[live-chat-proxy] feedback fetch error:', feedbackError);
        // Return null instead of error to gracefully handle schema issues
        return withCors(new Response(JSON.stringify(null), { status: 200 }));
      }

      return withCors(new Response(JSON.stringify(feedbackData ?? null), { status: 200 }));
    }

    if (req.method === 'GET' && pathname.endsWith('/all-feedback')) {
      // Admin-only endpoint to fetch all feedback with optional filtering
      // Query parameters: rating (1-5), search, startDate (ISO), endDate (ISO)
      const authResult = await resolveAuthenticatedUser(req);
      
      if (!authResult.isAdmin) {
        return withCors(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
      }

      try {
        const searchParams = new URL(req.url).searchParams;
        const rating = searchParams.get('rating');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 1000);
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

        // Build query
        let query = supabase
          .from('live_chat_feedback')
          .select(`
            id,
            rating,
            comment,
            created_at,
            updated_at,
            session_id,
            live_chat_sessions (
              id,
              visitor_name,
              visitor_email,
              visitor_phone,
              status,
              created_at,
              assigned_agent_id
            )
          `, { count: 'exact' });

        // Apply filters
        if (rating && /^[1-5]$/.test(rating)) {
          query = query.eq('rating', parseInt(rating));
        }

        if (startDate) {
          try {
            const start = new Date(startDate);
            if (!Number.isNaN(start.getTime())) {
              query = query.gte('created_at', start.toISOString());
            }
          } catch {}
        }

        if (endDate) {
          try {
            const end = new Date(endDate);
            if (!Number.isNaN(end.getTime())) {
              query = query.lte('created_at', end.toISOString());
            }
          } catch {}
        }

        // Apply pagination
        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data: feedbackList, error: queryError, count } = await query;

        if (queryError) {
          console.error('[live-chat-proxy] all-feedback query error:', queryError);
          return withCors(new Response(JSON.stringify({ error: 'Failed to fetch feedback' }), { status: 500 }));
        }

        // Filter by search term if provided (search in comment, visitor name, email)
        let filtered = feedbackList ?? [];
        if (search && search.trim()) {
          const term = search.toLowerCase().trim();
          filtered = filtered.filter((fb: any) => {
            const comment = (fb.comment || '').toLowerCase();
            const visitorName = (fb.live_chat_sessions?.visitor_name || '').toLowerCase();
            const visitorEmail = (fb.live_chat_sessions?.visitor_email || '').toLowerCase();
            const sessionId = (fb.session_id || '').toLowerCase();
            return (
              comment.includes(term) ||
              visitorName.includes(term) ||
              visitorEmail.includes(term) ||
              sessionId.includes(term)
            );
          });
        }

        return withCors(new Response(JSON.stringify({
          data: filtered,
          total: count || 0,
          count: filtered.length,
          offset,
          limit,
        }), { status: 200 }));
      } catch (err) {
        console.error('[live-chat-proxy] all-feedback exception:', err);
        return withCors(new Response(JSON.stringify({ error: 'Failed to fetch feedback' }), { status: 500 }));
      }
    }

    if (req.method === 'POST' && pathname.endsWith('/session/close')) {
      // Validate request body size
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 50000) {
        return withCors(new Response(JSON.stringify({ error: 'Request body too large' }), { status: 413 }));
      }

      let body: any;
      try {
        body = await req.json();
      } catch {
        return withCors(new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 }));
      }
      
      const session_id = body?.session_id;
      const visitor_token = body?.visitor_token;

      if (!session_id || !visitor_token) {
        return withCors(new Response(JSON.stringify({ error: 'session_id and visitor_token required' }), { status: 400 }));
      }

      // Validate parameters
      if (typeof session_id !== 'string' || typeof visitor_token !== 'string') {
        return withCors(new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 }));
      }

      if (session_id.length > 2048 || visitor_token.length > 2048) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 }));
      }

      // Rate limit: 5 close requests per token per minute
      const rateLimitCheck = await checkRateLimit('session_close', visitor_token, 'token', 5, 60);
      
      if (!rateLimitCheck.allowed) {
        const retryAfter = rateLimitCheck.retryAfter || 60;
        return withCors(
          new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          })
        );
      }

      // Verify visitor ownership
      const validation = await validateVisitorOwnership(session_id, visitor_token);
      if (!validation.valid) {
        return withCors(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
      }

      const { error } = await supabase.from('live_chat_sessions').update({ status: 'closed' }).eq('id', session_id);
      if (error) return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
      return withCors(new Response(JSON.stringify({ status: 'closed' }), { status: 200 }));
    }

    if (req.method === 'POST' && pathname.endsWith('/attachment/signed-url')) {
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 50000) {
        return withCors(new Response(JSON.stringify({ error: 'Request body too large' }), { status: 413 }));
      }

      let body: any;
      try {
        body = await req.json();
      } catch {
        return withCors(new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 }));
      }

      const requestedPath = typeof body?.path === 'string' ? body.path : '';
      const normalizedPath = normalizeStoragePath(requestedPath);
      const sessionId = typeof body?.session_id === 'string' ? body.session_id.trim() : '';
      const visitorToken = typeof body?.visitor_token === 'string' ? body.visitor_token.trim() : '';

      if (!normalizedPath) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid attachment path' }), { status: 400 }));
      }

      const authResult = await resolveAuthenticatedUser(req);
      const isAdminRequest = authResult.isAdmin;

      console.log('[attachment-signed-url] Authorization check', {
        hasAuthHeader: !!req.headers.get('Authorization'),
        isAdminRequest,
        normalizedPath,
        sessionId: sessionId ? '(provided)' : '(not provided)',
        visitorToken: visitorToken ? '(provided)' : '(not provided)',
      });

      if (!isAdminRequest) {
        if (!sessionId || !visitorToken) {
          console.log('[attachment-signed-url] REJECT: non-admin without visitor credentials');
          return withCors(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
        }

        const validation = await validateVisitorOwnership(sessionId, visitorToken);
        if (!validation.valid) {
          console.log('[attachment-signed-url] REJECT: invalid visitor ownership');
          return withCors(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
        }
        console.log('[attachment-signed-url] visitor authorized');
      } else {
        console.log('[attachment-signed-url] admin authorized, skipping session/visitor checks');
      }

      // Admin requests should not require attachment to belong to a specific session
      // Admins are already authenticated and authorized to view any attachment
      if (!isAdminRequest) {
        const attachmentIsAuthorized = await attachmentBelongsToAuthorizedSession(normalizedPath, sessionId, visitorToken);
        if (!attachmentIsAuthorized) {
          console.log('[attachment-signed-url] REJECT: attachment ownership validation failed');
          return withCors(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 }));
        }
      } else {
        console.log('[attachment-signed-url] admin: skipping attachment ownership validation');
      }

      try {
        const { data, error } = await supabase.storage
          .from('live-chat-attachments')
          .createSignedUrl(normalizedPath, 600);

        if (error || !data?.signedUrl) {
          console.error('[attachment-signed-url] createSignedUrl failed', error);
          return withCors(new Response(JSON.stringify({ error: 'Attachment could not be loaded.' }), { status: 404 }));
        }

        return withCors(new Response(JSON.stringify({
          url: data.signedUrl,
          expiresAt: new Date(Date.now() + 600000).toISOString(),
          path: normalizedPath,
        }), { status: 200 }));
      } catch (err) {
        console.error('[attachment-signed-url] exception', err);
        return withCors(new Response(JSON.stringify({ error: 'Attachment could not be loaded.' }), { status: 500 }));
      }
    }

    if (req.method === 'POST' && pathname.endsWith('/attachment/upload')) {
      console.log('[ATTACHMENT-ENDPOINT-HIT] Received attachment upload request', { pathname });
      
      // Validate request size (10MB limit per file × 5 files = 50MB buffer)
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 52428800) { // 50MB
        return withCors(new Response(JSON.stringify({ error: 'Request body too large' }), { status: 413 }));
      }

      let formData: FormData;
      try {
        formData = await req.formData();
        console.log('[ATTACHMENT-ENDPOINT] FormData parsed successfully');
      } catch (err) {
        console.error('[ATTACHMENT-ENDPOINT-ERROR] FormData parse failed', err);
        return withCors(new Response(JSON.stringify({ error: 'Invalid form data' }), { status: 400 }));
      }

      const session_id = formData.get('session_id');
      const visitor_token = formData.get('visitor_token');
      const file = formData.get('file');

      console.log('[ATTACHMENT-ENDPOINT] Fields received', {
        hasSessionId: !!session_id,
        hasVisitorToken: !!visitor_token,
        hasFile: !!file,
        fileType: file instanceof File ? 'File' : typeof file,
      });

      if (!session_id || !visitor_token || !file) {
        return withCors(new Response(JSON.stringify({ error: 'session_id, visitor_token, and file required' }), { status: 400 }));
      }

      // Validate parameters
      if (typeof session_id !== 'string' || typeof visitor_token !== 'string') {
        return withCors(new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 }));
      }

      if (!(file instanceof File)) {
        return withCors(new Response(JSON.stringify({ error: 'file must be a File' }), { status: 400 }));
      }

      if (session_id.length > 2048 || visitor_token.length > 2048) {
        return withCors(new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 }));
      }

      // Rate limit: 10 upload requests per token per minute
      const rateLimitCheck = await checkRateLimit('attachment_upload', visitor_token, 'token', 10, 60);
      if (!rateLimitCheck.allowed) {
        const retryAfter = rateLimitCheck.retryAfter || 60;
        return withCors(
          new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          })
        );
      }

      // Verify visitor ownership
      const validation = await validateVisitorOwnership(session_id, visitor_token);
      if (!validation.valid) {
        return withCors(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
      }

      // Validate file size (max 10MB per file)
      if (file.size > 10485760) { // 10MB
        return withCors(new Response(JSON.stringify({ error: 'File too large' }), { status: 413 }));
      }

      // Validate file type - whitelist MIME types
      const SUPPORTED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
        return withCors(new Response(JSON.stringify({ error: 'Unsupported file type' }), { status: 400 }));
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      const ext = file.name.split('.').pop() || 'bin';
      const filename = `${timestamp}-${random}.${ext}`;
      const storagePath = `${session_id}/${filename}`;

      try {
        // Upload to Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        const uploadResponse = await supabase.storage
          .from('live-chat-attachments')
          .upload(storagePath, new Uint8Array(arrayBuffer), {
            contentType: file.type,
            upsert: false,
          });

        if (uploadResponse.error) {
          console.error('Storage upload error:', uploadResponse.error);
          return withCors(new Response(JSON.stringify({ error: 'Failed to upload file' }), { status: 500 }));
        }

        // Return attachment metadata
        const attachmentMetadata = {
          name: file.name,
          type: file.type,
          size: file.size,
          path: storagePath,
        };

        return withCors(new Response(JSON.stringify(attachmentMetadata), { status: 200 }));
      } catch (err) {
        console.error('Upload error:', err);
        return withCors(new Response(JSON.stringify({ error: 'Failed to upload file' }), { status: 500 }));
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});
