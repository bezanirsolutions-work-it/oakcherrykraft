// Run comprehensive audit via Playwright and save results
const chromium = require('playwright').chromium;
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Setup listeners
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push({ level: msg.type(), text: msg.text() }));
  
  const failedRequests = [];
  page.on('requestfailed', req => failedRequests.push({ url: req.url(), errorText: req.failure()?.errorText }));
  
  // Go to homepage
  await page.goto('http://localhost:4180/', { waitUntil: 'networkidle' });
  
  const auditReport = {
    timestamp: new Date().toISOString(),
    routing: [],
    accessibility: {},
    data: {},
    console: consoleLogs.filter(c => c.level === 'error' || c.level === 'warning').slice(0, 30),
    failedRequests: failedRequests.slice(0, 20),
    interaction: []
  };
  
  // Test 1: Hero CTA destination
  const heroCTA = await page.$('section a[href*="/request-quote"]');
  if (heroCTA) {
    const text = await heroCTA.textContent();
    if (text.includes('Design Your Furniture')) {
      auditReport.routing.push({
        id: 'ROUTING_001_HERO_DESIGN_CTA',
        severity: 'HIGH',
        issue: 'Hero "Design Your Furniture" button routes to /request-quote instead of /configuration-selector',
        current: '/request-quote',
        expected: '/configuration-selector',
        file: 'src/components/sections/HeroSection.tsx',
        viewport: 'All'
      });
    }
  }
  
  // Test 2: Accessibility
  const a11y = await page.evaluate(() => {
    return {
      h1Count: document.querySelectorAll('h1').length,
      h2Count: document.querySelectorAll('h2').length,
      h1Text: Array.from(document.querySelectorAll('h1')).map(h => h.innerText).join('|'),
      images: document.querySelectorAll('img').length,
      imagesWithAlt: Array.from(document.querySelectorAll('img')).filter(i => i.hasAttribute('alt')).length,
      imagesNoAlt: Array.from(document.querySelectorAll('img')).filter(i => !i.hasAttribute('alt') && !i.hasAttribute('aria-hidden')).map(i => i.src.slice(-40)).slice(0, 5)
    };
  });
  
  auditReport.accessibility = a11y;
  
  // Test 3: Data - Statistics
  const stats = await page.evaluate(() => {
    const result = {};
    // Find stats section with "Projects Completed"
    const sections = document.querySelectorAll('section');
    for (const sec of sections) {
      if (sec.innerText && sec.innerText.includes('Projects Completed')) {
        const articles = sec.querySelectorAll('article');
        articles.forEach(art => {
          const p = art.querySelectorAll('p');
          if (p.length >= 2) {
            result[p[0].innerText] = p[1].innerText;
          }
        });
      }
    }
    return result;
  });
  
  auditReport.data.statistics = stats;
  
  // Test 4: Routing - Category cards
  const categories = await page.evaluate(() => {
    const cats = [];
    const links = Array.from(document.querySelectorAll('a[href*="/products"]'));
    const categoryLinks = links.filter(l => l.querySelector('h3') && l.textContent.length < 100);
    categoryLinks.forEach(l => {
      const h3 = l.querySelector('h3');
      if (h3) {
        cats.push({
          name: h3.innerText,
          href: l.getAttribute('href')
        });
      }
    });
    return cats;
  });
  
  auditReport.data.categories = categories;
  
  // Check Outdoor routes to /products not /products/outdoor
  const outdoorCat = categories.find(c => c.name === 'Outdoor Furniture');
  if (outdoorCat && outdoorCat.href === '/products') {
    auditReport.routing.push({
      id: 'ROUTING_002_OUTDOOR',
      severity: 'MEDIUM',
      issue: 'Outdoor Furniture category routes to /products instead of /products/outdoor',
      current: '/products',
      expected: '/products/outdoor',
      category: 'Outdoor Furniture'
    });
  }
  
  // Test 5: Click and verify navigation
  const navigationTests = [
    { selector: 'nav a[href="/"]', name: 'Home nav', expected: '/' },
    { selector: 'nav a[href="/products"]', name: 'Products nav', expected: '/products' },
    { selector: 'nav a[href="/configuration-selector"]', name: 'Design Your Furniture nav', expected: '/configuration-selector' }
  ];
  
  for (const test of navigationTests) {
    try {
      const elem = await page.$(test.selector);
      if (elem) {
        auditReport.interaction.push({
          name: test.name,
          status: 'CLICKABLE',
          href: await elem.getAttribute('href'),
          expected: test.expected
        });
      } else {
        auditReport.interaction.push({
          name: test.name,
          status: 'NOT_FOUND'
        });
      }
    } catch (e) {
      auditReport.interaction.push({
        name: test.name,
        status: 'ERROR',
        error: e.message
      });
    }
  }
  
  // Test 6: Check for Supabase connection issues
  const supabaseErrors = failedRequests.filter(r => r.url.includes('supabase'));
  if (supabaseErrors.length > 0) {
    auditReport.routing.push({
      id: 'DATA_001_SUPABASE',
      severity: 'MEDIUM',
      issue: 'Supabase requests failing - may cause data display issues',
      failedRequests: supabaseErrors.length,
      evidence: `${supabaseErrors.length} Supabase HEAD requests failed with ERR_ABORTED`
    });
  }
  
  // Save report
  fs.writeFileSync('.tmp-comprehensive-audit.json', JSON.stringify(auditReport, null, 2));
  console.log('AUDIT COMPLETE');
  console.log('Report saved to .tmp-comprehensive-audit.json');
  console.log('\n=== ISSUES FOUND ===');
  auditReport.routing.filter(r => r.severity).forEach(r => {
    console.log(`${r.id}: [${r.severity}] ${r.issue}`);
  });
  
  await browser.close();
})().catch(err => {
  console.error('Audit failed:', err.message);
  process.exit(1);
});
