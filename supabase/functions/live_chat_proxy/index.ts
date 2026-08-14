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
      let body: any;
      try {
        body = await req.json();
      } catch {
        return withCors(new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 }));
      }
      
      const visitor_token = body?.visitor_token;
      if (!visitor_token) return withCors(new Response(JSON.stringify({ error: 'visitor_token required' }), { status: 400 }));

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
      if (!token) return new Response(JSON.stringify({ error: 'token required' }), { status: 400 });
      const { data, error } = await supabase.from('live_chat_sessions').select('*').eq('visitor_token', token).maybeSingle();
      if (error) return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
      return withCors(new Response(JSON.stringify(data), { status: 200 }));
    }

    if (req.method === 'POST' && pathname.endsWith('/message')) {
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

      // Verify visitor ownership
      const validation = await validateVisitorOwnership(session_id, visitor_token);
      if (!validation.valid) {
        return withCors(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
      }

      const stream = new ReadableStream({
        start(controller) {
          let closed = false;

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
            closed = true;
            try {
              channel.unsubscribe();
            } catch {}
            controller.close();
          });
        },
      });

      return withCors(new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }));
    }

    if (req.method === 'POST' && pathname.endsWith('/session/close')) {
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
