const ENV_BASE = import.meta.env.VITE_LIVE_CHAT_PROXY_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getProxyBase() {
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const base = ENV_BASE ?? (isLocalhost ? '/api/live-chat' : undefined);
  if (!base) {
    throw new Error('VITE_LIVE_CHAT_PROXY_URL is not configured. Live chat proxy is unavailable in production.');
  }
  return base;
}

function buildHeaders(options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (SUPABASE_ANON_KEY && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
  }
  return headers;
}

async function jsonFetch(path: string, options: RequestInit = {}) {
  const base = getProxyBase();
  const requestUrl = `${base}${path}`;
  const headers = buildHeaders(options);

  const res = await fetch(requestUrl, {
    ...options,
    headers,
  });
  const text = await res.text();
  let parsed: any = null;

  try {
    parsed = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(parsed?.error || res.statusText);
    return parsed;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err ?? '');
    if (!res.ok) throw new Error(errorMessage || res.statusText);
    return null;
  }
}

export function subscribeToSessionEventsProxy(
  sessionId: string,
  visitorToken: string,
  handlers: {
    onMessage?: (data: unknown) => void;
    onHistory?: (data: unknown) => void;
    onSession?: (data: unknown) => void;
    onError?: (error: unknown) => void;
  } = {},
  signal?: AbortSignal
) {
  const subscriptionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `sub-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const base = getProxyBase();
  const requestUrl = `${base}/events?session_id=${encodeURIComponent(sessionId)}&visitor_token=${encodeURIComponent(visitorToken)}`;
  const headers = new Headers();
  headers.set('Accept', 'text/event-stream');
  if (SUPABASE_ANON_KEY) {
    headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
  }

  const controller = new AbortController();
  const combinedSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

  const cleanup = () => {
    controller.abort();
  };

  void (async () => {
    try {
      const res = await fetch(requestUrl, { method: 'GET', headers, signal: combinedSignal });

      if (!res.ok || !res.body) {
        const reason = `Live chat events request failed with status ${res.status}`;
        throw new Error(reason);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let eventName = 'message';
      let eventData = '';

      while (!combinedSignal.aborted) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n\n');
        while (boundary >= 0) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          eventName = 'message';
          eventData = '';

          for (const line of chunk.split('\n')) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              const dataLine = line.slice(5).trim();
              eventData = eventData ? `${eventData}\n${dataLine}` : dataLine;
            }
          }
          if (eventData) {
            try {
              const parsed = JSON.parse(eventData);
              const parsedSessionId = typeof parsed?.session_id === 'string' ? parsed.session_id : null;
              const parsedAuthor = typeof parsed?.author === 'string' ? parsed.author : null;
              const contentLength = typeof parsed?.content === 'string' ? parsed.content.length : 0;
              const accepted =
                (eventName === 'message' || eventName === 'history' || eventName === 'session') &&
                (parsed && typeof parsed === 'object');

              if (accepted) {
                if (eventName === 'message') {
                  handlers.onMessage?.(parsed);
                } else if (eventName === 'history') {
                  handlers.onHistory?.(parsed);
                } else if (eventName === 'session') {
                  handlers.onSession?.(parsed);
                }
              } else {
              }
            } catch (err) {
              handlers.onError?.(err);
            }
          } else {
          }

          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch (err) {
      handlers.onError?.(err);
    }
  })();

  return cleanup;
}

export async function createSessionProxy(visitorToken: string, details?: { name?: string; email?: string; phone?: string }) {
  return jsonFetch('/session', { method: 'POST', body: JSON.stringify({ visitor_token: visitorToken, ...details }) });
}

export async function fetchSessionByTokenProxy(visitorToken: string) {
  return jsonFetch(`/session?token=${encodeURIComponent(visitorToken)}`, { method: 'GET' });
}

export async function createMessageProxy(sessionId: string, visitorToken: string, author: string, content: string, attachments?: Array<{ name: string; type: string; size: number; path: string }>) {
  console.log('[CHAT-SEND] SEND START', { sessionId, author, contentLength: content.length, attachmentCount: attachments?.length ?? 0 });
  const result = await jsonFetch('/message', { method: 'POST', body: JSON.stringify({ session_id: sessionId, visitor_token: visitorToken, author, content, attachments }) });
  console.log('[CHAT-SEND] SEND SUCCESS', { sessionId, author, messageId: result?.id ?? null, contentLength: content.length });
  return result;
}

export async function fetchMessagesProxy(sessionId: string, visitorToken: string) {
  return jsonFetch(`/messages?session_id=${encodeURIComponent(sessionId)}&visitor_token=${encodeURIComponent(visitorToken)}`, { method: 'GET' });
}

export async function closeSessionProxy(sessionId: string, visitorToken: string) {
  return jsonFetch('/session/close', { method: 'POST', body: JSON.stringify({ session_id: sessionId, visitor_token: visitorToken }) });
}

export async function submitSessionFeedbackProxy(
  sessionId: string,
  visitorToken: string,
  rating: number,
  comment?: string
) {
  return jsonFetch('/session/feedback', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      visitor_token: visitorToken,
      rating,
      comment,
    }),
  });
}
