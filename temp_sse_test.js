const proxyUrl = 'https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy';

async function test() {
  const token = `live-sse-test-${Date.now()}`;
  const sessionRes = await fetch(`${proxyUrl}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitor_token: token }),
  });
  const session = await sessionRes.json();
  if (!session?.id) {
    console.error('Session create failed', session);
    process.exit(1);
  }
  console.log('session id', session.id);

  const eventUrl = `${proxyUrl}/events?session_id=${encodeURIComponent(session.id)}`;
  const controller = new AbortController();
  const res = await fetch(eventUrl, {
    headers: { Accept: 'text/event-stream' },
    signal: controller.signal,
  });
  console.log('events status', res.status, 'content-type', res.headers.get('content-type'));
  if (!res.ok) {
    console.error('events failed', await res.text());
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let gotMessage = false;
  let closed = false;

  (async () => {
    while (!closed) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const lines = chunk.split('\n');
        let eventType = 'message';
        let eventData = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventType = line.slice(6).trim();
          else if (line.startsWith('data:')) {
            const dataLine = line.slice(5).trim();
            eventData += eventData ? '\n' + dataLine : dataLine;
          }
        }
        console.log('event', eventType, eventData);
        if (eventData) {
          try {
            const payload = JSON.parse(eventData);
            if (payload.content === 'LIVE SSE DELIVERY TEST 2026') {
              console.log('SUCCESS event payload', JSON.stringify(payload));
              gotMessage = true;
              closed = true;
              controller.abort();
              break;
            }
          } catch (err) {
            console.error('parse error', err);
          }
        }
        boundary = buffer.indexOf('\n\n');
      }
    }
  })();

  setTimeout(async () => {
    if (!gotMessage) {
      console.log('posting test message');
      const msgRes = await fetch(`${proxyUrl}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id, author: 'agent', content: 'LIVE SSE DELIVERY TEST 2026' }),
      });
      console.log('message status', msgRes.status);
      console.log('message body', await msgRes.text());
    }
  }, 2000);

  setTimeout(() => {
    if (!gotMessage) {
      console.error('timeout without SSE event');
      controller.abort();
      process.exit(1);
    }
  }, 15000);
}

test().catch((error) => {
  console.error(error);
  process.exit(1);
});
