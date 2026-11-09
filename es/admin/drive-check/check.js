(()=>{
 'use strict';
 const el=id=>document.getElementById(id),api=()=>window.UMBERPortalService;
 const ROOT='1aXqlTUWrToTIT610lG1G-zrh-2WRMj23',QA='fabd96bc-80fd-439d-a68e-31725555fd32';
 const TEXT='UMBER - PRUEBA FICTICIA DE DRIVE\nEste archivo no contiene informacion real de clientes.\n';
 const fields={secret_present:'Secreto guardado',valid_json:'JSON válido',web_client:'Cliente web OAuth',client_secret_present:'Secreto del cliente presente',correct_project:'Proyecto UMBER correcto',callback_matches:'Dirección de retorno correcta'};
 let current=null,busy=false,epoch=0,ready=false,selected=false,picker=null,pickerLoad=null;
 function show(id,on){el(id).hidden=!on;el(id).style.display=on?'':'none';}
 function controls(){el('logout').disabled=busy;for(const id of ['check','connection','pick','prepare','test','connect'])el(id).disabled=busy||!current||(id!=='test'&&!current.staff)||(id==='connect'&&!ready)||(id==='prepare'&&!selected);}
 function view(message){el('message').textContent=message;show('login',!current);show('workspace',!!current);show('staff-tools',!!current?.staff);controls();}
 function dispose(){if(picker){picker.dispose();picker=null;}}
 async function session(){const generation=++epoch;ready=false;selected=false;try{const s=await api().live();if(generation!==epoch)return;current=s&&(s.staff||s.user?.id===QA)?s:null;view(current?'Sesión confirmada: '+(current.staff?'equipo UMBER.':'cliente ficticio.'):'Entra con Ana Paula, Melissa o el cliente ficticio del portal.');}catch{current=null;view('No se pudo comprobar la sesión. Intenta entrar de nuevo.');}}
 async function invoke(name,body){const c=await api().client();const r=await c.functions.invoke(name,{body});if(r.error)throw r.error;return r.data;}
 function failure(error){const status=Number(error?.context?.status);return status?'La operación respondió HTTP '+status+'. Revisa la sesión y la instalación.':'No se pudo completar la operación. Revisa tu conexión y la instalación.';}
 async function run(id,work){if(!current||busy)return;busy=true;controls();const generation=epoch;try{await work(generation);}catch(e){if(generation===epoch)el(id).textContent=failure(e);}finally{busy=false;controls();}}
 el('login').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;e.target.querySelector('button').disabled=true;try{await api().signIn(el('email').value.trim(),el('password').value);await session();}catch{view('No se pudo iniciar sesión. Revisa tus datos.');}finally{el('password').value='';busy=false;e.target.querySelector('button').disabled=false;controls();}});
 el('logout').addEventListener('click',async()=>{epoch++;dispose();current=null;ready=false;selected=false;for(const id of ['results','test-results'])el(id).replaceChildren();el('file-status').textContent='Archivos sin comprobar.';el('connection-status').textContent='Conexión sin comprobar.';view('Cerrando sesión…');show('login',false);try{await api().signOut();}finally{view('Sesión cerrada.');}});
 el('check').addEventListener('click',()=>run('message',async generation=>{const data=await invoke('portal-drive-check',{action:'check'});if(generation!==epoch)return;el('results').replaceChildren();for(const [key,label]of Object.entries(fields)){const li=document.createElement('li');li.textContent=label+': '+(data?.[key]===true?'Correcto':'Pendiente');el('results').append(li);}ready=Object.keys(fields).every(key=>data?.[key]===true);view(ready?'Configuración OAuth correcta. Si Google ya está autorizado, abre el selector.':'Hay configuración pendiente.');}));
 el('connect').addEventListener('click',()=>run('connection-status',async generation=>{const data=await invoke('portal-drive-oauth',{action:'begin'});if(generation!==epoch)return;const u=new URL(data.authorization_url);if(u.protocol!=='https:'||u.hostname!=='accounts.google.com'||u.username||u.password)throw Error();location.assign(u.href);}));
 el('connection').addEventListener('click',()=>run('connection-status',async generation=>{const data=await invoke('portal-drive-oauth',{action:'status'});if(generation!==epoch)return;el('connection-status').textContent=data?.connection_saved===true?'Autorización guardada. Abre el selector para elegir PORTAL CLIENTES.':'Falta conectar Google Drive.';}));
 function loadPicker(){if(window.google?.picker)return Promise.resolve();if(pickerLoad)return pickerLoad;pickerLoad=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error()),20000);const load=()=>window.gapi.load('picker',{callback:()=>{clearTimeout(timeout);resolve();},onerror:()=>{clearTimeout(timeout);reject(Error());}});if(window.gapi)load();else{const script=document.createElement('script');script.src='https://apis.google.com/js/api.js';script.onload=load;script.onerror=()=>{clearTimeout(timeout);reject(Error());};document.head.append(script);}}).catch(e=>{pickerLoad=null;throw e;});return pickerLoad;}
 el('pick').addEventListener('click',()=>run('file-status',async generation=>{
  selected=false;el('file-status').textContent='Abriendo selector de Google…';
  await loadPicker();let data=await invoke('portal-drive',{action:'picker'});if(generation!==epoch)return;
  if(!data?.access_token||!data.developer_key||!/^\d+$/.test(data.app_id)||data.root_id!==ROOT)throw Error();
  const p=window.google.picker;
  const view=new p.DocsView(p.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes('application/vnd.google-apps.folder').setEnableDrives(true);
  dispose();
  await new Promise((resolve,reject)=>{
   picker=new p.PickerBuilder().addView(view).setOAuthToken(data.access_token).setDeveloperKey(data.developer_key).setAppId(data.app_id).setOrigin(location.origin).setTitle('UMBER · Selecciona PORTAL CLIENTES').setCallback(async result=>{
    if(result.action!==p.Action.PICKED&&result.action!==p.Action.CANCEL)return;
    dispose();
    if(generation!==epoch){resolve();return;}
    if(result.action===p.Action.CANCEL){el('file-status').textContent='Selección cancelada.';resolve();return;}
    const id=result.docs?.[0]?.id;
    if(id!==ROOT){el('file-status').textContent='Selecciona únicamente PORTAL CLIENTES dentro de la unidad compartida UMBER.';resolve();return;}
    try{const verified=await invoke('portal-drive',{action:'verify_root',folder_id:id});if(generation===epoch){selected=verified?.ok===true;el('file-status').textContent=selected?'PORTAL CLIENTES verificada. Ya puedes preparar los archivos ficticios.':'No se pudo verificar la carpeta.';}resolve();}catch(e){reject(e);}
   }).build();
   data=null;
   picker.setVisible(true);
  });
 }));
 el('prepare').addEventListener('click',()=>run('file-status',async generation=>{el('file-status').textContent='Preparando dos subcarpetas QA y tres archivos ficticios…';const data=await invoke('portal-drive',{action:'create_qa'});if(generation!==epoch)return;if(data?.ok!==true||data.files!==3||data.project_folders!==2)throw Error();el('file-status').textContent='Preparación confirmada por el servidor: 2 subcarpetas y 3 archivos QA. Ejecuta la prueba de lectura.';}));
 const hex=buffer=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
 el('test').addEventListener('click',()=>run('file-status',async generation=>{
  el('test-results').replaceChildren();el('file-status').textContent='Probando acceso privado…';
  const expectedHash=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(TEXT)));let passed=0;
  for(const [suffix,label]of [['1','Archivo publicado'],['2','Archivo interno'],['3','Archivo de otro proyecto']]){
   if(generation!==epoch)return;const expected=current.staff||suffix==='1'?200:404;let status=200,blob=null;
   try{blob=await invoke('portal-drive',{action:'download',entry_id:'e2e20000-0000-4000-8000-00000000000'+suffix});}catch(e){status=Number(e?.context?.status)||0;}
   if(generation!==epoch)return;
   const valid=status===200&&blob instanceof Blob&&hex(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))===expectedHash;
   const ok=status===expected&&(expected!==200||valid);if(ok)passed++;
   const li=document.createElement('li');li.textContent=label+': '+(ok?'Correcto':'FALLO')+' · HTTP '+status+(status===200?(valid?' · contenido verificado':' · contenido no verificado'):'');
   if(valid&&suffix==='1'){const button=document.createElement('button');button.textContent='Descargar archivo ficticio';button.addEventListener('click',()=>{if(!current||generation!==epoch)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='UMBER-QA-0001.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});li.append(document.createElement('br'),button);}
   el('test-results').append(li);
  }
  if(generation===epoch)el('file-status').textContent=passed===3?'Las tres comprobaciones pasaron para esta cuenta. Falta repetir con '+(current.staff?'el cliente ficticio.':'una cuenta del equipo, si todavía no se hizo.'):'Hay comprobaciones pendientes o fallidas. Comparte esta lista de resultados.';
 }));
 window.addEventListener('pagehide',()=>{epoch++;dispose();});
 session();
})();
