// Offline regression for the translation inversion that changed BLOG to JOURNAL.
// Exercises the real applyLanguage function. No network or backend requests.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const mounts = [
  ['https://japventures.github.io', '/UMBER-interiordesign'],
  ['https://umberinteriordesign.com', ''],
  ['https://www.umberinteriordesign.com', '']
];

function harness(language, route, origin, mount) {
  const links = [];
  const location = { origin, pathname: mount + (language === 'es' ? '/es' : '') + route };
  const anchor = (href, language) => ({
    dataset: language ? { language } : {}, attrs: {},
    get href() { return this.url.href; },
    set href(value) { this.url = new URL(value, origin + location.pathname); },
    get origin() { return this.url.origin; },
    get pathname() { return this.url.pathname; },
    get hash() { return this.url.hash; },
    get search() { return this.url.search; },
    hasAttribute(name) { return name === 'data-language' && !!language; },
    setAttribute(name, value) { name === 'href' ? this.href = value : this.attrs[name] = value; },
    removeAttribute(name) { delete this.attrs[name]; },
    url: new URL(href, origin)
  });
  const prefix = mount + (language === 'es' ? '/es' : '');
  const nav = [anchor(prefix + '/blog'), anchor(prefix + '/blog')];
  const languageLinks = [anchor(mount + '/es' + route, 'es'), anchor(mount + route, 'en')];
  const nodes = ['BLOG', 'BLOG', 'Blog', language === 'es' ? 'SERVICIOS' : 'SERVICES'].map(nodeValue => ({ nodeValue }));
  const document = {
    title: 'BLOG | UMBER INTERIOR DESIGN', baseURI: origin + mount + '/', documentElement: {}, body: {},
    querySelector: () => ({}),
    querySelectorAll(selector) {
      if (selector === 'a[href]') return [...nav, ...languageLinks];
      if (selector === '[data-language]') return languageLinks;
      if (selector === 'link[data-i18n-meta]') return [...links];
      if (selector === '[aria-label],img[alt]') return [];
      throw new Error('Unexpected selector: ' + selector);
    },
    createTreeWalker() { let index = 0; return { nextNode: () => nodes[index++] }; },
    createElement() { const link = { dataset: {}, remove() { links.splice(links.indexOf(link), 1); } }; return link; },
    head: { append: link => links.push(link) }
  };
  const context = vm.createContext({ document, location, window: {}, NodeFilter: { SHOW_TEXT: 4 }, URL });
  vm.runInContext(read('config.js'), context);
  vm.runInContext(read('i18n.js'), context);
  return { context, nodes, links, nav, languageLinks, document, location };
}

for (const [origin, mount] of mounts) for (const initial of ['en', 'es']) {
  for (const route of ['/blog', '/portal/demo', '/post/what-makes-a-house-feel-like-home']) {
    test(`${origin}${mount} ${initial} ${route}: Blog survives repeated translation, with routes and metadata intact`, () => {
      const h = harness(initial, route, origin, mount);
      const canonicalOrigin = origin.replace('www.', '');
      for (const language of [initial, 'en', 'es', 'en', 'es', 'en']) {
        h.location.pathname = mount + (language === 'es' ? '/es' : '') + route;
        h.document.title = 'BLOG | UMBER INTERIOR DESIGN';
        h.context.applyLanguage(route);
        assert.deepEqual(h.nodes.slice(0, 3).map(node => node.nodeValue), ['BLOG', 'BLOG', 'Blog']);
        assert.equal(h.nodes[3].nodeValue, language === 'es' ? 'SERVICIOS' : 'SERVICES');
        assert.equal(h.document.documentElement.lang, language);
        assert.equal(h.document.title, 'BLOG | UMBER INTERIOR DESIGN');
        for (const link of h.nav) assert.equal(link.pathname, mount + (language === 'es' ? '/es' : '') + '/blog');
        for (const link of h.languageLinks) assert.equal(link.pathname, mount + (link.dataset.language === 'es' ? '/es' : '') + route);
        assert.equal(h.links.length, 4, 'Old canonical and alternates are replaced');
        assert.equal(h.links.find(link => link.rel === 'canonical').href, canonicalOrigin + h.location.pathname + '/');
        for (const language of ['en', 'es', 'x-default']) {
          const alternate = h.links.find(link => link.hreflang === language);
          assert.equal(alternate.href, canonicalOrigin + mount + (language === 'es' ? '/es' : '') + route + '/');
        }
      }
    });
  }
}

function shells(dir = root) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || ['assets', 'tests', 'docs', 'supabase', 'node_modules'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? shells(file) : entry.name.endsWith('.html') && fs.readFileSync(file, 'utf8').includes('<base') ? [file] : [];
  });
}
test('every static shell names the blog consistently and requests the corrected translator', () => {
  const files = shells();
  assert.equal(files.length, 47);
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /\b(?:journal|diario)\b/i, file);
    const navigation = html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/g).join('');
    const blogLinks = [...navigation.matchAll(/<a\b[^>]*href="(?:[^"]*\/)?blog\/?"[^>]*>(.*?)<\/a>/g)];
    assert.ok(blogLinks.length >= 2, file);
    for (const [, label] of blogLinks) assert.equal(label, 'BLOG', file);
    assert.match(html, /i18n\.js\?v=review2-20261112/, file);
  }
});
test('both prerendered Blog pages preserve their heading, title, content and post routes', () => {
  for (const language of ['', 'es/']) {
    const html = read(language + 'blog/index.html');
    assert.match(html, /<h1>Blog<\/h1>/);
    assert.match(html, /<title>BLOG \| UMBER INTERIOR DESIGN<\/title>/);
    assert.equal((html.match(/class="post-card"/g) || []).length, 2);
    assert.match(html, new RegExp(`href="${language}post/what-makes-a-house-feel-like-home"`));
    assert.match(html, new RegExp(`href="${language}post/design-with-intention-the-story-behind-umber"`));
  }
});
