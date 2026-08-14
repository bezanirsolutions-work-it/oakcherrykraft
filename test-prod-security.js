const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const baseUrl = 'https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy';

async function makeRequest(method, path, body) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:4173'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const resp = await fetch(`${baseUrl}${path}`, options);
    const data = await resp.json();
    return { status: resp.status, data };
  } catch (err) {
    return { error: err.message };
  }
}

async function runTests() {
  console.log('=== PRODUCTION SECURITY VERIFICATION ===\n');
  
  // Test 1: Create session
  console.log('1. Valid session creation...');
  const sessionResp = await makeRequest('POST', '/session', {
    visitor_token: `test-${Math.random().toString(36).slice(2)}`,
    name: 'Test',
    email: 'test@test.com',
    phone: '555'
  });
  
  if (sessionResp.status === 201) {
    console.log('   PASS (201)');
    const sessionId = sessionResp.data.id;
    const visitorToken = sessionResp.data.visitor_token;
    
    // Test 2: Valid visitor message
    console.log('2. Valid visitor message...');
    const msgResp = await makeRequest('POST', '/message', {
      session_id: sessionId,
      visitor_token: visitorToken,
      author: 'visitor',
      content: 'Hello'
    });
    console.log(`   ${msgResp.status === 201 ? 'PASS' : 'FAIL'} (${msgResp.status})`);
    
    // Test 3: Impersonation (agent)
    console.log('3. Block agent impersonation...');
    const impResp = await makeRequest('POST', '/message', {
      session_id: sessionId,
      visitor_token: visitorToken,
      author: 'agent',
      content: 'Hacked'
    });
    console.log(`   ${impResp.status === 400 ? 'PASS' : 'FAIL'} (${impResp.status} - expects 400)`);
    
    // Test 4: Block system impersonation
    console.log('4. Block system impersonation...');
    const sysResp = await makeRequest('POST', '/message', {
      session_id: sessionId,
      visitor_token: visitorToken,
      author: 'system',
      content: 'Hacked'
    });
    console.log(`   ${sysResp.status === 400 ? 'PASS' : 'FAIL'} (${sysResp.status} - expects 400)`);
    
    // Test 5: Block admin impersonation
    console.log('5. Block admin impersonation...');
    const adminResp = await makeRequest('POST', '/message', {
      session_id: sessionId,
      visitor_token: visitorToken,
      author: 'admin',
      content: 'Hacked'
    });
    console.log(`   ${adminResp.status === 400 ? 'PASS' : 'FAIL'} (${adminResp.status} - expects 400)`);
    
    // Test 6: Cross-visitor isolation
    console.log('6. Enforce cross-visitor isolation...');
    const crossResp = await makeRequest('POST', '/message', {
      session_id: sessionId,
      visitor_token: 'different-token',
      author: 'visitor',
      content: 'Hacked'
    });
    console.log(`   ${crossResp.status === 403 ? 'PASS' : 'FAIL'} (${crossResp.status} - expects 403)`);
    
  } else {
    console.log(`   FAIL (${sessionResp.status})`);
    console.log('   Error:', sessionResp.data);
  }
}

runTests().catch(console.error);
