import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function environment');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/\/$/, '');

    const origin = req.headers.get('origin');
    const allowed = (Deno.env.get('ALLOWED_ORIGINS') || 'https://oakcherrykraft.netlify.app,http://localhost:4174').split(',');

    const isAllowed = origin && allowed.includes(origin);

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...corsHeaders, 'Access-Control-Allow-Origin': isAllowed ? origin! : 'null' } });
    }

    // helper to attach CORS headers
    const withCors = (res: Response) => {
      const headers = new Headers(res.headers);
      headers.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
      headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
      headers.set('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
      headers.set('Access-Control-Allow-Origin', isAllowed ? origin! : 'null');
      return new Response(res.body, { status: res.status, headers });
    };

    if (req.method === 'POST' && pathname.endsWith('/session')) {
      const body = await req.json();
      const visitor_token = body.visitor_token;
      if (!visitor_token) return new Response(JSON.stringify({ error: 'visitor_token required' }), { status: 400 });

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
      const body = await req.json();
      const { session_id, author, content } = body;
      if (!session_id || !author || !content) return new Response(JSON.stringify({ error: 'session_id, author, content required' }), { status: 400 });

      const payload = { session_id, author, content };
      const { data, error } = await supabase.from('live_chat_messages').insert(payload).select('*').maybeSingle();
      if (error) return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
      // update session last_activity_at
      await supabase.from('live_chat_sessions').update({ last_activity_at: new Date().toISOString() }).eq('id', session_id);
      return withCors(new Response(JSON.stringify(data), { status: 201 }));
    }

    if (req.method === 'GET' && pathname.endsWith('/messages')) {
      const session_id = url.searchParams.get('session_id');
      if (!session_id) return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400 });
      const { data, error } = await supabase.from('live_chat_messages').select('*').eq('session_id', session_id).order('created_at', { ascending: true });
      if (error) return withCors(new Response(JSON.stringify({ error: error.message }), { status: 500 }));
      return withCors(new Response(JSON.stringify(data), { status: 200 }));
    }

    // Server-Sent Events stream for realtime updates for a session.
    if (req.method === 'GET' && pathname.endsWith('/events')) {
      const session_id = url.searchParams.get('session_id');
      if (!session_id) return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400 });

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

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});
