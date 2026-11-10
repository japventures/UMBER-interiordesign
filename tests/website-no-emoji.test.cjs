const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pictograph = /[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u20E3]/u;
const excluded = new Set(['.git', 'assets', 'docs', 'supabase', 'tests', 'node_modules']);

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (excluded.has(entry.name) || entry.name.startsWith('.')) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(html|js|css)$/.test(file) ? [file] : [];
  });
}

// Decode numeric HTML entities and JavaScript escapes so escaping an emoji
// does not accidentally bypass the same rule applied to literal characters.
function decodeEscapes(source) {
  return source.replace(/&#(x[\da-f]+|\d+);|\\u\{([\da-f]+)\}|\\u([\da-f]{4})/gi, (_, entity, codePoint, codeUnit) => {
    const number = entity ? parseInt(entity.replace(/^x/i, ''), /^x/i.test(entity) ? 16 : 10) : parseInt(codePoint || codeUnit, 16);
    return number <= 0x10ffff ? String.fromCodePoint(number) : '';
  });
}

test('website templates, translations and static ES/EN pages contain no decorative emoji', () => {
  const files = sourceFiles(root);
  assert.ok(files.length > 40, 'Scan both shared scripts and static routes');
  const matches = files.flatMap(file => {
    const source = decodeEscapes(fs.readFileSync(file, 'utf8'));
    return pictograph.test(source) ? [path.relative(root, file)] : [];
  });
  assert.deepEqual(matches, [], 'Remove decorative pictographs instead of depending on device emoji fonts');
});

test('emoji scan recognizes escaped and literal forms without matching ordinary UI punctuation', () => {
  for (const source of ['&#x2197;', '&#8599;', '\\u2197', '\\u{2197}', '\\uD83D\\uDE00']) {
    assert.ok(pictograph.test(decodeEscapes(source)), source);
  }
  assert.equal(pictograph.test('Menu + - * / × ‹ › ← Ⅱ ▷'), false);
});

test('translation keeps required-field markers and plain call-to-action labels', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root, 'i18n.js'), 'utf8'), context);
  assert.equal(context.translateText('Email*'), 'Correo electrónico*');
  assert.equal(context.translateText('READ MORE'), 'LEER MÁS');
  assert.equal(context.translateText('  READ MORE  '), '  LEER MÁS  ');
});

test('EN/ES demo sections and screenshot buttons render without emojis', async () => {
  const mount = { innerHTML: '' };
  const handlers = {};
  let pathname = '';
  const NativeDate = Date;
  class FixtureDate extends NativeDate {
    constructor(...args) { super(...(args.length ? args : ['2026-11-09T16:00:00Z'])); }
    static now() { return NativeDate.parse('2026-11-09T16:00:00Z'); }
  }
  const context = vm.createContext({
    window: {}, URL, URLSearchParams, Intl, Date: FixtureDate, atob, Blob, setTimeout, clearTimeout,
    location: { get pathname() { return pathname; }, origin: 'https://example.test', hash: '', search: '' },
    document: {
      getElementById: id => id === 'umber-portal' ? mount : null,
      addEventListener: (event, handler) => { handlers[event] = handler; },
      body: { classList: { add() {}, remove() {} } },
      querySelector: () => null
    }
  });
  for (const file of ['config.js', 'portal-demo-data.js', 'portal-service.js', 'portal.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  // Deliberately do not load the deployed configuration or provide fetch.
  context.window.UMBER_PORTAL_CONFIG = { enabled: false };
  async function click(selector, dataset = {}) {
    const target = { dataset, matches: value => value === selector };
    await handlers.click({ target: { closest: () => target } });
    await Promise.resolve();
  }
  for (const language of ['', '/es']) {
    pathname = '/UMBER-interiordesign' + language + '/portal/demo/';
    await context.window.UMBERPortal.mount('/portal/demo');
    for (const label of language ? ['Ver pendientes', 'Abrir calendario'] : ['View items', 'Open calendar']) {
      assert.ok(mount.innerHTML.includes('>' + label + '</button>'), label + ' remains a plain text button');
    }
    assert.equal(pictograph.test(mount.innerHTML), false, 'overview');
    for (let repeat = 0; repeat < 2; repeat++) {
      for (const tab of ['calendar', 'selections', 'overview']) {
        await click('[data-up-tab]', { upTab: tab });
        assert.ok(mount.innerHTML.includes(`data-up-tab="${tab}" aria-current="page"`), tab + ' still opens');
      }
    }
    for (const tab of ['stages', 'calendar', 'documents', 'design', 'selections', 'invoices', 'updates', 'messages']) {
      await click('[data-up-tab]', { upTab: tab });
      assert.equal(pictograph.test(mount.innerHTML), false, language + '/' + tab);
    }
    await click('[data-up-role]');
    for (const tab of ['team', 'stages', 'calendar', 'documents', 'design', 'selections']) {
      await click('[data-up-tab]', { upTab: tab });
      assert.equal(pictograph.test(mount.innerHTML), false, 'team ' + language + '/' + tab);
    }
  }
});
