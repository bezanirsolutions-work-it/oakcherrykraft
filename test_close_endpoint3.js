// Test script with auth header
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
    
    console.log('[TEST] Session data keys:', Object.keys(sessionData));
    
    if (!sessionData.id) {
      console.error('[TEST] No session ID in response');
      return;
    }

    const sessionId = sessionData.id;
    console.log('[✓] Session created with ID:', sessionId);

    // Step 2: Try to close the session
    console.log('[TEST] Calling /session/close endpoint...');
    const closeRes = await fetch(`${BASE_URL}/session/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ session_id: sessionId })
    });
    
    console.log('[TEST] Close response status:', closeRes.status);
    const closeText = await closeRes.text();
    console.log('[TEST] Close response text:', closeText);
    
    const closeData = JSON.parse(closeText);
    if (closeRes.ok && closeData.status === 'closed') {
      console.log('[✓] /session/close endpoint works correctly!');
      console.log('[✓] Database session status:', closeData.status);
    } else {
      console.log('[✗] /session/close endpoint returned status', closeRes.status);
    }

  } catch (err) {
    console.error('[ERROR]', err.message);
  }
}

test();
