import { chromium } from 'playwright';
import * as fs from 'fs';

async function capturePerformanceTrace() {
  const browser = await chromium.launch();
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  // Set mobile device emulation (iPhone 12)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  );

  // Apply throttling to match Lighthouse Slow 4G
  // Slow 4G: 400 Kbps down, 20 Kbps up, 150ms latency
  const client = await context.newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 400 * 1024 / 8, // 50 KB/s
    uploadThroughput: 20 * 1024 / 8,    // 2.5 KB/s
    latency: 150
  });

  console.log('Starting performance trace capture...');
  console.log('Configuration: Mobile (390x844), Slow 4G throttling (400Kbps, 150ms latency)');

  // Start collecting performance metrics
  const metrics = {};
  
  // Capture navigation timing
  page.on('framenavigated', async () => {
    try {
      const navigationTiming = await page.evaluate(() => {
        const timing = window.performance.timing;
        return {
          navigationStart: timing.navigationStart,
          fetchStart: timing.fetchStart,
          domLoading: timing.domLoading,
          domInteractive: timing.domInteractive,
          domComplete: timing.domComplete,
          loadEventStart: timing.loadEventStart,
          loadEventEnd: timing.loadEventEnd
        };
      });
      Object.assign(metrics, { navigationTiming });
    } catch (e) {
      console.log('Navigation timing capture skipped');
    }
  });

  // Start performance recording
  await client.send('Performance.enable');
  
  try {
    // Navigate to products page
    const navigationStart = Date.now();
    console.log(`\n[${navigationStart}] Starting navigation to http://localhost:4181/products`);
    
    await page.goto('http://localhost:4181/products', { waitUntil: 'networkidle' });
    
    const navigationEnd = Date.now();
    console.log(`[${navigationEnd}] Page load completed (${navigationEnd - navigationStart}ms elapsed)`);

    // Get performance entries
    const perfData = await page.evaluate(() => {
      const entries = performance.getEntries();
      return {
        navigationTiming: performance.timing,
        entries: entries.map(e => ({
          name: e.name,
          type: e.entryType,
          startTime: e.startTime,
          duration: e.duration,
          initiatorType: (e as any).initiatorType
        }))
      };
    });

    // Get First Contentful Paint, Largest Contentful Paint, etc
    const webVitals = await page.evaluate(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      const lcp = performance.getEntriesByType('largest-contentful-paint').pop();
      const resources = performance.getEntriesByType('resource').filter(e => 
        e.name.includes('localhost:4181')
      );
      
      return {
        fcp: fcp ? fcp.startTime : null,
        lcp: lcp ? lcp.startTime : null,
        resources: resources.map(r => ({
          name: r.name.replace('http://localhost:4181', ''),
          type: r.initiatorType,
          startTime: r.startTime,
          responseStart: (r as any).responseStart,
          responseEnd: (r as any).responseEnd,
          duration: r.duration,
          transferSize: (r as any).transferSize,
          decodedBodySize: (r as any).decodedBodySize
        }))
      };
    });

    // Also check for window.__perfData from our instrumentation
    const perfInstrumentation = await page.evaluate(() => {
      return (window as any).__perfData || null;
    });

    // Get all DOM nodes count
    const domInfo = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const articles = document.querySelectorAll('article');
      const firstImage = document.querySelector('article img');
      
      return {
        totalImages: images.length,
        productCards: articles.length,
        firstImageSrc: firstImage?.getAttribute('src'),
        firstImageNaturalDimensions: firstImage ? {
          width: (firstImage as HTMLImageElement).naturalWidth,
          height: (firstImage as HTMLImageElement).naturalHeight,
          complete: (firstImage as HTMLImageElement).complete,
          currentSrc: (firstImage as HTMLImageElement).currentSrc
        } : null
      };
    });

    // Collect the performance trace
    const traceData = await client.send('Performance.getMetrics');

    console.log('\n=== PERFORMANCE TRACE SUMMARY ===\n');
    console.log(`FCP: ${webVitals.fcp?.toFixed(0)}ms`);
    console.log(`LCP: ${webVitals.lcp?.toFixed(0)}ms`);
    console.log(`\nDOM Info:`);
    console.log(`  Product Cards: ${domInfo.productCards}`);
    console.log(`  Images: ${domInfo.totalImages}`);
    console.log(`  First Image Complete: ${domInfo.firstImageNaturalDimensions?.complete}`);
    console.log(`  First Image Size: ${domInfo.firstImageNaturalDimensions?.width}x${domInfo.firstImageNaturalDimensions?.height}`);

    console.log(`\nResource Timeline (first 15):`);
    webVitals.resources.slice(0, 15).forEach((r, i) => {
      console.log(`  ${i + 1}. [${r.startTime.toFixed(0)}ms] ${r.name} (${r.type}, ${r.duration.toFixed(0)}ms)`);
    });

    console.log(`\nPerf Instrumentation Data (if available):`);
    if (perfInstrumentation) {
      console.log(JSON.stringify(perfInstrumentation, null, 2));
    }

    // Save detailed trace to file
    const trace = {
      timestamp: new Date().toISOString(),
      configuration: {
        viewport: '390x844 (mobile)',
        throttling: 'Slow 4G (400Kbps, 150ms latency)',
        userAgent: 'iPhone 12'
      },
      navigationTiming: perfData.navigationTiming,
      fcp: webVitals.fcp,
      lcp: webVitals.lcp,
      resources: webVitals.resources,
      perfInstrumentation: perfInstrumentation,
      domInfo: domInfo,
      metrics: traceData
    };

    fs.writeFileSync(
      'lighthouse-phase7-performance-trace.json',
      JSON.stringify(trace, null, 2)
    );

    console.log('\n✅ Detailed trace saved to: lighthouse-phase7-performance-trace.json');

  } catch (error) {
    console.error('Error during trace capture:', error);
  } finally {
    await browser.close();
  }
}

capturePerformanceTrace().catch(console.error);
