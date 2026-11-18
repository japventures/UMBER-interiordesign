/* Local-file import UI. Data remains in this tab until authenticated writes are confirmed. */
(()=>{
 const $=id=>document.getElementById(id),api=window.UMBERPortalService;
 let plan=null,review=null,busy=false,receipt=null;
 const say=s=>{$('message').textContent=s;};
 const reset=()=>{review=null;$('confirm').checked=false;$('apply').disabled=true;$('rows').replaceChildren();$('summary').textContent='';};
 const serialize=r=>JSON.stringify({changes:r.changes,snapshots:r.snapshots});
 function download(value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='umber-importacion-privada.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function controls(lock){busy=lock;for(const id of ['project','file','group','review','confirm'])$(id).disabled=lock;$('apply').disabled=lock||!review||!$('confirm').checked;}
 function show(r){$('summary').textContent=`${r.planned_updates} actualizaciones · ${r.planned_inserts} registros nuevos · ${r.skipped} sin cambios. Sin archivos, miembros, solicitudes de compra ni pagos.`;
 for(const c of r.changes){const row=document.createElement('tr'),v=c.payload,d=v.data;for(const text of [c.operation==='update'?'Actualizar':'Crear',c.source_sheet||'Referencia',String(c.source_row||'—'),v.title||c.id,d.vendor||'—',d.external_url||d.drive_url||'—',d.quantity??'—',d.unit_price??d.budget_amount??'—',d.subtotal_amount??'—','Por confirmar','Sólo equipo']){const td=document.createElement('td');td.textContent=String(text);row.append(td);}$('rows').append(row);}}
 async function run(apply){if(busy||!plan)return;controls(true);try{
 const options={projectId:$('project').value,group:$('group').value};
 const current=await loadPrivateReview(plan,options);
 if(apply){if(!review||!$('confirm').checked||serialize(current)!==serialize(review))throw Error('El proyecto cambió. Revisa de nuevo antes de guardar.');
 receipt={reviewed_at:new Date().toISOString(),project_id:options.projectId,group:options.group,snapshots:current.snapshots,planned_changes:current.changes};$('download').hidden=false;
 const result=await loadPrivateReview(plan,{...options,apply:true,onProgress:(n,total)=>say(`Guardando ${n} de ${total}… No cierres esta pestaña.`)});receipt.result=result;reset();say(`Guardados ${result.saved.length} cambios privados. Descarga el comprobante y comprueba el proyecto en administración.`);
 }else{reset();review=current;show(current);say('Revisión sin guardar completada. Comprueba los valores y confirma únicamente este grupo.');}
 }catch(e){if(e.private_result){receipt={...receipt,partial_result:e.private_result};$('download').hidden=false;}reset();say(`Se detuvo la carga: ${e.message}. No se borró ningún registro. Si hubo cambios parciales, descarga el comprobante antes de reintentar.`);}finally{controls(false);}}
 $('file').addEventListener('change',async()=>{reset();plan=null;const f=$('file').files[0];if(!f)return;try{if(f.size>5*1024*1024)throw Error('Máximo 5 MB');plan=JSON.parse(await f.text());if(plan.schema_version!==2||!Array.isArray(plan.operations))throw Error('Formato no compatible');say(`Archivo leído localmente: ${plan.operations.length} operaciones. Selecciona proyecto y grupo; pulsa Revisar sin guardar.`);}catch(e){plan=null;say(e.message);}});
 for(const id of ['project','group'])$(id).addEventListener('change',reset);
 $('confirm').addEventListener('change',()=>{$('apply').disabled=busy||!review||!$('confirm').checked;});
 $('review').addEventListener('click',()=>run(false));$('apply').addEventListener('click',()=>run(true));$('download').addEventListener('click',()=>receipt&&download(receipt));
 window.addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue='';}});
 (async()=>{try{const live=await api.live();if(!live?.staff||live.mfaRequired)throw Error('Inicia sesión como equipo y completa el 2FA desde Administración.');for(const p of await api.projects()){const option=document.createElement('option');option.value=p.id;option.textContent=p.name||p.title||p.id;$('project').append(option);}$('form').hidden=false;say('Sesión del equipo verificada. La revisión consulta el proyecto real: debe estar sólo equipo y sin miembros cliente.');}catch(e){say(e.message);}})();
})();
