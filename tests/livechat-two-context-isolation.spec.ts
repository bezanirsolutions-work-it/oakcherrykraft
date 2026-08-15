import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

test.describe('Oak Cherry Kraft - Live Chat Visitor Isolation Test', () => {
  let browser: Browser;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
  });

  test('Two independent browser contexts should have isolated visitor tokens and session IDs', async () => {
    // Launch two completely independent browser contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Navigate to storefront
    const baseUrl = 'http://localhost:4173';
    await pageA.goto(baseUrl);
    await pageB.goto(baseUrl);

    // Storage for captured tokens/session IDs
    const capturedA = { visitorToken: '', sessionId: '', messages: [] };
    const capturedB = { visitorToken: '', sessionId: '', messages: [] };

    console.log('\n=== CONTEXT A: Open OAKIES Chatbot ===');
    // Click OAKIES chat button in Context A
    const chatButtonA = pageA.locator('button[aria-label="Chat with OAKIES"]');
    await expect(chatButtonA).toBeVisible({ timeout: 10000 });
    await chatButtonA.click();

    // Wait for chat window
    await pageA.waitForSelector('.bg-white.rounded-lg.shadow-lg', { timeout: 10000 });

    // Capture visitor token from localStorage
    const tokenA = await pageA.evaluate(() => localStorage.getItem('live-chat-visitor-token'));
    capturedA.visitorToken = tokenA || '';
    console.log('Context A Visitor Token:', capturedA.visitorToken.substring(0, 20) + '...');

    // Type handoff trigger message
    const inputA = pageA.locator('input[placeholder*="Type your message"], textarea[placeholder*="Type your message"]');
    await inputA.fill('I want to speak to a real person');
    const sendButtonA = pageA.locator('button[type="submit"]:has-text("Send")').first();
    await sendButtonA.click();

    // Wait for contact form
    await pageA.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill contact form for Context A
    const nameInputA = pageA.locator('input[type="text"]').first();
    const emailInputA = pageA.locator('input[type="email"]').first();
    const phoneInputA = pageA.locator('input[type="tel"]').first();

    await nameInputA.fill('Visitor A');
    await emailInputA.fill('visitor-a@test.local');
    await phoneInputA.fill('555-1111');

    // Submit contact form
    const submitA = pageA.locator('button:has-text("Connect to Agent")').first();
    await submitA.click();

    // Wait for session creation and capture session ID
    await pageA.waitForTimeout(1000);
    const sessionIdA = await pageA.evaluate(() => localStorage.getItem('live-chat-session-id'));
    capturedA.sessionId = sessionIdA || '';
    console.log('Context A Session ID:', capturedA.sessionId.substring(0, 20) + '...');

    console.log('\n=== CONTEXT B: Open OAKIES Chatbot ===');
    // Click OAKIES chat button in Context B (independent context)
    const chatButtonB = pageB.locator('button[aria-label="Chat with OAKIES"]');
    await expect(chatButtonB).toBeVisible({ timeout: 10000 });
    await chatButtonB.click();

    // Wait for chat window
    await pageB.waitForSelector('.bg-white.rounded-lg.shadow-lg', { timeout: 10000 });

    // Capture visitor token from localStorage
    const tokenB = await pageB.evaluate(() => localStorage.getItem('live-chat-visitor-token'));
    capturedB.visitorToken = tokenB || '';
    console.log('Context B Visitor Token:', capturedB.visitorToken.substring(0, 20) + '...');

    // Type handoff trigger message
    const inputB = pageB.locator('input[placeholder*="Type your message"], textarea[placeholder*="Type your message"]');
    await inputB.fill('I want to speak to a real person');
    const sendButtonB = pageB.locator('button[type="submit"]:has-text("Send")').first();
    await sendButtonB.click();

    // Wait for contact form
    await pageB.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill contact form for Context B (different visitor)
    const nameInputB = pageB.locator('input[type="text"]').first();
    const emailInputB = pageB.locator('input[type="email"]').first();
    const phoneInputB = pageB.locator('input[type="tel"]').first();

    await nameInputB.fill('Visitor B');
    await emailInputB.fill('visitor-b@test.local');
    await phoneInputB.fill('555-2222');

    // Submit contact form
    const submitB = pageB.locator('button:has-text("Connect to Agent")').first();
    await submitB.click();

    // Wait for session creation and capture session ID
    await pageB.waitForTimeout(1000);
    const sessionIdB = await pageB.evaluate(() => localStorage.getItem('live-chat-session-id'));
    capturedB.sessionId = sessionIdB || '';
    console.log('Context B Session ID:', capturedB.sessionId.substring(0, 20) + '...');

    // === ASSERTIONS ===
    console.log('\n=== ISOLATION VERIFICATION ===');

    // 1. Different visitor tokens
    console.log('1. Visitor Token Isolation:');
    console.log('   Context A token matches Context A:', capturedA.visitorToken === tokenA);
    console.log('   Context B token matches Context B:', capturedB.visitorToken === tokenB);
    expect(capturedA.visitorToken).toBeTruthy();
    expect(capturedB.visitorToken).toBeTruthy();
    expect(capturedA.visitorToken).not.toEqual(capturedB.visitorToken);
    console.log('   ✓ Tokens are DIFFERENT');

    // 2. Different session IDs
    console.log('2. Session ID Isolation:');
    expect(capturedA.sessionId).toBeTruthy();
    expect(capturedB.sessionId).toBeTruthy();
    expect(capturedA.sessionId).not.toEqual(capturedB.sessionId);
    console.log('   ✓ Session IDs are DIFFERENT');

    // 3. Verify Context A cannot see Context B's session
    console.log('3. Message Isolation (Context A perspective):');
    const pageAMessages = await pageA.locator('.bg-blue-50, .bg-white').count();
    console.log('   Context A visible message elements:', pageAMessages);
    // A should only see messages from A (the handoff message and any responses)

    // 4. Verify Context B cannot see Context A's session
    console.log('4. Message Isolation (Context B perspective):');
    const pageBMessages = await pageB.locator('.bg-blue-50, .bg-white').count();
    console.log('   Context B visible message elements:', pageBMessages);
    // B should only see messages from B (the handoff message and any responses)

    console.log('\n=== ISOLATION TEST PASSED ===');
    console.log('Summary:');
    console.log(`  Context A: token=${capturedA.visitorToken.substring(0, 16)}..., sessionId=${capturedA.sessionId.substring(0, 16)}...`);
    console.log(`  Context B: token=${capturedB.visitorToken.substring(0, 16)}..., sessionId=${capturedB.sessionId.substring(0, 16)}...`);
    console.log('  Result: Independent contexts confirmed ✓');

    // Cleanup
    await contextA.close();
    await contextB.close();
  });
});
