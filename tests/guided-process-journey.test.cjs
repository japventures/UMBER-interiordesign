const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function harness(){
 const events={},mount={innerHTML:''};
 const document={getElementById:id=>id==='umber-portal'?mount:null,querySelector:()=>null,addEventListener:(k,v)=>events[k]=v,body:{classList:{add(){},remove(){}}}};
 const context=vm.createContext({window:{},document,location:{pathname:'/UMBER-interiordesign/es/portal/demo/',origin:'https://japventures.github.io',hash:''},URL,URLSearchParams,Intl,Date,atob,Blob,setTimeout,clearTimeout,FormData:class{constructor(form){this.values=form.values}get(k){return this.values[k]}*[Symbol.iterator](){yield*Object.entries(this.values)}}});
 for(const file of ['config.js','portal-demo-data.js','portal-service.js','portal.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
 context.window.UMBER_PORTAL_CONFIG={enabled:false};let sample;
 const original=context.window.UMBER_PORTAL_SAMPLE;context.window.UMBER_PORTAL_SAMPLE=()=>sample=original();
 async function click(selector,dataset={}){const b={dataset,matches:s=>s===selector};await events.click({target:{closest:()=>b}});await Promise.resolve();}
 async function submit(type,values){const form={dataset:{upForm:type},values,closest:()=>null,querySelector:()=>({disabled:false})};events.submit({preventDefault(){},target:{closest:()=>form}});await new Promise(r=>setImmediate(r));}
 return {P:context.window.UMBERPortal,click,submit,get sample(){return sample},html:()=>mount.innerHTML,async change(id,value){await events.change({target:{id,value}});await new Promise(r=>setImmediate(r));}};
}
test('full staff journey separates simulated files and confirmations, preserves legacy data and invalidates approval on new moodboard',async()=>{
 const h=harness();await h.P.mount('/portal/demo');const originalIds=h.sample.entries.map(e=>e.id);await h.click('[data-up-role]');await h.click('[data-up-tab]',{upTab:'workflow'});
 assert.ok(h.html().includes('id="up-workflow-phase"'));assert.ok(!h.html().includes('name="position"'));
 const upload=slot=>h.submit('guided',{slot,room:'Sala',note:'Ficticio'});
 await upload('model_3d');assert.equal(h.sample.entries.filter(e=>e.data?.workflow_slot==='model_3d').length,0,'3D blocked before approval');
 await upload('agreement');await upload('advance');const advance=h.sample.entries.find(e=>e.data?.workflow_slot==='advance');assert.equal(advance.status,'pending');assert.equal(advance.visibility,'team');assert.equal(advance.data.drive_file_id,undefined,'Simulation never claims a real uploaded file');
 await h.submit('confirmation',{id:advance.id,note:'Anticipo ficticio revisado por el equipo'});assert.equal(advance.status,'completed');assert.equal(advance.data.workflow_confirmations.length,1);
 await upload('plans_2d');await upload('moodboard');await upload('lookfeel_approval');const approval=h.sample.entries.find(e=>e.data?.workflow_slot==='lookfeel_approval');
 await upload('model_3d');assert.equal(h.sample.entries.filter(e=>e.data?.workflow_slot==='model_3d').length,0,'Evidence upload does not approve');
 await h.submit('confirmation',{id:approval.id,note:'Aprobación ficticia recibida'});await upload('model_3d');const model=h.sample.entries.find(e=>e.data?.workflow_slot==='model_3d');assert.ok(model);assert.equal(model.visibility,'team');assert.equal(model.data.workflow_phase,'concept');assert.equal(model.data.version,'v1');
 await upload('moodboard');await upload('renders');assert.equal(h.sample.entries.filter(e=>e.data?.workflow_slot==='renders').length,0,'New moodboard requires confirmation again');
 assert.ok(originalIds.every(id=>h.sample.entries.some(e=>e.id===id)),'Original IDs retained');assert.equal(new Set(h.sample.entries.map(e=>e.id)).size,h.sample.entries.length,'Uploads have unique demo IDs');assert.equal(h.sample.entries.filter(e=>e.kind==='stage'&&e.data?.workflow_template===2).length,5);
 await h.click('[data-up-role]');await h.click('[data-up-tab]',{upTab:'documents'});assert.ok(!h.html().includes('data-up-preview="'+model.id+'"'));await h.submit('confirmation',{id:approval.id,note:'Client must not record a staff confirmation'});assert.equal(approval.data.workflow_confirmations.length,1);
});
