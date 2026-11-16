const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../portal.js'),'utf8');
const c=vm.createContext({window:{},document:{addEventListener(){}},location:{pathname:'/es/portal/'},umberRoutePath:p=>p,URL,Intl});vm.runInContext(src,c);const flow=c.window.UMBERPortal.projectFlow;
test('project flow includes proposal to handover with a fixed 2D, 3D, moodboard, render order',()=>{
 assert.equal(flow[0].key,'quote');assert.equal(flow[1].key,'contract');assert.equal(flow.at(-1).key,'handover');
 assert.deepEqual(Array.from(flow.find(p=>p.key==='design').slots,s=>s[0]),['plans_2d','model_3d','moodboard','renders']);
 assert.equal(new Set(flow.flatMap(p=>p.slots.map(s=>s[0]))).size,flow.flatMap(p=>p.slots).length);
});
test('stage preparation resumes after partial failure without duplicating successful stages',async()=>{
 const state={team:true,selected:'project-a',busy:false,projectError:false,mode:'live',entries:[]};let calls=0,fail=true;
 const ctx=vm.createContext({state,projectFlow:flow,t:a=>a,draw(){},api:()=>({async saveEntry(row){calls++;if(fail&&calls===3)throw Error('NETWORK');return {...row,id:'stage-'+row.data.workflow_phase};}})});
 const a=src.indexOf(' async function prepareFlow()'),b=src.indexOf(' function workflowView()',a);vm.runInContext(src.slice(a,b),ctx);
 await assert.rejects(vm.runInContext('prepareFlow()',ctx));assert.equal(state.entries.length,2);fail=false;
 await vm.runInContext('prepareFlow()',ctx);assert.equal(state.entries.length,8);await vm.runInContext('prepareFlow()',ctx);assert.equal(state.entries.length,8);
 assert.ok(state.entries.every(e=>e.project_id==='project-a'&&e.visibility==='client'));
});
