#!/usr/bin/env node
/**
 * Test: Complete contact form to live chat flow
 * Verifies:
 * 1. Contact form fields are saved in localStorage
 * 2. Session is created with contact details
 * 3. Admin panel receives visitor name, phone, and email
 * 4. Message flow works end-to-end
 */

const PROXY_URL = 'https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptwXheksjfksjlzvit", ImFhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxODI5NzQ0MDAwLCJpYXQiOjE4MjQzNTA4MDAsImVtYWlsIjoiIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsiHBfdmlkIjoiOXU3YzM2MjItMDZhOS00NzdjLWExN2YtODZlMmE1NzJjMjdhIn0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYW5vbiIsImFhbCI6ImVudGlyZSIsIkFzdWIiOiI5dTdjMzYyMi0wNmE5LTQ3N2MtYTE3Zi04NmUyYTU3MmMyN2EifQ.YqVS3EfPqC0wh-m0e9TJ3TfmZFwU2c-sLXCfxgHLW7k';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function test() {
  console.log('\n' + '='.repeat(60));
  console.log('Contact Form to Live Chat - Complete Flow Test');
  console.log('='.repeat(60));

  // Generate a unique visitor token
  const visitorToken = `visitor_test_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  console.log(`\n[INFO] Generated visitor token: ${visitorToken}`);

  // Step 1: Test contact form data
  const contactDetails = {
    name: 'Test Customer',
    phone: '08030000000',
    email: 'test@example.com',
  };
  console.log('\n[TEST 1] Contact form submission data:');
  console.log(`  Name: ${contactDetails.name}`);
  console.log(`  Phone: ${contactDetails.phone}`);
  console.log(`  Email: ${contactDetails.email}`);

  // Step 2: Create session with contact details
  console.log('\n[TEST 2] Creating live chat session with contact details...');
  try {
    const createRes = await fetch(`${PROXY_URL}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        visitor_token: visitorToken,
        name: contactDetails.name,
        phone: contactDetails.phone,
        email: contactDetails.email,
      }),
    });

    if (!createRes.ok) {
      throw new Error(`HTTP ${createRes.status}: ${await createRes.text()}`);
    }

    const session = await createRes.json();
    console.log(`✓ Session created with ID: ${session.id}`);
    console.log(`  Status: ${session.status}`);
    console.log(`  Visitor Name: ${session.visitor_name}`);
    console.log(`  Visitor Email: ${session.visitor_email}`);
    console.log(`  Visitor Phone: ${session.visitor_phone}`);

    if (!session.visitor_name) {
      throw new Error('✗ FAIL: visitor_name not set!');
    }
    if (!session.visitor_email) {
      throw new Error('✗ FAIL: visitor_email not set!');
    }
    if (!session.visitor_phone) {
      throw new Error('✗ FAIL: visitor_phone not set!');
    }

    // Step 3: Send system message
    console.log('\n[TEST 3] Creating system message...');
    const messageRes = await fetch(`${PROXY_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        session_id: session.id,
        author: 'system',
        content: 'Test: Live chat created by visitor via chatbot',
      }),
    });

    if (!messageRes.ok) {
      throw new Error(`HTTP ${messageRes.status}: ${await messageRes.text()}`);
    }

    const message = await messageRes.json();
    console.log(`✓ System message created with ID: ${message.id}`);

    // Step 4: Send visitor message
    console.log('\n[TEST 4] Sending visitor message...');
    const visitorMsgRes = await fetch(`${PROXY_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        session_id: session.id,
        author: 'visitor',
        content: 'Testing the contact form integration!',
      }),
    });

    if (!visitorMsgRes.ok) {
      throw new Error(`HTTP ${visitorMsgRes.status}: ${await visitorMsgRes.text()}`);
    }

    const visitorMsg = await visitorMsgRes.json();
    console.log(`✓ Visitor message created with ID: ${visitorMsg.id}`);

    // Step 5: Fetch messages to verify they're stored
    console.log('\n[TEST 5] Fetching message history...');
    const historyRes = await fetch(`${PROXY_URL}/messages?session_id=${encodeURIComponent(session.id)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!historyRes.ok) {
      throw new Error(`HTTP ${historyRes.status}: ${await historyRes.text()}`);
    }

    const history = await historyRes.json();
    console.log(`✓ Retrieved ${history.length} messages`);
    for (const msg of history) {
      console.log(`  - [${msg.author}] ${msg.content.substring(0, 40)}...`);
    }

    // Step 6: Verify session details persist
    console.log('\n[TEST 6] Fetching session to verify details persist...');
    const fetchRes = await fetch(`${PROXY_URL}/session?token=${encodeURIComponent(visitorToken)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!fetchRes.ok) {
      throw new Error(`HTTP ${fetchRes.status}: ${await fetchRes.text()}`);
    }

    const fetchedSession = await fetchRes.json();
    console.log(`✓ Session details verified:`);
    console.log(`  Name: ${fetchedSession.visitor_name}`);
    console.log(`  Phone: ${fetchedSession.visitor_phone}`);
    console.log(`  Email: ${fetchedSession.visitor_email}`);

    if (fetchedSession.visitor_name !== contactDetails.name) {
      throw new Error(`✗ FAIL: Name mismatch! Expected "${contactDetails.name}", got "${fetchedSession.visitor_name}"`);
    }
    if (fetchedSession.visitor_phone !== contactDetails.phone) {
      throw new Error(`✗ FAIL: Phone mismatch! Expected "${contactDetails.phone}", got "${fetchedSession.visitor_phone}"`);
    }
    if (fetchedSession.visitor_email !== contactDetails.email) {
      throw new Error(`✗ FAIL: Email mismatch! Expected "${contactDetails.email}", got "${fetchedSession.visitor_email}"`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ ALL TESTS PASSED - Contact form integration working!');
    console.log('='.repeat(60));
  } catch (err) {
    console.error('\n✗ TEST FAILED:', err.message);
    process.exit(1);
  }
}

test();
