// Test script to verify deployed /session/close endpoint
const BASE_URL = 'https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy';

async function test() {
  try {
    // Step 1: Create a session
    console.log('[TEST] Creating test session...');
    const createRes = await fetch(`${BASE_URL}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_token: `close_test_${Date.now()}`,
        name: 'Close Test'
      })
    });
    const sessionData = await createRes.json();
    console.log('[TEST] Session created:', sessionData.id);
    
    if (!sessionData.id) {
      console.error('[TEST] No session ID returned');
      return;
    }

    const sessionId = sessionData.id;

    // Step 2: Try to close the session
    console.log('[TEST] Calling /session/close endpoint...');
    const closeRes = await fetch(`${BASE_URL}/session/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    
    console.log('[TEST] Close response status:', closeRes.status);
    const closeData = await closeRes.json();
    console.log('[TEST] Close response:', JSON.stringify(closeData, null, 2));

    if (closeRes.ok && closeData.status === 'closed') {
      console.log('[✓] /session/close endpoint works correctly');
    } else {
      console.log('[✗] /session/close endpoint returned unexpected result');
    }

  } catch (err) {
    console.error('[ERROR]', err.message);
  }
}

test();
