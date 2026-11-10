const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const source = read('app.js');
const line = prefix => {
  const result = source.split('\n').find(value => value.startsWith(prefix));
  assert.ok(result, prefix);
  return result;
};

for (const language of ['en', 'es']) {
  const spanish = language === 'es';
  const prefix = spanish ? 'es/' : '';
  const title = spanish ? 'Un legado de diseño y visión.' : 'A Legacy of Design and Vision.';
  const philosophy = spanish ? 'Nuestra filosofía: diseño a la medida de una vida auténtica' : 'Our Philosophy: Tailored for Authentic Living';
  const commitment = spanish ? 'Nuestro compromiso: excelencia y transparencia' : 'Our Commitment: Excellence and Transparency';

  test(`${language}: project cards show one location and preserve project link`, () => {
    const context = vm.createContext({
      D: { projects: [{ slug: 'sample-project', name: 'Sample project', location: 'Sample city' }] },
      esc: value => value, place: value => value, image: () => '<img alt="Sample project">'
    });
    vm.runInContext(line('const selectedCard=') + '; result=selectedCard("sample-project","sample.webp","one","Sample city")', context);
    assert.equal((context.result.match(/Sample city/g) || []).length, 1);
    assert.ok(context.result.includes('href="/sample-project"'));
    const cards = read(prefix + 'index.html').match(/<article class="selected-work[\s\S]*?<\/article>/g);
    assert.equal(cards.length, 3);
    for (const card of cards) {
      assert.equal((card.match(/class="eyebrow"/g) || []).length, 1);
      assert.equal((card.match(/<p>/g) || []).length, 0, 'No duplicate location paragraph');
      assert.ok(card.includes('<h3>'));
    }
  });

  test(`${language}: About content is consistent in runtime and static route`, () => {
    const context = vm.createContext({
      D: { aboutImage: 'sample.webp' },
      ui: (en, es) => spanish ? es : en,
      image: () => '<img alt="Founders">'
    });
    vm.runInContext(line('function about()') + '; result=about()', context);
    for (const content of [context.result, read(prefix + 'team-3/index.html')]) {
      for (const text of [title, philosophy, commitment, 'Ana Paula de la Cerda', 'Melissa Arteaga', 'The Woodlands, Texas']) {
        assert.ok(content.includes(text), text);
      }
      const main = content.includes('<main') ? content.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1] : content;
      assert.equal((main.match(/<h2>/g) || []).length, 4);
      assert.ok(main.includes('mailto:info@umberinteriordesign.com'));
      assert.ok(main.includes(spanish ? '>Ver proyectos</a>' : '>View projects</a>'));
      assert.equal(main.includes(spanish ? 'A Legacy of Design and Vision.' : 'Un legado de diseño y visión.'), false);
    }
  });
}

test('heading color is scoped to public display headings, not hero or portal controls', () => {
  const css = read('styles.css');
  const rule = css.match(/\.selected-section h2,\.selected-section h3,[\s\S]*?\{color:var\(--umber-terracotta\)\}/);
  assert.ok(rule);
  assert.ok(rule[0].includes('.unified-project .case-top h1'));
  assert.ok(rule[0].includes('.studio-page h2'));
  assert.equal(/\.hero|\.up-|portal/.test(rule[0]), false);
});
