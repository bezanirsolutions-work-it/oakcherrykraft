// Test script with better error handling
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
    
    const responseText = await createRes.text();
    console.log('[TEST] Create response status:', createRes.status);
    console.log('[TEST] Create response text:', responseText);
    
    let sessionData;
    try {
      sessionData = JSON.parse(responseText);
    } catch (e) {
      console.error('[ERROR] Failed to parse response:', e.message);
      return;
    }
    
    console.log('[TEST] Session data:', JSON.stringify(sessionData, null, 2));
    
    if (!sessionData.id) {
      console.error('[TEST] No session ID in response');
      return;
    }

    const sessionId = sessionData.id;

    // Step 2: Try to close the session
    console.log('[TEST] Calling /session/close endpoint with sessionId:', sessionId);
    const closeRes = await fetch(`${BASE_URL}/session/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    
    console.log('[TEST] Close response status:', closeRes.status);
    const closeText = await closeRes.text();
    console.log('[TEST] Close response text:', closeText);

  } catch (err) {
    console.error('[ERROR]', err.message, err.stack);
  }
}

test();
