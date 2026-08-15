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
    console.log('[CHAT-SSE] CLEANUP', { subscriptionId, sessionId, reason: 'cleanup-called' });
    controller.abort();
  };

  void (async () => {
    console.info('[live-chat-events] connecting', {
      sessionId,
      url: requestUrl,
      contentType: 'text/event-stream',
    });
    console.log('[CHAT-SSE] SUBSCRIBE', { subscriptionId, sessionId });
    console.info('[SESSION-TRACE][SSE-URL]', {
      activeSessionId: sessionId,
      visitorToken,
      subscriptionUrl: requestUrl,
    });

    try {
      const res = await fetch(requestUrl, { method: 'GET', headers, signal: combinedSignal });

      console.info('[live-chat-events] response', {
        sessionId,
        url: requestUrl,
        status: res.status,
        contentType: res.headers.get('content-type'),
      });
      console.log('[SSE-BROWSER-TRACE] RESPONSE RECEIVED', {
        sessionId,
        status: res.status,
        ok: res.ok,
        contentType: res.headers.get('content-type'),
      });

      if (!res.ok || !res.body) {
        const reason = `Live chat events request failed with status ${res.status}`;
        console.warn('[live-chat-events] rejected', {
          sessionId,
          url: requestUrl,
          status: res.status,
          contentType: res.headers.get('content-type'),
          reason,
        });
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
          console.log('[SSE-BROWSER-TRACE] STREAM CLOSED/ERROR', {
            sessionId,
            error: null,
          });
          console.log('[CHAT-SSE] CLEANUP', { subscriptionId, sessionId, reason: 'reader-done' });
          break;
        }
        console.log('[SSE-BROWSER-TRACE] CHUNK RECEIVED', {
          sessionId,
          byteLength: value?.byteLength ?? value?.length ?? null,
        });
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

          console.log('[SSE-BROWSER-TRACE] EVENT PARSED', {
            sessionId,
            eventName,
          });
          console.log('[CHAT-SSE] PARSED', { subscriptionId, sessionId, eventName });
          console.info('[live-chat-events] received chunk', {
            sessionId,
            eventType: eventName,
            url: requestUrl,
          });

          if (eventData) {
            try {
              const parsed = JSON.parse(eventData);
              const parsedSessionId = typeof parsed?.session_id === 'string' ? parsed.session_id : null;
              const parsedAuthor = typeof parsed?.author === 'string' ? parsed.author : null;
              const contentLength = typeof parsed?.content === 'string' ? parsed.content.length : 0;
              const accepted =
                (eventName === 'message' || eventName === 'history' || eventName === 'session') &&
                (parsed && typeof parsed === 'object');

              console.info('[live-chat-events] parsed payload', {
                sessionId,
                eventType: eventName,
                parsedSessionId,
                parsedAuthor,
                contentLength,
                accepted,
                reason: accepted ? 'recognized event format' : 'rejected event format',
              });
              console.info('[SESSION-TRACE][SSE-CLIENT]', {
                eventName,
                parsedPayload: parsed,
                payloadId: parsed?.id ?? null,
                payloadAuthor: parsed?.author ?? null,
                payloadSessionId: parsed?.session_id ?? null,
                payloadContent: parsed?.content ?? null,
              });

              if (accepted) {
                if (eventName === 'message') {
                  console.log('[SSE-BROWSER-TRACE] MESSAGE DISPATCH', {
                    sessionId,
                    messageId: parsed?.id,
                    payloadSessionId: parsed?.session_id,
                    author: parsed?.author,
                    contentLength:
                      typeof parsed?.content === 'string'
                        ? parsed.content.length
                        : null,
                  });
                  console.log('[CHAT-SSE] MESSAGE', { subscriptionId, sessionId, messageId: parsed?.id ?? null, author: parsed?.author ?? null, contentLength: typeof parsed?.content === 'string' ? parsed.content.length : 0 });
                  handlers.onMessage?.(parsed);
                } else if (eventName === 'history') {
                  handlers.onHistory?.(parsed);
                } else if (eventName === 'session') {
                  handlers.onSession?.(parsed);
                }
              } else {
                console.warn('[live-chat-events] rejected event', {
                  sessionId,
                  eventType: eventName,
                  reason: 'event format or payload not recognized',
                });
              }
            } catch (err) {
              console.error('[SSE-BROWSER-TRACE] JSON PARSE ERROR', {
                sessionId,
                error: err instanceof Error ? err.message : String(err),
              });
              console.warn('[live-chat-events] rejected event', {
                sessionId,
                eventType: eventName,
                reason: err instanceof Error ? err.message : 'JSON parse error',
              });
              handlers.onError?.(err);
            }
          } else {
            console.warn('[live-chat-events] rejected event', {
              sessionId,
              eventType: eventName,
              reason: 'missing data payload',
            });
          }

          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch (err) {
      console.warn('[SSE-BROWSER-TRACE] STREAM_ERROR', {
        sessionId,
        err: err instanceof Error ? err.message : String(err),
      });
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

export async function createMessageProxy(sessionId: string, visitorToken: string, author: string, content: string) {
  console.log('[CHAT-SEND] SEND START', { sessionId, author, contentLength: content.length });
  const result = await jsonFetch('/message', { method: 'POST', body: JSON.stringify({ session_id: sessionId, visitor_token: visitorToken, author, content }) });
  console.log('[CHAT-SEND] SEND SUCCESS', { sessionId, author, messageId: result?.id ?? null, contentLength: content.length });
  return result;
}

export async function fetchMessagesProxy(sessionId: string, visitorToken: string) {
  return jsonFetch(`/messages?session_id=${encodeURIComponent(sessionId)}&visitor_token=${encodeURIComponent(visitorToken)}`, { method: 'GET' });
}

export async function closeSessionProxy(sessionId: string, visitorToken: string) {
  return jsonFetch('/session/close', { method: 'POST', body: JSON.stringify({ session_id: sessionId, visitor_token: visitorToken }) });
}
