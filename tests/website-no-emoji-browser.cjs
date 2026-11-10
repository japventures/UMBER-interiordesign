// Optional local-only UI regression. Requires Playwright and Chromium.
// CHROMIUM_PATH=/usr/bin/chromium node tests/website-no-emoji-browser.cjs
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const prefix = '/UMBER-interiordesign';
const pictograph = /[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u20E3]/u;
const server = http.createServer((req, res) => {
  let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!name.startsWith(prefix + '/')) return res.writeHead(404).end();
  name = name.slice(prefix.length);
  if (name.endsWith('/')) name += 'index.html';
  const file = path.resolve(root, '.' + name);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  // Never initialize the live Supabase backend during local visual checks.
  if (name === '/portal-config.js') {
    res.setHeader('Content-Type', 'text/javascript');
    return res.end('window.UMBER_PORTAL_CONFIG={enabled:false};');
  }
  try {
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.webp': 'image/webp' })[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch {
    res.writeHead(404).end();
  }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const errors = [];
  let checks = 0;
  async function check(page, label) {
    const text = await page.locator('body').innerText();
    assert.equal(pictograph.test(text), false, `${label}: no emoji in rendered text`);
    const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
    assert.ok(size.scroll <= size.viewport + 1, `${label}: no horizontal overflow`);
    checks++;
  }
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      page.on('pageerror', error => errors.push(error.message));
      // Keep the fictional demo's next appointment deterministic.
      await page.clock.install({ time: new Date('2026-11-09T16:00:00Z') });
      for (const language of ['', '/es']) {
        const base = origin + prefix + language;
        await page.goto(base + '/');
        const routes = await page.evaluate(() => [
          '/', '/portfolio/', '/services/', '/team-3/', '/contact/', '/faq/', '/blog/',
          ...window.UMBER_DATA.projects.map(project => '/' + project.slug + '/'),
          ...window.UMBER_DATA.posts.map(post => '/post/' + post.slug + '/'),
          '/portal/', '/admin/', '/portal/reset/'
        ]);
        for (const route of routes) {
          await page.goto(base + route);
          await page.locator('main h1').first().waitFor();
          await check(page, `${language || '/en'}${route} at ${width}px`);
          assert.equal(await page.locator('main').getByText('Page not found', { exact: true }).count(), 0);
        }
        await page.goto(base + '/portal/demo/');
        await page.locator('.up-sidebar [data-up-tab="overview"]').waitFor();
        await check(page, `demo overview ${language} ${width}`);
        const calendarName = language ? 'Abrir calendario' : 'Open calendar';
        const itemsName = language ? 'Ver pendientes' : 'View items';
        assert.equal(await page.getByRole('button', { name: itemsName, exact: true }).count(), 1);
        // The two screenshot controls retain their labels and click behavior.
        for (let repeat = 0; repeat < 2; repeat++) {
          await page.getByRole('button', { name: calendarName, exact: true }).click();
          assert.equal(await page.locator('.up-sidebar [data-up-tab="calendar"]').getAttribute('aria-current'), 'page');
          await page.locator('.up-sidebar [data-up-tab="overview"]').click();
          await page.getByRole('button', { name: itemsName, exact: true }).click();
          assert.equal(await page.locator('.up-sidebar [data-up-tab="selections"]').getAttribute('aria-current'), 'page');
          await page.locator('.up-sidebar [data-up-tab="overview"]').click();
        }
        if (process.env.SCREENSHOT_DIR) {
          fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
          await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `no-emoji-${language ? 'es' : 'en'}-${width}.png`), fullPage: true });
        }
        for (const tab of ['stages', 'calendar', 'documents', 'design', 'selections', 'invoices', 'updates', 'messages']) {
          await page.locator(`.up-sidebar [data-up-tab="${tab}"]`).click();
          await check(page, `demo ${tab} ${language} ${width}`);
        }
        await page.locator('[data-up-role]').click();
        await page.locator('.up-sidebar [data-up-tab="team"]').click();
        await check(page, `demo team ${language} ${width}`);
        await page.locator('.up-sidebar [data-up-tab="stages"]').click();
        await page.locator('[data-up-edit]').first().click();
        await page.locator('#up-dialog[open]').waitFor();
        await check(page, `demo edit dialog ${language} ${width}`);
        await page.locator('#up-dialog [data-up-close]').first().click();
        assert.equal(await page.locator('#up-dialog').getAttribute('open'), null);
      }
      await page.close();
    }
    assert.deepEqual(errors, []);
    console.log(`PASS: ${checks} EN/ES public-page and demo checks at 390/1440px; no emoji or overflow; repeated screenshot buttons and edit/cancel still work; external requests blocked.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
