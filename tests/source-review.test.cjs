const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8'),src=read('app.js');
test('latest review: home has automatic images without visible controls or portfolio-selection note',()=>{
 for(const text of [src,read('index.html'),read('es/index.html')]){assert.ok(!text.includes('class="slideshow-toggle"'));assert.ok(!text.includes('class="project-selection-note"'));}
 assert.ok(read('index.html').includes('data-hero-carousel'));
});
for(const es of [false,true])test(`review source: services clarify nested scope (${es?'ES':'EN'})`,()=>{
 const ctx=vm.createContext({D:{serviceImage:''},ui:(a,b)=>es?b:a,image:()=>'',contactCta:()=>''});
 const start=src.indexOf('const services='),end=src.indexOf('function contactCta()');
 vm.runInContext(src.slice(start,end)+'; result=servicePage()',ctx);
 assert.ok(ctx.result.includes(es?'Componentes de arquitectura interior':'Included within interior architecture'));
 assert.ok(read((es?'es/':'')+'services/index.html').includes(es?'Componentes de arquitectura interior':'Included within interior architecture'));
 assert.equal((ctx.result.match(/class="architecture-scope"/g)||[]).length,1);
});
