const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8'),src=read('app.js');
test('latest review: home has automatic images without visible controls or portfolio-selection note',()=>{
 for(const text of [src,read('index.html'),read('es/index.html')]){assert.ok(!text.includes('class="slideshow-toggle"'));assert.ok(!text.includes('class="project-selection-note"'));}
 assert.ok(read('index.html').includes('data-hero-carousel'));
});
for(const es of [false,true])test(`review 4: services avoid a fixed scope (${es?'ES':'EN'})`,()=>{
 const html=read((es?'es/':'')+'services/index.html');
 assert.ok(html.includes(es?'Diseño interior y remodelación':'Interior design and remodeling'));
 assert.ok(!html.includes('architecture-includes'));
 assert.ok(!html.includes(es?'Nuestro enfoque':'Our approach'));
});
