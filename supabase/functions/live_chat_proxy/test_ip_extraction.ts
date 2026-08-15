/**
 * CRITICAL-1 IP Extraction Security Test
 * 
 * This test verifies that the rate limiter's IP extraction logic cannot be bypassed
 * by an attacker manipulating the X-Forwarded-For header.
 * 
 * Environment: LOCAL / STATIC ONLY
 * No production systems contacted.
 */

// Extracted from index.ts for isolated testing
function normalizeClientIp(value: string | null): string | null {
  if (!value) return null;

  const candidate = value.trim();
  if (!candidate || candidate === 'unknown') {
    return null;
  }

  const normalized = candidate
    .replace(/^\[|\]$/g, '')
    .replace(/\/$/, '');

  if (!normalized || normalized.includes(' ') || !/^[0-9A-Fa-f:.]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function getClientIp(headers: Map<string, string>): string {
  // The browser can set proxy headers arbitrarily, so we never trust x-forwarded-for as a
  // client-chosen identity. Prefer platform-provided headers that are normally populated by a
  // trusted proxy or CDN, and fall back to a shared anonymous bucket when no trusted source exists.
  for (const headerName of ['cf-connecting-ip', 'x-real-ip']) {
    const normalized = normalizeClientIp(headers.get(headerName));
    if (normalized) {
      return normalized;
    }
  }

  return 'unknown';
}

// ============================================================================
// TEST SUITE
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  explanation: string;
}

const results: TestResult[] = [];

function test(name: string, expected: string, actual: string, explanation: string) {
  const passed = expected === actual;
  results.push({ name, passed, expected, actual, explanation });
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: ${name}`);
  if (!passed) {
    console.log(`  Expected: ${expected}`);
    console.log(`  Got:      ${actual}`);
  }
  console.log(`  Reason: ${explanation}`);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('CRITICAL-1 IP SPOOFING REGRESSION TEST');
console.log('═══════════════════════════════════════════════════════════════\n');

// TEST A: No forwarded headers
console.log('TEST A: No forwarded headers');
{
  const headers = new Map<string, string>();
  const ip = getClientIp(headers);
  test(
    'TEST A.1: Empty headers map',
    'unknown',
    ip,
    'When no proxy headers exist, fallback to "unknown" identity. This prevents attacker from spoofing any real IP.'
  );
}

// TEST B: Single X-Forwarded-For
console.log('\nTEST B: Single X-Forwarded-For header (attacker spoofing)');
{
  const headers = new Map<string, string>([
    ['x-forwarded-for', '1.1.1.1']
  ]);
  const ip = getClientIp(headers);
  test(
    'TEST B.1: X-Forwarded-For: 1.1.1.1',
    'unknown',
    ip,
    'X-Forwarded-For is client-controlled and untrusted. Must NOT use 1.1.1.1 as rate-limit identity.'
  );
}

// TEST C: Multiple X-Forwarded-For values
console.log('\nTEST C: Multiple X-Forwarded-For values');
{
  const headers = new Map<string, string>([
    ['x-forwarded-for', '2.2.2.2, 3.3.3.3, 4.4.4.4']
  ]);
  const ip = getClientIp(headers);
  test(
    'TEST C.1: X-Forwarded-For chain',
    'unknown',
    ip,
    'X-Forwarded-For with multiple IPs is not trusted. Cannot extract any IP from this header chain.'
  );
}

// TEST D: X-Real-IP (trusted upstream, but should be validated)
console.log('\nTEST D: X-Real-IP header (considered trusted)');
{
  const headers = new Map<string, string>([
    ['x-real-ip', '8.8.8.8']
  ]);
  const ip = getClientIp(headers);
  test(
    'TEST D.1: X-Real-IP: 8.8.8.8',
    '8.8.8.8',
    ip,
    'X-Real-IP is checked as a trusted upstream source (typically from nginx, load balancer). Should be used if provided.'
  );
}

// TEST E: CF-Connecting-IP (Cloudflare, highest priority)
console.log('\nTEST E: CF-Connecting-IP header (Cloudflare, highest trust)');
{
  const headers = new Map<string, string>([
    ['cf-connecting-ip', '9.9.9.9']
  ]);
  const ip = getClientIp(headers);
  test(
    'TEST E.1: CF-Connecting-IP: 9.9.9.9',
    '9.9.9.9',
    ip,
    'CF-Connecting-IP is Cloudflare\'s own client IP (highest priority). Should be used when available.'
  );
}

// TEST F: Both CF-Connecting-IP and X-Real-IP (CF should win)
console.log('\nTEST F: Both CF-Connecting-IP and X-Real-IP present');
{
  const headers = new Map<string, string>([
    ['cf-connecting-ip', '10.0.0.1'],
    ['x-real-ip', '10.0.0.2']
  ]);
  const ip = getClientIp(headers);
  test(
    'TEST F.1: CF takes priority',
    '10.0.0.1',
    ip,
    'CF-Connecting-IP is checked first in the loop, so it should be used when both headers exist.'
  );
}

// TEST G: CF-Connecting-IP + X-Forwarded-For (attacker tries to pollute)
console.log('\nTEST G: CF-Connecting-IP with X-Forwarded-For present');
{
  const headers = new Map<string, string>([
    ['cf-connecting-ip', '11.11.11.11'],
    ['x-forwarded-for', '99.99.99.99']
  ]);
  const ip = getClientIp(headers);
  test(
    'TEST G.1: CF-Connecting-IP takes precedence',
    '11.11.11.11',
    ip,
    'CF-Connecting-IP is trustworthy and checked first. X-Forwarded-For is ignored completely.'
  );
}

// TEST H: IPv6 normalization
console.log('\nTEST H: IPv6 address normalization');
{
  const headers = new Map<string, string>([
    ['x-real-ip', '[2001:db8::1]']
  ]);
  const ip = getClientIp(headers);
  test(
    'TEST H.1: IPv6 with brackets',
    '2001:db8::1',
    ip,
    'IPv6 addresses in brackets should be normalized (brackets removed).'
  );
}

// TEST I: Malformed X-Real-IP
console.log('\nTEST I: Malformed header values');
{
  const headers = new Map<string, string>([
    ['x-real-ip', 'invalid@#$%']
  ]);
  const ip = getClientIp(headers);
  test(
    'TEST I.1: Invalid X-Real-IP',
    'unknown',
    ip,
    'Invalid characters in IP should be rejected by normalizeClientIp validation.'
  );
}

// TEST J: Attacker tries multiple different X-Forwarded-For values to bypass rate limit
console.log('\nTEST J: Attacker spoofing attack simulation');
{
  const testIps = [
    '200.100.50.1',
    '200.100.50.2',
    '200.100.50.3',
    '200.100.50.4',
    '200.100.50.5',
  ];
  
  let allFallbackToUnknown = true;
  for (const testIp of testIps) {
    const headers = new Map<string, string>([
      ['x-forwarded-for', testIp]
    ]);
    const result = getClientIp(headers);
    if (result !== 'unknown') {
      allFallbackToUnknown = false;
    }
  }
  
  test(
    'TEST J.1: All spoofed X-Forwarded-For values ignored',
    'true',
    String(allFallbackToUnknown),
    'Attacker sends 5 different X-Forwarded-For values. All must fall back to "unknown" rate-limit identity, meaning no new buckets are created.'
  );
}

// TEST K: normalizeClientIp security checks
console.log('\nTEST K: normalizeClientIp validation');
{
  const testCases = [
    { input: '192.168.1.1', expected: '192.168.1.1', desc: 'Valid IPv4' },
    { input: 'unknown', expected: null, desc: 'String "unknown" rejected' },
    { input: '', expected: null, desc: 'Empty string rejected' },
    { input: '   ', expected: null, desc: 'Whitespace only rejected' },
    { input: '192.168.1.1 extra', expected: null, desc: 'Spaces within value rejected' },
    { input: '192.168.1.999', expected: '192.168.1.999', desc: 'Syntax validated (octet overflow unchecked but string passes regex)' },
  ];
  
  for (const tc of testCases) {
    const result = normalizeClientIp(tc.input);
    test(
      `TEST K.${tc.desc}`,
      String(tc.expected),
      String(result),
      `normalizeClientIp validation: ${tc.desc}`
    );
  }
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════════');
const passed = results.filter(r => r.passed).length;
const total = results.length;
const failedTests = results.filter(r => !r.passed);

console.log(`\nRESULTS: ${passed}/${total} tests passed\n`);

if (failedTests.length > 0) {
  console.log('FAILED TESTS:');
  for (const test of failedTests) {
    console.log(`  - ${test.name}: expected "${test.expected}", got "${test.actual}"`);
  }
  console.log('\n✗ CRITICAL-1 REGRESSION TEST: FAIL\n');
  Deno.exit(1);
} else {
  console.log('✓ All tests passed.\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CRITICAL-1 REGRESSION TEST: PASS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  Deno.exit(0);
}
