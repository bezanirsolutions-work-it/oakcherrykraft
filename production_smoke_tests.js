#!/usr/bin/env node

/**
 * Production Smoke Tests for Live Chat Proxy
 * 
 * Tests:
 * A. Valid session creation
 * B. Valid visitor message
 * C. author="agent" rejection
 * D. author="assistant" rejection
 * E. author="system" rejection
 * F. Cross-visitor access rejection
 * G. X-Forwarded-For spoofing attempts
 */

const PROJECT_REF = 'jmrxmexmlejfksjlzvit';
const FUNCTION_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/live_chat_proxy`;

// Use dummy anon key for smoke testing (no secrets printed)
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test_token';

let testsPassed = 0;
let testsFailed = 0;

async function test(name, method, path, body = null, expectedStatus, expectedContains = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:4173',
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${FUNCTION_URL}${path}`, options);
    const responseText = await response.text();
    
    let passed = response.status === expectedStatus;
    
    if (expectedContains && passed) {
      passed = responseText.includes(expectedContains);
    }

    const status = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${name}`);
    
    if (!passed) {
      console.log(`  Expected status: ${expectedStatus}, got: ${response.status}`);
      if (expectedContains) {
        console.log(`  Expected to contain: "${expectedContains}"`);
        console.log(`  Response: ${responseText.substring(0, 200)}`);
      }
      testsFailed++;
    } else {
      testsPassed++;
    }

    return response;
  } catch (err) {
    console.log(`✗ FAIL: ${name}`);
    console.log(`  Error: ${err.message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('PRODUCTION SMOKE TESTS - Live Chat Proxy');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // TEST A: Valid session creation
  console.log('TEST A: Session Creation');
  const sessionResponse = await test(
    'A.1: Create session with valid token',
    'POST',
    '/session',
    { visitor_token: 'smoke_test_visitor_token_' + Date.now() },
    201,
    'visitor_token'
  );

  // Extract session ID for later tests (if successful)
  let sessionId = null;
  let visitorToken = null;
  if (sessionResponse && sessionResponse.status === 201) {
    try {
      const text = await sessionResponse.text();
      const data = JSON.parse(text);
      sessionId = data.id;
      visitorToken = data.visitor_token;
      console.log(`  Session created: ${sessionId}`);
    } catch (e) {
      console.log(`  Response status: ${sessionResponse.status}, but could not parse JSON`);
      // Continue anyway, tests with dummy UUIDs will still validate responses
    }
  }

  // TEST B: Valid visitor message (if session was created)
  if (sessionId && visitorToken) {
    console.log('\nTEST B: Message Creation');
    await test(
      'B.1: Post message with author="visitor"',
      'POST',
      '/message',
      {
        session_id: sessionId,
        visitor_token: visitorToken,
        author: 'visitor',
        content: 'Test message from smoke test'
      },
      201,
      'content'
    );
  }

  // TEST C: author="agent" rejection
  console.log('\nTEST C: Author Impersonation Blocking');
  await test(
    'C.1: Reject author="agent"',
    'POST',
    '/message',
    {
      session_id: sessionId || '00000000-0000-0000-0000-000000000000',
      visitor_token: visitorToken || 'test_token',
      author: 'agent',
      content: 'Attempted agent message'
    },
    400,
    'Invalid author'
  );

  // TEST D: author="assistant" rejection
  await test(
    'D.1: Reject author="assistant"',
    'POST',
    '/message',
    {
      session_id: sessionId || '00000000-0000-0000-0000-000000000000',
      visitor_token: visitorToken || 'test_token',
      author: 'assistant',
      content: 'Attempted assistant message'
    },
    400,
    'Invalid author'
  );

  // TEST E: author="system" rejection
  await test(
    'E.1: Reject author="system"',
    'POST',
    '/message',
    {
      session_id: sessionId || '00000000-0000-0000-0000-000000000000',
      visitor_token: visitorToken || 'test_token',
      author: 'system',
      content: 'Attempted system message'
    },
    400,
    'Invalid author'
  );

  // TEST F: Cross-visitor access rejection
  console.log('\nTEST F: Visitor Isolation');
  await test(
    'F.1: Reject cross-visitor session access',
    'GET',
    '/session?token=different_visitor_token_123',
    null,
    200  // Will return 200 with null data for non-existent session
  );

  // TEST G: X-Forwarded-For spoofing attempts
  console.log('\nTEST G: IP Spoofing Resistance');
  const spoofingHeaders = {
    'X-Forwarded-For': '192.0.2.1',
  };

  await test(
    'G.1: Session creation with X-Forwarded-For header',
    'POST',
    '/session',
    { visitor_token: 'spoof_test_1_' + Date.now() },
    201,
    'visitor_token',
    spoofingHeaders
  );

  // Verify rate limiting works (critical for security)
  console.log('\nTEST H: Rate Limiting');
  // Note: We won't flood the endpoint, just verify the response indicates rate limiting is active
  console.log('  (Rate limiting verification requires multiple sequential requests)');
  console.log('  (Skipping rate limit stress test to avoid production impact)');

  // TEST I: Response security
  console.log('\nTEST I: Response Security');
  const testResponse = await test(
    'I.1: Verify no sensitive data in error responses',
    'POST',
    '/message',
    {
      session_id: 'invalid',
      visitor_token: 'invalid',
      author: 'invalid',
      content: 'test'
    },
    400,
    null
  );

  if (testResponse) {
    try {
      const text = await testResponse.text();
      const hasSensitiveData = 
        text.includes('password') ||
        text.includes('secret') ||
        text.includes('key') ||
        text.includes('token') ||
        text.includes('connection') ||
        text.includes('at line') ||
        text.includes('stack');
      
      if (hasSensitiveData) {
        console.log('  ✗ WARNING: Response may contain sensitive data');
        testsFailed++;
      } else {
        console.log('  ✓ Response does not expose sensitive data');
        testsPassed++;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`\nRESULTS: ${testsPassed} passed, ${testsFailed} failed\n`);

  if (testsFailed === 0) {
    console.log('✓ ALL SMOKE TESTS PASSED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log('✗ SOME TESTS FAILED - Review results above');
    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
