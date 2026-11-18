/* PRIVATE. Invoke via authorized browser with structured plan argument. Never publish. */
async function loadPrivateReview(plan,{apply=false,projectId,group='all',onProgress=()=>{}}={}){
 const PROJECT=projectId;
 if(!/^[0-9a-f-]{36}$/i.test(PROJECT||''))throw Error('SELECT_PROJECT_REQUIRED');
 if(plan?.schema_version!==2||plan.project_id!==PROJECT||plan.executed!==false||plan.visibility!=='team'||plan.currency!==null||!Array.isArray(plan.operations))throw Error('INVALID_PRIVATE_PLAN');
 if(!['all','patch-existing','new-catalog','work-quotes','source-docs'].includes(group))throw Error('INVALID_GROUP');
 const api=window.UMBERPortalService;if(!api)throw Error('OPEN_UMBER_PORTAL');const live=await api.live();if(!live?.user?.id||!live?.staff||live.mfaRequired)throw Error('STAFF_AAL2_REQUIRED');
 if(!(await api.projects()).some(p=>p.id===PROJECT))throw Error('EXPECTED_PROJECT_NOT_VISIBLE');
 const state=await api.projectData(PROJECT);if(!Array.isArray(state.members)||state.members.length||state.entries.some(e=>e.project_id!==PROJECT||e.visibility!=='team'))throw Error('PROJECT_PRIVACY_PRECHECK_FAILED');
 const fileId=value=>{try{return new URL(value).pathname.match(/\/(?:d|folders)\/([A-Za-z0-9_-]+)/)?.[1]||null;}catch{return null;}};
 const empty=v=>v===null||v===undefined||v==='';
 const stages=new Map(state.entries.filter(e=>e.kind==='stage').map(e=>[e.data?.workflow_phase,e.id]));
 const changes=[],snapshots=[];let skipped=0;
 if(plan.operations.length>500)throw Error('PLAN_TOO_LARGE');
 const keys=new Set(); for(const op of plan.operations){if(!['patch-existing','new-catalog','work-quotes','source-docs'].includes(op.group)||!op.row?.data?.review_key||keys.has(op.row.data.review_key))throw Error('INVALID_OR_DUPLICATE_OPERATION');keys.add(op.row.data.review_key);}

 for(const op of plan.operations.filter(o=>group==='all'||o.group===group)){
  const input=JSON.parse(JSON.stringify(op.row)),d=input.data||{};
  if(Object.keys(input).some(k=>!['kind','title','description','visibility','status','position','data'].includes(k))||typeof input.title!=='string'||input.title.length>500||typeof input.description!=='string'||input.description.length>20000||JSON.stringify(d).length>100000||Object.keys(d).some(k=>['__proto__','constructor','prototype'].includes(k)))throw Error('INVALID_ROW_FIELDS');
  if((op.group==='work-quotes')!==(input.kind==='update')||(op.group==='source-docs')!==(input.kind==='document'))throw Error('GROUP_KIND_MISMATCH');
  if(input.visibility!=='team'||input.status!=='pending'||!['document','selection','update'].includes(input.kind)||!empty(d.currency)||d.drive_file_id||d.photo_url||d.record_type==='work_budget_authorization'||input.id||input.project_id)throw Error('UNSAFE_PLAN_ROW');
  if(input.kind==='selection'&&(!d.historical||d.can_request_purchase!==false||!Number.isFinite(d.quantity)||d.quantity<=0||!Number.isFinite(d.unit_price)))throw Error('UNSAFE_PRICE_ROW');
  if(input.kind==='update'&&(d.category!=='work_budget'||d.actual_amount!==null||!Number.isFinite(d.budget_amount)))throw Error('UNSAFE_WORK_ROW');
  if(d.external_url){const u=new URL(d.external_url);if(u.protocol!=='https:'||u.username||u.password)throw Error('UNSAFE_SOURCE_LINK');}
  if(d.review_stage){const id=stages.get(d.review_stage);if(!id)throw Error('EXPECTED_STAGE_MISSING');d.stage_id=id;}
  const matches=state.entries.filter(e=>op.expected_id?e.id===op.expected_id:op.match_drive_id?e.kind==='document'&&fileId(e.data?.drive_url||e.data?.external_url)===op.match_drive_id:e.data?.review_key===d.review_key||e.kind===input.kind&&e.data?.source_sheet===d.source_sheet&&e.data?.source_row===d.source_row);
  if(matches.length>1)throw Error('DUPLICATE_SOURCE_ROW_REVIEW_REQUIRED');
  const old=matches[0];if((op.expected_id||op.must_exist)&&!old)throw Error('EXPECTED_EXISTING_ENTRY_MISSING');
  if(old&&old.kind!==input.kind)throw Error('EXISTING_KIND_MISMATCH');
  if(old?.data?.source_sha256&&old.data.source_sha256!==plan.source_sha256)throw Error('SOURCE_VERSION_CONFLICT');
  if(old&&input.kind!=='document'&&!op.expected_id){skipped++;continue;}
  if(old){
   if(op.expected_values){if(old.status!=='pending'||(state.decisions||[]).some(v=>v.entry_id===old.id))throw Error('EXISTING_REVIEW_OR_DECISION_STOP');for(const [key,value]of Object.entries(op.expected_values))if(Number(old.data?.[key])!==value)throw Error('EXISTING_PRICE_SNAPSHOT_MISMATCH');}
   if(input.kind!=='document'&&!empty(old.data?.currency))throw Error('CURRENCY_CONFIRMATION_CONFLICT');
   const merged={...(old.data||{})};for(const [key,value]of Object.entries(d)){
    if(empty(value)&&!empty(merged[key]))continue;if(key==='stage_id'&&!empty(merged[key]))continue;
    if(['quantity','unit_price','discount_amount','subtotal_amount','commission_amount','tax_amount','delivery_amount','amount','vendor','external_url'].includes(key)&&!empty(value)&&!empty(merged[key])&&merged[key]!==value)throw Error('EXISTING_VALUE_CONFLICT:'+key);
    merged[key]=value;
   }
   const marker='[Fuente de revisión '+d.review_key+']',description=(old.description||'').includes(marker)?old.description:(old.description||'')+'\n\n'+marker+'\n'+input.description;
   if(JSON.stringify(merged)===JSON.stringify(old.data||{})&&description===old.description){skipped++;continue;}
   snapshots.push({id:old.id,project_id:PROJECT,description:old.description,data:JSON.parse(JSON.stringify(old.data||{}))});
   changes.push({operation:'update',group:op.group,id:old.id,source_row:d.source_row,source_sheet:d.source_sheet,payload:{id:old.id,description,data:merged}});
  }else changes.push({operation:'insert',group:op.group,source_row:d.source_row,source_sheet:d.source_sheet,payload:{...input,description:'[Fuente de revisión '+d.review_key+']\n'+input.description,data:d,project_id:PROJECT}});
 }
 const result={project_id:PROJECT,dry_run:!apply,planned_updates:changes.filter(c=>c.operation==='update').length,planned_inserts:changes.filter(c=>c.operation==='insert').length,skipped,saved:[],snapshots,files_uploaded:0,members_changed:0,purchase_requests:0,payments:0};
 if(!apply)return {...result,changes};
 const check=await api.live();if(!check?.staff||check.mfaRequired||check.user?.id!==live.user.id)throw Error('SESSION_CHANGED');
 const fresh=await api.projectData(PROJECT);if(JSON.stringify(fresh)!==JSON.stringify(state))throw Error('PROJECT_CHANGED_REVIEW_AGAIN');
 try{for(const change of changes){const saved=await api.saveEntry(change.payload);if(saved.project_id!==PROJECT||saved.visibility!=='team')throw Error('SAVED_ROW_SCOPE_MISMATCH');result.saved.push({id:saved.id,operation:change.operation,group:change.group,source_row:change.source_row,source_sheet:change.source_sheet});onProgress(result.saved.length,changes.length);}
  const after=await api.projectData(PROJECT);if(after.members.length||after.entries.some(e=>e.project_id!==PROJECT||e.visibility!=='team'))throw Error('PROJECT_PRIVACY_POSTCHECK_FAILED');result.team_entries=after.entries.length;return result;
 }catch(error){error.private_result=result;throw error;}
}

if(typeof module!=="undefined")module.exports={loadPrivateReview};
