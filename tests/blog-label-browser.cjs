// Optional real-browser regression. All requests are intercepted; no live backend.
// CHROMIUM_PATH=/usr/bin/chromium node tests/blog-label-browser.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const origin = 'https://japventures.github.io';
const mount = '/UMBER-interiordesign';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp' };

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  let checks = 0;
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin || !url.pathname.startsWith(mount + '/')) return route.abort();
        const local = url.pathname.slice(mount.length);
        if (local === '/portal-config.js') return route.fulfill({ contentType: 'text/javascript', body: 'window.UMBER_PORTAL_CONFIG={enabled:false};' });
        let file = path.resolve(root, '.' + local);
        if (!file.startsWith(root + path.sep)) return route.fulfill({ status: 403, body: '' });
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
        return route.fulfill({ contentType: mime[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
      });
      async function check(language, route) {
        assert.equal(await page.locator('html').getAttribute('lang'), language);
        for (const selector of ['#nav', 'footer nav']) {
          const link = page.locator(selector + ' a').filter({ hasText: /^BLOG$/ });
          assert.equal(await link.count(), 1);
          assert.equal((await link.getAttribute('href')).replace(/\/$/, ''), mount + (language === 'es' ? '/es' : '') + '/blog');
        }
        assert.doesNotMatch(await page.locator('body').innerText(), /\b(?:journal|diario)\b/i);
        if (route === '/blog') {
          assert.equal(await page.locator('h1').innerText(), 'Blog');
          assert.equal(await page.title(), 'BLOG | UMBER INTERIOR DESIGN');
          assert.equal(await page.locator('.post-card').count(), 2);
        }
        const meta = await page.locator('link[rel="canonical"]').getAttribute('href');
        assert.equal(meta.replace(/\/$/, ''), origin + mount + (language === 'es' ? '/es' : '') + route);
        assert.equal(await page.locator('link[rel="alternate"][hreflang]').count(), 3);
        checks++;
      }
      for (const language of ['en', 'es']) {
        for (const route of ['/blog', '/portal/demo', '/post/what-makes-a-house-feel-like-home']) {
          await page.goto(origin + mount + (language === 'es' ? '/es' : '') + route + '/');
          await check(language, route);
          for (const next of ['en', 'es', 'en', 'es']) {
            await page.locator(`[data-language="${next}"]`).click();
            await check(next, route);
          }
          await page.goBack();
          await check('en', route);
          await page.goForward();
          await check('es', route);
        }
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(`PASS: ${checks} Blog checks across EN/ES, direct loads, repeated toggles and history at 390/1440px.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
