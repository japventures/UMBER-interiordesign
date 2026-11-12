const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),src=read('app.js');
function carousel(reduced=false){
 const events={},jobs=new Map(),slides=Array.from({length:3},()=>({active:false,attrs:{},classList:{toggle(n,v){this.owner.active=v}},setAttribute(n,v){this.attrs[n]=v}}));
 for(const s of slides)s.classList.owner=s;
 const hero={querySelectorAll:()=>slides,addEventListener:(n,f)=>events[n]=f,contains:()=>false},document={hidden:false,querySelectorAll:()=>[hero]};
 const context=vm.createContext({document,matchMedia:()=>({matches:reduced}),setInterval(fn,ms){assert.equal(ms,7000);jobs.set(1,fn);return 1},clearInterval(id){jobs.delete(id)}});
 const a=src.indexOf('function initHeroCarousel()'),b=src.indexOf('let heroTimer;',a);
 vm.runInContext('let heroTimer;'+src.slice(a,b)+';initHeroCarousel()',context);return {events,jobs,slides,document};
}
test('automatic hero changes image, hides inactive photos from readers, and pauses on hover/focus',()=>{
 const f=carousel();assert.equal(f.jobs.size,1);assert.equal(f.slides[0].attrs['aria-hidden'],'false');
 f.jobs.get(1)();assert.equal(f.slides[1].active,true);assert.equal(f.slides[0].attrs['aria-hidden'],'true');
 f.events.mouseenter();assert.equal(f.jobs.size,0);f.events.mouseleave();assert.equal(f.jobs.size,1);
 f.events.focusin();assert.equal(f.jobs.size,0);f.events.focusout({relatedTarget:null});assert.equal(f.jobs.size,1);
 const active=f.slides.findIndex(s=>s.active);f.document.hidden=true;f.jobs.get(1)();assert.equal(f.slides.findIndex(s=>s.active),active);
});
test('reduced-motion preference keeps the hero still',()=>{assert.equal(carousel(true).jobs.size,0)});
for(const es of [false,true])test(`${es?'ES':'EN'}: hierarchy, quote CTA, photo strip and services match latest review`,()=>{
 const prefix=es?'es/':'';const home=read(prefix+'index.html'),services=read(prefix+'services/index.html'),studio=read(prefix+'team-3/index.html');
 assert.ok(home.includes(es?'Cotiza tu proyecto':'Request a project quote'));assert.equal((home.match(/hero-photo slide/g)||[]).length,3);
 assert.ok(services.includes(es?'Lo que hacemos':'What we do'));assert.ok(services.includes(es?'Nuestro enfoque':'Our approach'));assert.ok(services.includes(es?'Nuestro proceso':'Our process'));
 assert.ok(!services.includes('<p class="eyebrow">'+(es?'SERVICIOS':'SERVICES')+'</p>'));
 assert.equal((services.match(/class="service-banner-title"/g)||[]).length,1);assert.equal((services.match(/class="service-number"/g)||[]).length,8);
 assert.ok(studio.includes('<h1>'+(es?'El estudio':'The studio')+'</h1>'));assert.ok(!studio.includes('<h1>UMBER Interior Design</h1>'));
 assert.equal((home.match(/aria-label="Instagram · /g)||[]).length,4);
});
