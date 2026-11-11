const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),source=read('app.js');
const line=p=>source.split('\n').find(x=>x.startsWith(p));
for(const es of [false,true]){
 test(`${es?'ES':'EN'}: home shows three featured projects independently of the single hero image`,()=>{
  const projects=['san-francisco','the-woodlands','copy-of-santo-reproche'].map((slug,i)=>({slug,name:'Project '+i,location:'Place '+i,gallery:['a','b','c','d','e']}));
  const c=vm.createContext({D:{projects,aboutImage:'about'},ui:(a,b)=>es?b:a,image:(src,alt,cls='')=>`<img class="${cls}" alt="${alt}">`,place:x=>x,esc:x=>x});
  vm.runInContext(line('const selectedCard=')+line('function home()')+';result=home()',c);
  const selected=c.result.match(/<div class="selected-grid">([\s\S]*?)<\/div><div class="explore-more">/)[1];
  assert.equal((selected.match(/class="selected-work /g)||[]).length,3);
  for(const {slug} of projects)assert.ok(selected.includes('href="/'+slug+'"'));
  assert.equal((c.result.match(/hero-photo slide/g)||[]).length,1);
  assert.equal((read((es?'es/':'')+'index.html').match(/class="selected-work /g)||[]).length,3);
 });
 test(`${es?'ES':'EN'}: Contact has one heading, preserving the complete protected form`,()=>{
  const c=vm.createContext({ui:(a,b)=>es?b:a,field:()=>'<input required>',esc:x=>x,translateText:x=>x});
  vm.runInContext(line('function contact()')+';result=contact()',c);
  const label=es?'Contacto':'Contact';assert.equal((c.result.match(new RegExp('<h[1-6]>'+label+'</h[1-6]>','g'))||[]).length,1);
  assert.ok(c.result.includes('data-contact method="post"'));assert.ok(c.result.includes('fieldset class="contact-fields" disabled'));
  const html=read((es?'es/':'')+'contact/index.html');assert.equal((html.match(new RegExp('<h[1-6]>'+label+'</h[1-6]>','g'))||[]).length,1);
 });
 test(`${es?'ES':'EN'}: architecture components are nested within the primary service`,()=>{
  const c=vm.createContext({D:{serviceImage:'x'},ui:(a,b)=>es?b:a,image:()=>'',contactCta:()=>''});
  vm.runInContext(source.slice(source.indexOf('const services='),source.indexOf('function contactCta()'))+';result=servicePage()',c);
  const primary=c.result.match(/<article class="service-primary">([\s\S]*?)<\/article>/)[1];assert.ok(primary.includes('class="architecture-includes"'));assert.equal((primary.match(/<li>/g)||[]).length,6);
  assert.equal((c.result.match(/class="architecture-includes"/g)||[]).length,1);
 });
}
