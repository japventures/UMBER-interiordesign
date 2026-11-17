const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../portal.js'),'utf8');
const c=vm.createContext({window:{},document:{addEventListener(){}},location:{pathname:'/es/portal/'},umberRoutePath:p=>p,URL,Intl});vm.runInContext(src,c);const flow=c.window.UMBERPortal.projectFlow;
test('project flow follows five approved stages with moodboard approval before 3D',()=>{
 assert.equal(flow.length,5);assert.equal(flow[0].key,'intake');assert.equal(flow[1].key,'engagement');assert.equal(flow.at(-1).key,'implementation');
 assert.deepEqual(Array.from(flow.find(p=>p.key==='concept').slots,s=>s[0]),['plans_2d','moodboard','lookfeel_approval','furniture_proposal','model_3d','renders']);
 assert.equal(new Set(flow.flatMap(p=>p.slots.map(s=>s[0]))).size,flow.flatMap(p=>p.slots).length);
});
test('stage preparation resumes after partial failure without duplicating successful stages',async()=>{
 const state={team:true,selected:'project-a',busy:false,projectError:false,mode:'live',entries:[]};let calls=0,fail=true;
 const ctx=vm.createContext({state,projectFlow:flow,activeFlow:()=>flow,t:a=>a,draw(){},api:()=>({async saveEntry(row){calls++;if(fail&&calls===3)throw Error('NETWORK');return {...row,id:'stage-'+row.data.workflow_phase};}})});
 const a=src.indexOf(' async function prepareFlow('),b=src.indexOf(' function workflowView()',a);vm.runInContext(src.slice(a,b),ctx);
 await assert.rejects(vm.runInContext('prepareFlow()',ctx));assert.equal(state.entries.length,2);fail=false;
 await vm.runInContext('prepareFlow()',ctx);assert.equal(state.entries.length,5);await vm.runInContext('prepareFlow()',ctx);assert.equal(state.entries.length,5);
 assert.ok(state.entries.every(e=>e.project_id==='project-a'&&e.visibility==='team'));
});

test('a complete new workflow does not double-count retained legacy stages',()=>{const old={id:'old',kind:'stage',position:1,data:{}},rows=[old,...Array.from(flow,(phase,i)=>({id:phase.key,position:(i+1)*100,data:{workflow_phase:phase.key}}))];const result=c.window.UMBERPortal.orderedStages(rows);assert.equal(result.length,5);assert.equal(rows.length,6);assert.ok(!result.includes(old));assert.equal(result[0].id,'intake');});

function flowHarness(){
 const context=vm.createContext({window:{},document:{addEventListener(){}},location:{pathname:'/es/portal/'},umberRoutePath:p=>p,URL,Intl});
 vm.runInContext(src.replace(' return {landing,demo,mount,',' window.setTestState=value=>{state={...state,...value};}; return {landing,demo,mount,'),context);
 const state={selected:'p1',team:true,entries:[],members:[],decisions:[]};context.window.setTestState(state);
 return {state,api:context.window.UMBERPortal};
}
function addRow(h,slot,version='v1',extra={}){const row={id:slot+'-'+version,project_id:'p1',kind:'document',status:'pending',visibility:'team',data:{workflow_slot:slot,version,drive_file_id:'file-'+slot+version},...extra};h.state.entries.push(row);return row;}
function confirm(h,key){const row=addRow(h,key);row.status='completed';row.data.workflow_confirmation={recorded_by:'staff',source_ids:h.api.confirmationSnapshot(key)};return row;}
test('uploaded evidence alone never approves Look & Feel; source replacement invalidates a recorded approval',()=>{
 const h=flowHarness();addRow(h,'plans_2d');addRow(h,'moodboard');const evidence=addRow(h,'lookfeel_approval');
 assert.ok(h.api.flowBlocked('model_3d'));assert.equal(h.api.confirmedFlow('lookfeel_approval'),false);
 evidence.status='completed';evidence.data.workflow_confirmation={recorded_by:'staff',source_ids:h.api.confirmationSnapshot('lookfeel_approval')};
 assert.equal(h.api.flowBlocked('model_3d'),'');assert.equal(h.api.flowBlocked('renders'),'');
 addRow(h,'moodboard','v2');assert.ok(h.api.flowBlocked('model_3d'));
 evidence.data.workflow_confirmation.source_ids=h.api.confirmationSnapshot('lookfeel_approval');assert.equal(h.api.flowBlocked('model_3d'),'');
 h.state.entries.find(e=>e.id==='moodboard-v2').data.drive_file_id='replacement-file';assert.ok(h.api.flowBlocked('model_3d'));
});
test('advance and executive approvals are separate manual records, scoped to current project',()=>{
 const h=flowHarness();addRow(h,'agreement');assert.ok(h.api.flowBlocked('moodboard'));confirm(h,'advance');assert.equal(h.api.flowBlocked('moodboard'),'');
 assert.ok(h.api.flowBlocked('installation'));for(const key of ['technical_plans','specifications','furniture_schedule'])addRow(h,key);confirm(h,'executive_approval');assert.equal(h.api.flowBlocked('installation'),'');
 h.state.entries.forEach(e=>e.project_id='other-project');assert.ok(h.api.flowBlocked('moodboard'));assert.ok(h.api.flowBlocked('installation'));
});
test('existing eight-stage projects retain their workflow until explicit adoption; no IDs or records change',()=>{
 const h=flowHarness(),old=Array.from(h.api.legacyProjectFlow,(p,i)=>({id:'old-'+i,project_id:'p1',kind:'stage',data:{workflow_phase:p.key,workflow_template:1}}));h.state.entries.push(...old);
 assert.equal(h.api.activeFlow().length,8);assert.equal(h.api.orderedStages(old).length,8);
 const fresh=Array.from(h.api.projectFlow,(p,i)=>({id:'new-'+i,project_id:'p1',kind:'stage',data:{workflow_phase:p.key,workflow_template:2}}));h.state.entries.push(...fresh);
 assert.equal(h.api.activeFlow().length,5);assert.equal(h.api.orderedStages(h.state.entries).length,5);assert.equal(h.state.entries.length,13);assert.deepEqual(old.map(e=>e.id),Array.from({length:8},(_,i)=>'old-'+i));
});
