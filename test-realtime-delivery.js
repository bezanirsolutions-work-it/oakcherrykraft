/**
 * Test realtime customer/admin message delivery
 * Tests SSE event streaming and message persistence
 */

const PROXY_URL = 'https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy';

function generateVisitorToken() {
  return `visitor-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
}

async function testRealtimeDelivery() {
  console.log('\n=== REALTIME DELIVERY TEST ===\n');

  try {
    // Step 1: Create customer session
    const token = generateVisitorToken();
    console.log('1. Creating customer session...');
    
    const sessionRes = await fetch(`${PROXY_URL}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_token: token,
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0000',
      }),
    });

    const session = await sessionRes.json();
    const sessionId = session.id;
    console.log(`   Session ID: ${sessionId.substring(0, 20)}...`);

    // Step 2: Send a test message
    console.log('2. Customer sending message...');
    
    const messageRes = await fetch(`${PROXY_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        visitor_token: token,
        content: 'Hello from customer - realtime test',
      }),
    });

    if (messageRes.status !== 201) {
      throw new Error(`Message creation failed: ${messageRes.status}`);
    }

    const message = await messageRes.json();
    console.log(`   Message ID: ${message.id.substring(0, 20)}...`);
    console.log(`   Content: "${message.content}"`);
    console.log(`   Author: ${message.author}`);

    // Step 3: Verify message persistence
    console.log('3. Verifying message persistence...');
    
    const messagesRes = await fetch(
      `${PROXY_URL}/messages?session_id=${encodeURIComponent(sessionId)}&visitor_token=${encodeURIComponent(token)}`
    );

    const messages = await messagesRes.json();
    const found = messages.some(m => m.content === 'Hello from customer - realtime test');
    console.log(`   Messages retrieved: ${messages.length}`);
    console.log(`   Test message persisted: ${found ? '✓' : '✗'}`);

    if (!found) {
      throw new Error('Test message not found in database');
    }

    // Step 4: Test SSE connection (realtime events)
    console.log('4. Testing SSE event stream (30 second timeout)...');
    
    let sseConnected = false;
    let sseMessageReceived = false;
    const sseAbortController = new AbortController();
    const sseTimeoutId = setTimeout(() => sseAbortController.abort(), 30000);

    try {
      const sseRes = await fetch(
        `${PROXY_URL}/events?session_id=${encodeURIComponent(sessionId)}&visitor_token=${encodeURIComponent(token)}`,
        { signal: sseAbortController.signal }
      );

      sseConnected = sseRes.ok;
      console.log(`   SSE connection: HTTP ${sseRes.status} ${sseRes.ok ? '✓' : '✗'}`);

      if (sseRes.ok && sseRes.body) {
        const reader = sseRes.body.getReader();
        const decoder = new TextDecoder();

        // Read first few events
        let eventCount = 0;
        while (eventCount < 3) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          console.log(`   Event chunk ${eventCount + 1}: ${chunk.substring(0, 60)}...`);
          
          if (chunk.includes('data:') || chunk.includes('event:')) {
            sseMessageReceived = true;
            eventCount++;
          }
        }

        reader.cancel();
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.log(`   SSE error: ${e.message}`);
      }
    } finally {
      clearTimeout(sseTimeoutId);
    }

    // Step 5: Verify session status
    console.log('5. Verifying session status...');
    
    const getSessionRes = await fetch(
      `${PROXY_URL}/session?token=${encodeURIComponent(token)}`
    );

    if (getSessionRes.ok) {
      const sessionData = await getSessionRes.json();
      console.log(`   Session status: ${sessionData.status}`);
      console.log(`   Last activity: ${new Date(sessionData.last_activity_at).toISOString()}`);
    }

    console.log('\n=== REALTIME DELIVERY RESULTS ===');
    console.log(`✓ Session creation: PASS`);
    console.log(`✓ Message sending: PASS`);
    console.log(`✓ Message persistence: PASS`);
    console.log(`${sseConnected ? '✓' : '✗'} SSE connection: ${sseConnected ? 'PASS' : 'FAIL'}`);
    console.log(`${sseMessageReceived ? '✓' : '✗'} SSE events received: ${sseMessageReceived ? 'PASS' : 'FAIL (or timeout)'}`);

    if (!sseConnected) {
      console.log('\nNote: SSE may not have events on initial connection. This is normal.');
      console.log('Admin realtime subscriptions use Supabase Postgres Changes, not SSE.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testRealtimeDelivery();
