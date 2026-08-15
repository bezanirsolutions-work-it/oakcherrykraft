const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const profilePath = path.join(process.cwd(), '.lighthouse-profile');
  const browser = await chromium.launchPersistentContext(profilePath, {
    headless: false,
    viewport: { width: 1440, height: 1200 },
    args: ['--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:4173/admin/login', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  await page.fill('#admin-email', 'oakcherrykraft@gmail.com');
  await page.fill('#admin-password', 'oakcherrykraft');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin', { timeout: 30000 });
  console.log('LOGIN_SUCCESS=' + page.url());
  await page.waitForTimeout(5000);
  await browser.close();
})();
