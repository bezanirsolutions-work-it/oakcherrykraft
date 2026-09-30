const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');
const spaPath = path.join(distDir, 'spa.html');
const vitePath = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

async function waitForPreview(url, preview, getSpawnError) {
  const started = Date.now();

  while (Date.now() - started < 60000) {
    const spawnError = getSpawnError();
    if (spawnError) {
      throw new Error(`Unable to start Vite preview: ${spawnError.message}`);
    }

    if (preview.exitCode !== null || preview.signalCode !== null) {
      throw new Error(`Vite preview exited with code ${preview.exitCode ?? preview.signalCode}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        const html = await response.text();
        if (html.includes('/@vite/client')) {
          throw new Error('Prerender server returned a Vite development page instead of production HTML.');
        }
        return;
      }
    } catch (error) {
      if (error.message.includes('Vite development page')) throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Timed out waiting for production preview at ${url}`);
}

async function main() {
  if (!fs.existsSync(indexPath)) {
    throw new Error('dist/index.html is missing. Run the Vite production build first.');
  }

  const shellHtml = fs.readFileSync(indexPath, 'utf8');
  const port = await getAvailablePort();
  const url = `http://127.0.0.1:${port}/`;
  const preview = spawn(
    process.execPath,
    [vitePath, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: rootDir, stdio: 'ignore', env: { ...process.env, BROWSER: 'none' } }
  );
  let previewSpawnError = null;
  let previewClosed = false;
  let resolvePreviewClosed;
  const previewClosedPromise = new Promise((resolve) => {
    resolvePreviewClosed = resolve;
  });
  preview.on('error', (error) => {
    previewSpawnError = error;
  });
  preview.once('close', () => {
    previewClosed = true;
    resolvePreviewClosed();
  });

  try {
    await waitForPreview(url, preview, () => previewSpawnError);
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 720 },
        locale: 'en-US',
        timezoneId: 'UTC',
      });
      const pageErrors = [];
      const previewOrigin = new URL(url).origin;
      page.on('pageerror', (error) => pageErrors.push(error));
      await page.route('**/*', async (route) => {
        if (new URL(route.request().url()).origin === previewOrigin) {
          await route.continue();
        } else {
          await route.abort();
        }
      });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.locator('#root h1').waitFor({ state: 'visible', timeout: 60000 });
      await page.locator('head meta[name="description"]').waitFor({ state: 'attached', timeout: 60000 });
      await page.locator('head link[rel="canonical"]').waitFor({ state: 'attached', timeout: 60000 });

      const checks = await page.evaluate(() => {
        const root = document.getElementById('root');
        const titles = Array.from(document.head.querySelectorAll('title'));
        const title = document.title;
        titles.forEach((element) => element.remove());
        const canonicalTitle = document.createElement('title');
        canonicalTitle.textContent = title;
        document.head.insertBefore(canonicalTitle, document.head.firstChild);
        if (root) root.dataset.prerendered = 'true';

        const types = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .flatMap((script) => {
            try {
              const json = JSON.parse(script.textContent || '{}');
              return (json['@graph'] || []).map((entry) => entry['@type']);
            } catch {
              return [];
            }
          });

        return {
          title,
          descriptionCount: document.querySelectorAll('meta[name="description"]').length,
          canonicalCount: document.querySelectorAll('link[rel="canonical"][href="https://oakcherrykraft.com/"]').length,
          openGraphCount: document.querySelectorAll('meta[property^="og:"]').length,
          twitterCount: document.querySelectorAll('meta[name^="twitter:"]').length,
          jsonLdTypes: types,
          visibleH1Count: Array.from(document.querySelectorAll('#root h1')).filter((element) => {
            const style = getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden';
          }).length,
          h1Text: document.querySelector('#root h1')?.textContent?.trim() || '',
        };
      });

      if (checks.descriptionCount !== 1) throw new Error(`Expected one description, found ${checks.descriptionCount}`);
      if (checks.canonicalCount !== 1) throw new Error(`Expected one homepage canonical, found ${checks.canonicalCount}`);
      if (checks.openGraphCount < 1 || checks.twitterCount < 1) throw new Error('Homepage social metadata is missing.');
      if (!checks.jsonLdTypes.includes('WebSite') || !checks.jsonLdTypes.includes('LocalBusiness')) {
        throw new Error('Homepage WebSite or LocalBusiness JSON-LD is missing.');
      }
      if (checks.visibleH1Count !== 1) throw new Error(`Expected one visible homepage H1, found ${checks.visibleH1Count}`);
      if (pageErrors.length) {
        throw new Error(`Homepage prerender raised a browser error: ${pageErrors.map((error) => error.message).join('; ')}`);
      }

      fs.writeFileSync(spaPath, shellHtml);
      const prerenderedHtml = await page.content();
      fs.writeFileSync(indexPath, prerenderedHtml.replace(/^[\t ]+(?=\r?$)/gm, ''));
      console.log(`Prerendered homepage: ${checks.title}`);
      console.log(`Description: ${checks.descriptionCount}; canonical: ${checks.canonicalCount}; visible H1: ${checks.visibleH1Count}`);
      console.log(`Open Graph tags: ${checks.openGraphCount}; Twitter tags: ${checks.twitterCount}; JSON-LD: ${checks.jsonLdTypes.join(', ')}`);
    } finally {
      await browser.close();
    }
  } finally {
    if (!previewClosed) {
      if (preview.exitCode === null && preview.signalCode === null) preview.kill();
      await previewClosedPromise;
    }
  }
}

main().catch((error) => {
  console.error('Homepage prerender failed:', error);
  process.exitCode = 1;
});
