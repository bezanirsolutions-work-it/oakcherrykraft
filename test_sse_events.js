// Test script to verify SSE session status events
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

    // Step 2: Subscribe to SSE /events in a timeout-wrapped promise
    console.log('[TEST] Subscribing to /events stream...');
    
    const eventsPromise = new Promise((resolve) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.log('[TEST] Timeout after 5 seconds, closing stream');
        controller.abort();
        resolve(null);
      }, 5000);

      const eventStream = new EventSource(`${BASE_URL}/events?session_id=${sessionId}`, {
        // EventSource doesn't support custom headers easily in Node.js
      });
      
      // Try using fetch with manual event parsing instead
      fetch(`${BASE_URL}/events?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`
        },
        signal: controller.signal
      }).then(async (res) => {
        if (!res.ok || !res.body) {
          console.error('[ERROR] SSE stream failed:', res.status);
          clearTimeout(timeout);
          resolve(null);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const events = [];

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            console.log('[TEST] SSE stream ended');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines[lines.length - 1]; // Keep incomplete line

          let eventName = '';
          let eventData = '';

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              eventData = line.slice(5).trim();
            } else if (line === '' && eventName && eventData) {
              // Event complete
              console.log(`[SSE] event: ${eventName}`);
              console.log(`[SSE] data: ${eventData}`);
              try {
                const parsed = JSON.parse(eventData);
                events.push({ type: eventName, data: parsed });
              } catch (e) {
                console.log(`[SSE] (not JSON: ${e.message})`);
              }
              eventName = '';
              eventData = '';
            }
          }
        }

        clearTimeout(timeout);
        resolve(events);
      }).catch((err) => {
        console.error('[ERROR] SSE fetch failed:', err.message);
        clearTimeout(timeout);
        resolve(null);
      });
    });

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
    console.log('[✓] Session closed, status now:', closeData.status);

    // Wait for SSE events
    const events = await eventsPromise;
    
    if (events) {
      console.log(`\n[RESULT] Received ${events.length} SSE events`);
      const sessionEvents = events.filter(e => e.type === 'session');
      console.log(`[RESULT] Session events received: ${sessionEvents.length}`);
      
      if (sessionEvents.length > 0) {
        sessionEvents.forEach((e, i) => {
          console.log(`[RESULT] Session event ${i + 1}:`, JSON.stringify(e.data));
        });
        const statusChangeEvent = sessionEvents.find(e => e.data.status === 'closed');
        if (statusChangeEvent) {
          console.log('[✓] SSE stream DID emit session status change event!');
        } else {
          console.log('[✗] No session event with status=closed was emitted');
        }
      } else {
        console.log('[✗] No session events were emitted at all');
      }
    } else {
      console.log('[TEST] No events received (timeout or error)');
    }

  } catch (err) {
    console.error('[ERROR]', err.message);
  }
}

test();
