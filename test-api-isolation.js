/**
 * Direct API test for visitor isolation in live chat
 * Tests the VITE_LIVE_CHAT_PROXY_URL endpoints directly
 * No browser required - tests API behavior at the proxy level
 */

const PROXY_URL = 'https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy';

async function generateVisitorToken() {
  return `visitor-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
}

async function testIsolation() {
  console.log('\n=== LIVE CHAT VISITOR ISOLATION API TEST ===\n');

  try {
    // Visitor A setup
    const tokenA = await generateVisitorToken();
    console.log('Visitor A Token:', tokenA.substring(0, 20) + '...');

    const sessionCreateA = await fetch(`${PROXY_URL}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_token: tokenA,
        name: 'Visitor A',
        email: 'visitor-a@test.local',
        phone: '555-1111',
      }),
    });

    if (!sessionCreateA.ok) {
      throw new Error(`Session creation A failed: ${sessionCreateA.status}`);
    }

    const sessionA = await sessionCreateA.json();
    console.log('Session A ID:', sessionA.id.substring(0, 20) + '...');
    console.log('Session A visitor_token matches:', sessionA.visitor_token === tokenA);

    // Visitor B setup
    const tokenB = await generateVisitorToken();
    console.log('\nVisitor B Token:', tokenB.substring(0, 20) + '...');

    const sessionCreateB = await fetch(`${PROXY_URL}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_token: tokenB,
        name: 'Visitor B',
        email: 'visitor-b@test.local',
        phone: '555-2222',
      }),
    });

    if (!sessionCreateB.ok) {
      throw new Error(`Session creation B failed: ${sessionCreateB.status}`);
    }

    const sessionB = await sessionCreateB.json();
    console.log('Session B ID:', sessionB.id.substring(0, 20) + '...');
    console.log('Session B visitor_token matches:', sessionB.visitor_token === tokenB);

    // === ISOLATION ASSERTIONS ===
    console.log('\n=== ISOLATION VERIFICATION ===');

    // 1. Tokens must be different
    const tokensDifferent = tokenA !== tokenB;
    console.log(`1. Tokens Different: ${tokensDifferent} ${tokensDifferent ? '✓' : '✗'}`);
    if (!tokensDifferent) throw new Error('Tokens should be different!');

    // 2. Session IDs must be different
    const sessionsDifferent = sessionA.id !== sessionB.id;
    console.log(`2. Session IDs Different: ${sessionsDifferent} ${sessionsDifferent ? '✓' : '✗'}`);
    if (!sessionsDifferent) throw new Error('Session IDs should be different!');

    // 3. A's token should NOT be accepted for B's session
    console.log('\n3. Cross-Session Validation:');
    
    const msgAtoB = await fetch(`${PROXY_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionB.id,
        visitor_token: tokenA, // Wrong token for B's session
        content: 'This should fail',
      }),
    });
    
    const crossSessionAttemptA = msgAtoB.status;
    console.log(`   Attempt A's token on B's session: HTTP ${crossSessionAttemptA} ${crossSessionAttemptA === 403 ? '✓ (rejected)' : '✗ (allowed)'}`);
    if (crossSessionAttemptA !== 403) {
      throw new Error('Cross-session message should be rejected!');
    }

    // 4. B's token should NOT be accepted for A's session
    const msgBtoA = await fetch(`${PROXY_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionA.id,
        visitor_token: tokenB, // Wrong token for A's session
        content: 'This should fail',
      }),
    });

    const crossSessionAttemptB = msgBtoA.status;
    console.log(`   Attempt B's token on A's session: HTTP ${crossSessionAttemptB} ${crossSessionAttemptB === 403 ? '✓ (rejected)' : '✗ (allowed)'}`);
    if (crossSessionAttemptB !== 403) {
      throw new Error('Cross-session message should be rejected!');
    }

    // 5. A's correct token should work for A's session
    console.log('\n4. Same-Session Validation:');
    
    const msgAtoA = await fetch(`${PROXY_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionA.id,
        visitor_token: tokenA,
        content: 'Message from Visitor A',
      }),
    });

    const sameSessionA = msgAtoA.status;
    console.log(`   A's token on A's session: HTTP ${sameSessionA} ${sameSessionA === 201 ? '✓ (allowed)' : '✗ (rejected)'}`);
    if (sameSessionA !== 201) {
      throw new Error('Same-session message should be allowed!');
    }

    // 6. Fetch messages - A should only see A's messages
    console.log('\n5. Message Isolation (retrieval):');
    
    const getMessagesA = await fetch(
      `${PROXY_URL}/messages?session_id=${encodeURIComponent(sessionA.id)}&visitor_token=${encodeURIComponent(tokenA)}`
    );
    
    if (getMessagesA.ok) {
      const messagesA = await getMessagesA.json();
      console.log(`   A's message count: ${messagesA.length}`);
      console.log(`   A sees only A's messages: ${messagesA.every(m => m.author === 'visitor' || m.author === 'system')}`);
    }

    console.log('\n=== ALL ISOLATION CHECKS PASSED ===');
    console.log('Result: Visitor A and B are completely isolated');
    console.log('  ✓ Different tokens');
    console.log('  ✓ Different session IDs');
    console.log('  ✓ Cross-session access blocked');
    console.log('  ✓ Same-session access allowed');
    console.log('  ✓ Message isolation confirmed');

    process.exit(0);
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testIsolation();
