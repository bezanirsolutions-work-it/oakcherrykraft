// Test script to verify SSE session status events (simplified)
const BASE_URL = 'https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcnhtZXhtbGVqZmtzamx6dml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjIwNjMsImV4cCI6MjEwMDM5ODA2M30.EHEY_nKub0ZyJIVjUjnmuHsU47x8stA5zClzbonuGBA';

async function test() {
  try {
    // Step 1: Create a session
    console.log('[TEST] Creating test session...');
    const createRes = await fetch(`${BASE_URL}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({
        visitor_token: `sse_test_${Date.now()}`,
        name: 'SSE Test'
      })
    });
    
    const sessionData = await createRes.json();
    const sessionId = sessionData.id;
    console.log('[✓] Session created:', sessionId);
    console.log('[TEST] Initial status:', sessionData.status);

    // Step 2: Subscribe to SSE /events with timeout
    console.log('[TEST] Subscribing to /events stream for 6 seconds...');
    
    let streamClosed = false;
    const eventsPromise = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.log('[TEST] 6 second timeout, aborting stream');
        controller.abort();
        streamClosed = true;
      }, 6000);

      try {
        const res = await fetch(`${BASE_URL}/events?session_id=${sessionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ANON_KEY}`
          },
          signal: controller.signal
        });

        if (!res.ok || !res.body) {
          console.error('[ERROR] SSE stream failed:', res.status);
          clearTimeout(timeout);
          return null;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const events = [];

        while (!streamClosed) {
          try {
            const { value, done } = await reader.read();
            if (done) {
              console.log('[TEST] SSE stream ended');
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            
            // Parse SSE format: event: name\ndata: {...}\n\n
            let idx = buffer.indexOf('\n\n');
            while (idx >= 0) {
              const chunk = buffer.substring(0, idx);
              buffer = buffer.substring(idx + 2);
              
              let eventName = '';
              let eventData = '';
              
              for (const line of chunk.split('\n')) {
                if (line.startsWith('event:')) {
                  eventName = line.substring(6).trim();
                } else if (line.startsWith('data:')) {
                  eventData = line.substring(5).trim();
                }
              }
              
              if (eventName && eventData) {
                console.log(`[SSE] Event received: ${eventName}`);
                try {
                  const parsed = JSON.parse(eventData);
                  console.log(`[SSE] Data: ${JSON.stringify(parsed)}`);
                  events.push({ type: eventName, data: parsed });
                } catch (e) {
                  console.log(`[SSE] (not JSON: ${eventData})`);
                }
              }
              
              idx = buffer.indexOf('\n\n');
            }
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('[ERROR] Stream read error:', err.message);
            }
            break;
          }
        }

        clearTimeout(timeout);
        return events;
      } catch (err) {
        console.error('[ERROR] SSE fetch failed:', err.message);
        clearTimeout(timeout);
        return null;
      }
    })();

    // Step 3: After 2 seconds, close the session
    await new Promise(r => setTimeout(r, 2000));
    console.log('[TEST] Now closing the session via /session/close...');
    
    const closeRes = await fetch(`${BASE_URL}/session/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ session_id: sessionId })
    });

    const closeData = await closeRes.json();
    console.log('[✓] Session closed, DB status now:', closeData.status);

    // Wait for SSE events
    const events = await eventsPromise;
    
    if (events !== null) {
      console.log(`\n[RESULT] Received ${events.length} SSE events total`);
      const sessionEvents = events.filter(e => e.type === 'session');
      console.log(`[RESULT] Session type events: ${sessionEvents.length}`);
      
      if (sessionEvents.length > 0) {
        sessionEvents.forEach((e, i) => {
          console.log(`  [${i + 1}] ${JSON.stringify(e.data)}`);
        });
        const statusChangeEvent = sessionEvents.find(e => e.data.status === 'closed');
        if (statusChangeEvent) {
          console.log('\n[✓] SSE DOES emit session status change event!');
          console.log('[✓] The deployed Edge Function is working correctly');
        } else {
          console.log('\n[✗] No session event with status=closed found');
          console.log('[?] SSE may not be detecting status changes');
        }
      } else {
        console.log('\n[✗] No session-type events were emitted');
        const messageEvents = events.filter(e => e.type === 'message');
        const otherEvents = events.filter(e => e.type !== 'message' && e.type !== 'session');
        console.log(`  Message events: ${messageEvents.length}`);
        console.log(`  Other events: ${otherEvents.length}`);
      }
    } else {
      console.log('[?] No events received or stream error');
    }

  } catch (err) {
    console.error('[ERROR]', err.message);
  }
}

test().catch(err => console.error('Unhandled error:', err));
