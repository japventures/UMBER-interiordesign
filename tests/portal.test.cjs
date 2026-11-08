const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='work/umber-pages/';
const events={},mount={innerHTML:''},bodyClasses=new Set();
let path='/UMBER-interiordesign/es/portal/demo/';
const document={getElementById:id=>id==='umber-portal'?mount:null,addEventListener:(name,fn)=>events[name]=fn,body:{classList:{add:v=>bodyClasses.add(v),remove:v=>bodyClasses.delete(v)}},querySelector:()=>null};
const context={window:{},document,location:{get pathname(){return path},origin:'https://japventures.github.io'},URL,Intl,Date,atob,Blob,setTimeout,clearTimeout,FormData:class {constructor(form){this.values=form.values}*[Symbol.iterator](){yield*Object.entries(this.values)}}};
vm.createContext(context);for(const f of ['config.js','portal-config.js','portal-demo-data.js','portal-service.js','portal.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),context,{filename:f});
const P=context.window.UMBERPortal,S=context.window.UMBERPortalService;
const html=()=>mount.innerHTML;
async function click(selector,dataset={}){const b={dataset,matches:s=>s===selector};await events.click({target:{closest:()=>b}});await Promise.resolve();}
async function change(id,value){await events.change({target:{id,value}});await new Promise(r=>setImmediate(r));}
async function submit(type,values){const form={dataset:{upForm:type},values,closest:()=>null,querySelector:()=>({disabled:false})};events.submit({preventDefault(){},target:{closest:()=>form}});await new Promise(r=>setImmediate(r));}
(async()=>{
 assert.equal(S.configured(),false,'Unconfigured access must stay off');
 assert.equal(S.safeUrl('javascript:alert(1)'),null);assert.equal(S.safeUrl('http://example.com'),null);assert.equal(S.safeUrl('https://a:b@example.com'),null);assert.equal(S.driveUrl('https://drive.google.com.evil.test/file'),null);assert.ok(S.driveUrl('https://drive.google.com/file/d/123/view'));
 const key=Buffer.from(JSON.stringify({role:'service_role'})).toString('base64');context.window.UMBER_PORTAL_CONFIG={enabled:true,supabaseUrl:'https://test.supabase.co',publishableKey:'header.'+key+'.signature'};assert.equal(S.configured(),false,'Secret role keys rejected');
 context.window.UMBER_PORTAL_CONFIG={enabled:false};
 path='/UMBER-interiordesign/es/portal/';await P.mount('/portal');assert.ok(html().includes('ACCESO AÚN NO HABILITADO'));assert.ok(!html().includes('name="password"'),'No credential collection before configuration');
 path='/UMBER-interiordesign/es/portal/demo/';await P.mount('/portal/demo');assert.ok(html().includes('DEMOSTRACIÓN'));assert.ok(html().includes('2 / 8'));assert.ok(html().includes('The Woodlands'));assert.ok(!html().includes('Presupuesto interno de ejemplo'));
 for(const tab of ['stages','calendar','documents','design','selections','invoices','updates','messages']){await click('[data-up-tab]',{upTab:tab});assert.ok(html().includes('data-up-tab="'+tab+'" aria-current="page"'),tab+' renders');assert.ok(!/undefined|NaN/.test(html()),tab+' has valid output');}
 await click('[data-up-tab]',{upTab:'documents'});await change('up-doc-filter','contract');assert.ok(html().includes('Contrato de servicios'));assert.ok(!html().includes('Distribución general'));
 await click('[data-up-tab]',{upTab:'calendar'});await click('[data-up-month]',{upMonth:'1'});await click('[data-up-month]',{upMonth:'1'});assert.ok(html().includes('enero de 2027'));
 assert.equal(P.fromHouston('2026-07-15T10:00'),'2026-07-15T15:00:00.000Z','Summer daylight saving');assert.equal(P.fromHouston('2026-12-15T10:00'),'2026-12-15T16:00:00.000Z','Winter standard time');assert.equal(P.houstonLocal('2026-12-15T16:00:00Z'),'2026-12-15T10:00');assert.throws(()=>P.fromHouston('2026-03-08T02:30'),'Nonexistent DST time rejected');
 await click('[data-up-tab]',{upTab:'messages'});await submit('comment',{body:'<img src=x onerror=alert(1)>'});assert.ok(html().includes('&lt;img src=x onerror=alert(1)&gt;'));assert.ok(!html().includes('<img src=x'));
 await click('[data-up-tab]',{upTab:'selections'});await submit('decision',{entry_id:context.window.UMBER_PORTAL_SAMPLE().entries.find(e=>e.kind==='selection'&&e.status==='review').id,decision:'approved',note:'Demo only'});assert.ok(html().includes('Tu selección: aprobada'));assert.ok(html().includes('No autoriza compras'));
 await click('[data-up-role]');await click('[data-up-tab]',{upTab:'team'});assert.ok(html().includes('Presupuesto interno de ejemplo'));assert.ok(html().includes('Simular invitación'));
 await submit('invite',{email:'fake@example.test',role:'client'});assert.ok(html().includes('No se envió ningún correo'));
 await change('up-project','demo-hospitality');await click('[data-up-tab]',{upTab:'design'});assert.ok(html().includes('Concepto restaurante'));assert.ok(!html().includes('Sala principal'),'Project switch does not leak previous entries');
 await click('[data-up-role]');assert.ok(!html().includes('data-up-tab="team"'));
 path='/UMBER-interiordesign/portal/demo/';await P.mount('/portal/demo');assert.ok(html().includes('DEMONSTRATION'));assert.ok(html().includes('Stage completion, not physical construction progress.'));
 await P.mount('/');assert.ok(!bodyClasses.has('umber-portal-page'));
 console.log('PASS: disabled login, public-key guard, safe links, 9 sections, document filter, year rollover, Houston DST, XSS escaping, demo decisions/invitations, team-only drafts, project isolation and EN/ES UI.');
})().catch(e=>{console.error(e);process.exitCode=1});
