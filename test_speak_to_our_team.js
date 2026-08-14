/**
 * Test: Simulate "Speak to Our Team" flow
 */

const SUPABASE_URL = 'https://jmrxmexmlejfksjlzvit.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcnhtZXhtbGVqZmtzamx6dml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjIwNjMsImV4cCI6MjEwMDM5ODA2M30.EHEY_nKub0ZyJIVjUjnmuHsU47x8stA5zClzbonuGBA';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/live_chat_proxy`;

async function testSpeakToOurTeam() {
  console.log('Simulating "Speak to Our Team" flow...\n');
  
  const visitorToken = `visitor_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  console.log('1. Generated visitor token:', visitorToken);
  
  try {
    // Step 1: Fetch existing session (should return null)
    console.log('\n2. Checking for existing session...');
    let existingRes = await fetch(`${PROXY_URL}/session?token=${encodeURIComponent(visitorToken)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    });
    
    if (!existingRes.ok && existingRes.status !== 404) {
      throw new Error(`GET /session failed: HTTP ${existingRes.status}`);
    }
    
    const existing = existingRes.status === 404 ? null : await existingRes.json();
    console.log('   Result:', existing ? `Found ${existing.status}` : 'No existing session');
    
    // Step 2: Create session
    console.log('\n3. Creating new live chat session...');
    let sessionRes = await fetch(`${PROXY_URL}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ visitor_token: visitorToken }),
    });
    
    if (!sessionRes.ok) {
      const error = await sessionRes.text();
      throw new Error(`POST /session failed: HTTP ${sessionRes.status}: ${error}`);
    }
    
    const session = await sessionRes.json();
    console.log('   Session created:', {
      id: session.id,
      status: session.status,
      visitor_token: session.visitor_token ? 'present' : 'missing',
    });
    
    // Step 3: Fetch messages
    console.log('\n4. Fetching message history...');
    let messagesRes = await fetch(`${PROXY_URL}/messages?session_id=${encodeURIComponent(session.id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    });
    
    if (!messagesRes.ok) {
      throw new Error(`GET /messages failed: HTTP ${messagesRes.status}`);
    }
    
    const messages = await messagesRes.json();
    console.log('   Messages fetched:', Array.isArray(messages) ? messages.length : 'not an array');
    
    // Step 4: Create system message
    console.log('\n5. Creating system message...');
    let messageRes = await fetch(`${PROXY_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        session_id: session.id,
        author: 'system',
        content: 'Live chat created by visitor via chatbot',
      }),
    });
    
    if (!messageRes.ok) {
      throw new Error(`POST /message failed: HTTP ${messageRes.status}`);
    }
    
    const message = await messageRes.json();
    console.log('   System message created:', {
      id: message.id ? 'created' : 'failed',
      author: message.author,
      content_length: message.content ? message.content.length : 0,
    });
    
    // Step 5: Connect to SSE
    console.log('\n6. Connecting to SSE stream...');
    let sseRes = await fetch(`${PROXY_URL}/events?session_id=${encodeURIComponent(session.id)}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    });
    
    if (!sseRes.ok) {
      throw new Error(`GET /events failed: HTTP ${sseRes.status}`);
    }
    
    console.log('   SSE connection established:', {
      status: sseRes.status,
      contentType: sseRes.headers.get('content-type'),
      contentEncoding: sseRes.headers.get('content-encoding'),
    });
    
    console.log('\n✓ SUCCESS: "Speak to Our Team" flow completed without errors!');
    console.log('✓ Session:', session.id);
    console.log('✓ All endpoints working correctly');
    
  } catch (err) {
    console.error('\n✗ FAILURE:', err.message);
    console.error('\nDebugging info:');
    console.error('  Endpoint: ' + PROXY_URL);
    console.error('  Visitor Token: ' + visitorToken);
  }
}

testSpeakToOurTeam();
