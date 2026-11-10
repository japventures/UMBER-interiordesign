const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..')+'/';
// Fixed fictional clock keeps calendar assertions independent of today's date.
const RealDate=Date;
class FixtureDate extends RealDate { constructor(...args){super(...(args.length?args:['2026-11-09T16:00:00Z']));} static now(){return RealDate.parse('2026-11-09T16:00:00Z');} }
const events={},mount={innerHTML:''},bodyClasses=new Set();
let path='/UMBER-interiordesign/es/portal/demo/';
const document={getElementById:id=>id==='umber-portal'?mount:null,addEventListener:(name,fn)=>events[name]=fn,body:{classList:{add:v=>bodyClasses.add(v),remove:v=>bodyClasses.delete(v)}},querySelector:()=>null};
const context={window:{},document,location:{get pathname(){return path},origin:'https://japventures.github.io',hash:''},URL,URLSearchParams,Intl,Date:FixtureDate,atob,Blob,setTimeout,clearTimeout,FormData:class {constructor(form){this.values=form.values}*[Symbol.iterator](){yield*Object.entries(this.values)}}};
vm.createContext(context);for(const f of ['config.js','portal-demo-data.js','portal-service.js','portal.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),context,{filename:f});
// Never load deployed credentials/config or contact a live backend in these tests.
context.window.UMBER_PORTAL_CONFIG={enabled:false};
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
 path='/UMBER-interiordesign/es/portal/demo/';await P.mount('/portal/demo');assert.ok(html().includes('DEMOSTRACIÓN'));assert.ok(html().includes('PENDIENTES POR REVISAR'));assert.ok(html().includes('Diseño conceptual'));assert.ok(html().includes('The Woodlands'));assert.ok(!html().includes('Presupuesto interno de ejemplo'));
 for(const tab of ['stages','calendar','documents','design','selections','invoices','updates','messages']){await click('[data-up-tab]',{upTab:tab});assert.ok(html().includes('data-up-tab="'+tab+'" aria-current="page"'),tab+' renders');assert.ok(!/undefined|NaN/.test(html()),tab+' has valid output');}
 await click('[data-up-tab]',{upTab:'documents'});await change('up-doc-filter','contract');assert.ok(html().includes('Contrato de servicios'));assert.ok(!html().includes('Distribución general'));
 await click('[data-up-tab]',{upTab:'calendar'});await click('[data-up-month]',{upMonth:'1'});await click('[data-up-month]',{upMonth:'1'});assert.ok(html().includes('enero de 2027'));
 await click('[data-up-calendar-view]',{upCalendarView:'gantt'});assert.ok(html().includes('Cronograma del proyecto'));assert.ok(html().includes('data-up-calendar-view="gantt" aria-pressed="true"'));assert.ok(html().includes('Por programar'));assert.ok(html().includes('data-up-gantt-entry='));assert.ok(!html().includes('Presupuesto interno de ejemplo'));
 await click('[data-up-gantt-range]',{upGanttRange:'month'});assert.ok(html().includes('Presupuesto y compras'));assert.ok(!html().includes('data-up-gantt-entry="demo-entry-1"'),'Out-of-month task excluded');
 const testRows=[{id:'a',kind:'stage',starts_at:'2026-11-01T15:00:00Z',ends_at:'2026-11-10T23:00:00Z'},{id:'b',kind:'event',starts_at:'2026-11-08T15:00:00Z'},{id:'c',kind:'stage'}];
 const from=Math.floor(Date.parse('2026-11-05T12:00:00Z')/86400000),to=Math.floor(Date.parse('2026-11-09T12:00:00Z')/86400000),layout=P.ganttLayout(testRows,from,to);assert.equal(layout.length,2);assert.equal(layout[0].left,0);assert.equal(layout[0].width,100);assert.equal(layout[0].clipped,true);assert.equal(layout[1].width,20);assert.ok(layout.every(r=>r.left>=0&&r.left+r.width<=100));assert.equal(P.scheduleRows(testRows).filter(r=>r.start===null).length,1);
 await click('[data-up-calendar-view]',{upCalendarView:'calendar'});assert.ok(html().includes('up-calendar'));assert.ok(html().includes('Presupuesto y compras'),'Same scheduled stage in normal calendar');
 assert.equal(P.fromHouston('2026-07-15T10:00'),'2026-07-15T15:00:00.000Z','Summer daylight saving');assert.equal(P.fromHouston('2026-12-15T10:00'),'2026-12-15T16:00:00.000Z','Winter standard time');assert.equal(P.houstonLocal('2026-12-15T16:00:00Z'),'2026-12-15T10:00');assert.throws(()=>P.fromHouston('2026-03-08T02:30'),'Nonexistent DST time rejected');
 await click('[data-up-tab]',{upTab:'messages'});await submit('comment',{body:'<img src=x onerror=alert(1)>'});assert.ok(html().includes('&lt;img src=x onerror=alert(1)&gt;'));assert.ok(!html().includes('<img src=x'));
 await click('[data-up-tab]',{upTab:'selections'});await submit('decision',{entry_id:context.window.UMBER_PORTAL_SAMPLE().entries.find(e=>e.kind==='selection'&&e.status==='review').id,decision:'approved',note:'Demo only'});assert.ok(html().includes('Tu selección: aprobada'));assert.ok(html().includes('No autoriza compras'));
 await click('[data-up-role]');await click('[data-up-tab]',{upTab:'team'});assert.ok(html().includes('Presupuesto interno de ejemplo'));assert.ok(html().includes('Simular invitación'));
 await submit('invite',{email:'fake@example.test',role:'client'});assert.ok(html().includes('No se envió ningún correo'));
 await change('up-project','demo-hospitality');await click('[data-up-tab]',{upTab:'design'});assert.ok(html().includes('Concepto restaurante'));assert.ok(!html().includes('Sala principal'),'Project switch does not leak previous entries');
 await click('[data-up-role]');assert.ok(!html().includes('data-up-tab="team"'));
 path='/UMBER-interiordesign/portal/demo/';await P.mount('/portal/demo');assert.ok(html().includes('DEMONSTRATION'));assert.ok(html().includes('ITEMS TO REVIEW'));assert.ok(html().includes('NEXT APPOINTMENT'));
 await P.mount('/');assert.ok(!bodyClasses.has('umber-portal-page'));
 // Workflow references use fictional data and must not expose team-only records.
 path='/UMBER-interiordesign/es/portal/demo/';await P.mount('/portal/demo');
 await click('[data-up-tab]',{upTab:'stages'});
 assert.equal((html().match(/class="up-stage"/g)||[]).length,5,'Five reference service stages');
 for(const title of ['Visita a sitio y arranque','Look and feel y distribución','Diseño conceptual','Presupuesto y compras','Supervisión y styling'])assert.ok(html().includes(title));
 assert.ok(html().includes('Entregables y seguimiento'));assert.ok(html().includes('Revisión 1 / 2'));
 assert.ok(html().includes('Por programar'));assert.ok(html().includes('confirmar aprobación del diseño'));
 assert.ok(!html().includes('Presupuesto interno de ejemplo'),'Linked internal draft remains hidden');
 await click('[data-up-tab]',{upTab:'selections'});
assert.ok(html().includes('Resumen de partidas visibles'));
 assert.ok(html().includes(P.formatMoney(3440,'USD')),'Visible fictional line items total');
 assert.ok(html().includes(P.formatMoney(640,'USD')),'Ordered subset remains separate');
 assert.ok(html().includes('no son saldo a pagar'));assert.ok(html().includes('No autoriza compras'));
 await click('[data-up-tab]',{upTab:'updates'});assert.ok(html().includes('Siguiente paso'));assert.ok(html().includes('Revisa la paleta'));
 await change('up-project','demo-hospitality');await click('[data-up-tab]',{upTab:'stages'});
 assert.ok(!html().includes('Distribución general'),'No deliverables carried across projects');
 path='/UMBER-interiordesign/portal/demo/';await P.mount('/portal/demo');await click('[data-up-tab]',{upTab:'stages'});
 assert.ok(html().includes('Site visit and kickoff'));assert.ok(html().includes('Review 1 / 2'));
 assert.ok(!html().includes('Visita a sitio y arranque'));await click('[data-up-tab]',{upTab:'updates'});assert.ok(html().includes('Next step'));
 // A malicious linked draft must never leak via stage details or metadata.
 const originalSample=context.window.UMBER_PORTAL_SAMPLE;
 context.window.UMBER_PORTAL_SAMPLE=()=>{const data=originalSample(),stage=data.entries.find(e=>e.kind==='stage'),draft=data.entries.find(e=>e.visibility==='team');draft.data.stage_id=stage.id;stage.data.dependency_note='<img src=x onerror=alert(1)>';return data;};
 await P.mount('/portal/demo');await click('[data-up-tab]',{upTab:'stages'});
 assert.ok(!html().includes('Example internal budget'));assert.ok(html().includes('&lt;img src=x onerror=alert(1)&gt;'));assert.ok(!html().includes('<img src=x'));
 await click('[data-up-role]');assert.ok(html().includes('Example internal budget'),'Staff can see linked draft in demo');
 context.window.UMBER_PORTAL_SAMPLE=originalSample;
 // Staff can preserve workflow fields through the existing JSON editor without a schema change.
 path='/UMBER-interiordesign/es/portal/demo/';await P.mount('/portal/demo');await click('[data-up-role]');
 const fixture=originalSample(),render=fixture.entries.find(e=>e.kind==='render'),stage=fixture.entries.find(e=>e.kind==='stage');
 const values={id:render.id,kind:'render',visibility:'client',title:'Entregable ficticio revisado',description:'Revisión de prueba',status:'review',position:'12',room:'Sala',version:'v3',owner:'Equipo',amount:'',currency:'USD',category:'design',due_date:'',starts_at:'',ends_at:'',location:'',drive_url:'',external_url:'',stage_id:stage.id,revision_round:'2',revisions_included:'2',estimate:'',dependency_note:'',next_action:''};
 await submit('entry',values);await click('[data-up-tab]',{upTab:'stages'});assert.ok(html().includes('Entregable ficticio revisado'));assert.ok(html().includes('Revisión 2 / 2'));
 await submit('entry',{...values,stage_id:'foreign-stage'});assert.ok(html().includes('Selecciona una etapa de este proyecto'));
 await submit('entry',{...values,revision_round:'-1'});assert.ok(html().includes('Usa una ronda de revisión entera'));
 // Mixed currencies stay separate; missing amounts are excluded rather than treated as zero.
 context.window.UMBER_PORTAL_SAMPLE=()=>{const data=originalSample(),item=data.entries.find(e=>e.kind==='selection');data.entries.push({...item,id:'demo-mxn',data:{amount:100,currency:'MXN'}},{...item,id:'demo-missing',data:{currency:'USD'}});return data;};
 await P.mount('/portal/demo');await click('[data-up-tab]',{upTab:'selections'});assert.ok(html().includes('<h3>USD</h3>'));assert.ok(html().includes('<h3>MXN</h3>'));assert.ok(html().includes('1 partida(s) sin importe'));assert.ok(html().includes(P.formatMoney(3440,'USD')));
 context.window.UMBER_PORTAL_SAMPLE=originalSample;

 console.log('PASS: five-stage workflow, linked draft isolation, revision metadata validation, mixed-currency summaries, next actions, Gantt/calendar switching, clipped ranges, milestones, unscheduled stages, shared calendar data, disabled login, public-key guard, safe links, 9 sections, document filter, year rollover, Houston DST, XSS escaping, demo decisions/invitations, team-only drafts, project isolation and EN/ES UI.');
})().catch(e=>{console.error(e);process.exitCode=1});
