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

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/\/$/, '');

    const origin = req.headers.get('origin');
    const allowed = (Deno.env.get('ALLOWED_ORIGINS') || 'https://oakcherrykraft.netlify.app,http://localhost:4173,http://localhost:4174').split(',');

    const isAllowed = origin && allowed.includes(origin);

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...corsHeaders, 'Access-Control-Allow-Origin': isAllowed ? origin! : 'null' } });
    }

    const withCors = (res: Response) => {
      const headers = new Headers(res.headers);
      headers.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
      headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
      headers.set('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
      headers.set('Access-Control-Allow-Origin', isAllowed ? origin! : 'null');
      return new Response(res.body, { status: res.status, headers });
    };

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

      // create or return existing
      const { data: existing } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .eq('visitor_token', visitor_token)
        .maybeSingle();

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

      const { data, error } = await supabase.from('live_chat_sessions').select('*').eq('visitor_token', token).maybeSingle();
      if (error) return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
      return withCors(new Response(JSON.stringify(data), { status: 200 }));
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

      // Validate content
      const trimmedContent = content.trim();
      if (!trimmedContent || trimmedContent.length > 4000) {
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
      const payload = { session_id, author: 'visitor', content: trimmedContent };
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
      
      const stream = new ReadableStream({
        start(controller) {
          let closed = false;
          
          // Register this connection
          if (!sseConnections.has(visitor_token)) {
            sseConnections.set(visitor_token, new Set());
          }
          sseConnections.get(visitor_token)!.add(connectionId);

          // Timeout: close connection after 2 hours (max SSE lifetime)
          const timeoutId = setTimeout(() => {
            if (!closed) {
              try {
                controller.close();
              } catch {}
            }
          }, 2 * 60 * 60 * 1000); // 2 hours

          const writeEvent = (event: string, data: any) => {
            try {
              controller.enqueue(`event: ${event}\n`);
              controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
            } catch (err) {
              // ignore
            }
          };

          // initial send of existing messages
          (async () => {
            try {
              const { data } = await supabase.from('live_chat_messages').select('*').eq('session_id', session_id).order('created_at', { ascending: true });
              writeEvent('history', data ?? []);
            } catch {}
          })();

          const channel = supabase
            .channel(`live_chat_messages_proxy:${session_id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `session_id=eq.${session_id}` }, (payload) => {
              if (closed) return;
              writeEvent('message', payload.new);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_chat_sessions', filter: `id=eq.${session_id}` }, (payload) => {
              if (closed) return;
              writeEvent('session', payload.new);
            })
            .subscribe();

          req.signal.addEventListener('abort', () => {
            if (!closed) {
              closed = true;
              clearTimeout(timeoutId);
              try {
                channel.unsubscribe();
              } catch {}
              
              // Deregister this connection
              const connections = sseConnections.get(visitor_token);
              if (connections) {
                connections.delete(connectionId);
                if (connections.size === 0) {
                  sseConnections.delete(visitor_token);
                }
              }
              
              controller.close();
            }
          });
        },
      });

      return withCors(new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }));
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

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});
