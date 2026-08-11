const ENV_BASE = import.meta.env.VITE_LIVE_CHAT_PROXY_URL;

async function jsonFetch(path: string, options: RequestInit = {}) {
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const base = ENV_BASE ?? (isLocalhost ? '/api/live-chat' : undefined);
  if (!base) {
    throw new Error('VITE_LIVE_CHAT_PROXY_URL is not configured. Live chat proxy is unavailable in production.');
  }

  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const text = await res.text();
  try {
    const parsed = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(parsed?.error || res.statusText);
    return parsed;
  } catch (err) {
    if (!res.ok) throw new Error(res.statusText);
    return null;
  }
}

export async function createSessionProxy(visitorToken: string, details?: { name?: string; email?: string; phone?: string }) {
  return jsonFetch('/session', { method: 'POST', body: JSON.stringify({ visitor_token: visitorToken, ...details }) });
}

export async function fetchSessionByTokenProxy(visitorToken: string) {
  return jsonFetch(`/session?token=${encodeURIComponent(visitorToken)}`, { method: 'GET' });
}

export async function createMessageProxy(sessionId: string, author: string, content: string) {
  return jsonFetch('/message', { method: 'POST', body: JSON.stringify({ session_id: sessionId, author, content }) });
}

export async function fetchMessagesProxy(sessionId: string) {
  return jsonFetch(`/messages?session_id=${encodeURIComponent(sessionId)}`, { method: 'GET' });
}
