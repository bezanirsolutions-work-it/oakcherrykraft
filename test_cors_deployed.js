/**
 * Test: Check if deployed Edge Function has CORS fix
 */

const PROXY_URL = 'https://jmrxmexmlejfksjlzvit.supabase.co/functions/v1/live_chat_proxy';

async function testCORS() {
  console.log('Testing CORS configuration on deployed Edge Function...\n');
  
  try {
    // Make OPTIONS request to check CORS headers
    const response = await fetch(`${PROXY_URL}/session`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:4173',
      },
    });
    
    console.log('OPTIONS Response Status:', response.status);
    console.log('Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
    
    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    
    if (allowOrigin === 'http://localhost:4173') {
      console.log('\n✓ CORS FIX DEPLOYED: localhost:4173 is now in ALLOWED_ORIGINS');
    } else if (allowOrigin === 'null') {
      console.log('\n✗ CORS FIX NOT DEPLOYED: Still returning "null"');
      console.log('   The Edge Function needs to be redeployed.');
    } else {
      console.log('\n⚠ Unexpected CORS header:', allowOrigin);
    }
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testCORS();
