import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envText = fs.readFileSync(envPath, 'utf8');
const match = envText.match(/^VITE_SUPABASE_ANON_KEY=(.*)$/m);
if (!match) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY in .env');
}
const anonKey = match[1].trim();
const proxyUrl = 'https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (err) {
    console.error('Failed to parse JSON', text);
    throw err;
  }
  return { res, json, text };
}

(async () => {
  const token = `live-sse-test-${Date.now()}`;
  console.log('create session token', token);
  const { res: createRes, json: session } = await fetchJson(`${proxyUrl}/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ visitor_token: token }),
  });
  console.log('session status', createRes.status, 'session id', session?.id);
  if (!session?.id) {
    console.error('session missing', session);
    process.exit(1);
  }

  const eventUrl = `${proxyUrl}/events?session_id=${encodeURIComponent(session.id)}`;
  console.log('opening event stream', eventUrl);
  const eventRes = await fetch(eventUrl, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${anonKey}`,
    },
  });
  console.log('events status', eventRes.status, 'content-type', eventRes.headers.get('content-type'));
  if (!eventRes.ok || !eventRes.body) {
    console.error('failed open stream', await eventRes.text());
    process.exit(1);
  }

  const reader = eventRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let gotMessage = false;
  const start = Date.now();

  setTimeout(async () => {
    const message = 'LIVE SSE DELIVERY TEST 2026';
    console.log('posting test message', message);
    const postRes = await fetch(`${proxyUrl}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ session_id: session.id, author: 'agent', content: message }),
    });
    console.log('post status', postRes.status, 'post text', await postRes.text());
  }, 3000);

  while (Date.now() - start < 15000) {
    const { value, done } = await reader.read();
    console.log('read done', done, 'chunk length', value ? value.length : 0);
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    console.log('buffer raw', JSON.stringify(buffer));
    while (buffer.includes('\n\n')) {
      const [block, rest] = buffer.split('\n\n', 2);
      buffer = rest;
      console.log('event block', JSON.stringify(block));
      if (block.includes('LIVE SSE DELIVERY TEST 2026')) {
        gotMessage = true;
        process.exit(0);
      }
    }
  }
  console.error('timeout waiting for SSE event');
  process.exit(2);
})();
