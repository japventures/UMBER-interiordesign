(()=>{
 const el=id=>document.getElementById(id),api=()=>window.UMBERPortalService;
 let authorized=false,busy=false,epoch=0,configurationReady=false;
 const fields={secret_present:'Secreto guardado',valid_json:'JSON válido',web_client:'Cliente web OAuth',client_secret_present:'Secreto del cliente presente',correct_project:'Proyecto UMBER correcto',callback_matches:'Dirección de retorno correcta'};
 function view(message){el('message').textContent=message;el('login').hidden=authorized;el('workspace').hidden=!authorized;}
 async function session(){configurationReady=false;el('connect').disabled=true;const current=++epoch;try{const s=await api().live();if(current!==epoch)return;authorized=!!s?.staff;view(authorized?'Acceso del equipo confirmado.':s?'Esta cuenta no pertenece al equipo autorizado. Cierra sesión desde el portal para cambiar de cuenta.':'Entra con tu cuenta del portal UMBER.');el('login').hidden=!!s&&!authorized;}catch{authorized=false;view('No se pudo comprobar la sesión. Intenta entrar de nuevo.');}}
 el('login').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;const button=e.target.querySelector('button');button.disabled=true;try{await api().signIn(el('email').value.trim(),el('password').value);el('password').value='';await
 el('connect').addEventListener('click',async()=>{
  if(!authorized||!configurationReady||busy)return;
  busy=true;el('connect').disabled=true;const current=epoch;
  el('connection-status').textContent='Preparando autorización de Google…';
  try{
   const client=await api().client();const {data,error}=await client.functions.invoke('portal-drive-oauth',{body:{action:'begin'}});
   if(current!==epoch)return;if(error||!data?.authorization_url)throw Error();
   const target=new URL(data.authorization_url);
   if(target.protocol!=='https:'||target.hostname!=='accounts.google.com'||target.username||target.password)throw Error();
   location.assign(target.href);
  }catch{if(current===epoch)el('connection-status').textContent='No se pudo iniciar. Verifica que portal-drive-oauth esté desplegada y configurada para recibir el retorno de Google.';}
  finally{busy=false;el('connect').disabled=!configurationReady;}
 });
 el('connection').addEventListener('click',async()=>{
  if(!authorized||busy)return;
  busy=true;el('connection').disabled=true;const current=epoch;
  el('connection-status').textContent='Consultando conexión guardada…';
  try{
   const client=await api().client();const {data,error}=await client.functions.invoke('portal-drive-oauth',{body:{action:'status'}});
   if(current!==epoch)return;if(error||typeof data?.connection_saved!=='boolean')throw Error();
   el('connection-status').textContent=data.connection_saved===true?'Autorización de Google guardada. Falta seleccionar archivos y probar su acceso privado.':'Google todavía no está conectado. Comprueba la configuración y pulsa Conectar Google Drive.';
  }catch{if(current===epoch)el('connection-status').textContent='No se pudo consultar. Revisa la instalación de portal-drive-oauth y tu sesión.';}
  finally{busy=false;el('connection').disabled=false;}
 });
 const result=new URL(location.href).searchParams.get('drive');
 const messages={connected:'Google devolvió la autorización. Pulsa Consultar conexión para verificar que quedó guardada.',cancelled:'Se canceló la autorización de Google.',failed:'Google no completó la conexión. Puedes volver a intentarlo.', 'wrong-account':'La cuenta de Google no coincide con la cuenta corporativa que inició la conexión.'};
 if(messages[result])el('connection-status').textContent=messages[result];
 session();}catch{view('No se pudo iniciar sesión. Revisa tus datos o tu conexión.');}finally{el('password').value='';button.disabled=false;busy=false;}});
 el('check').addEventListener('click',async()=>{if(!authorized||busy)return;busy=true;const current=epoch;el('check').disabled=true;el('results').replaceChildren();view('Comprobando configuración…');try{const client=await api().client();const {data,error}=await client.functions.invoke('portal-drive-check',{body:{action:'check'}});if(current!==epoch)return;if(error||!data)throw Error();for(const [key,label]of Object.entries(fields)){const li=document.createElement('li');li.textContent=label+': '+(data[key]===true?'Correcto':data[key]===false?'Pendiente o incorrecto':'Sin comprobar');el('results').append(li);}const ready=Object.keys(fields).every(key=>data[key]===true);configurationReady=ready;el('connect').disabled=!ready;view(ready?'Configuración correcta. Falta autorizar Google y activar la conexión de archivos.':'Hay configuración pendiente. Comparte sólo esta lista de resultados.');}catch{if(current===epoch)view('La comprobación no respondió. Revisa que portal-drive-check tenga el código actualizado y que tu sesión siga activa.');}finally{el('check').disabled=false;busy=false;}});
 el('logout').addEventListener('click',async()=>{epoch++;authorized=false;configurationReady=false;el('connect').disabled=true;el('connection-status').textContent='Conexión sin comprobar.';el('results').replaceChildren();view('Cerrando sesión…');el('login').hidden=true;try{await api().signOut();}finally{view('Sesión cerrada.');}});

 el('connect').addEventListener('click',async()=>{
  if(!authorized||!configurationReady||busy)return;
  busy=true;el('connect').disabled=true;const current=epoch;
  el('connection-status').textContent='Preparando autorización de Google…';
  try{
   const client=await api().client();const {data,error}=await client.functions.invoke('portal-drive-oauth',{body:{action:'begin'}});
   if(current!==epoch)return;if(error||!data?.authorization_url)throw Error();
   const target=new URL(data.authorization_url);
   if(target.protocol!=='https:'||target.hostname!=='accounts.google.com'||target.username||target.password)throw Error();
   location.assign(target.href);
  }catch{if(current===epoch)el('connection-status').textContent='No se pudo iniciar. Verifica que portal-drive-oauth esté desplegada y configurada para recibir el retorno de Google.';}
  finally{busy=false;el('connect').disabled=!configurationReady;}
 });
 el('connection').addEventListener('click',async()=>{
  if(!authorized||busy)return;
  busy=true;el('connection').disabled=true;const current=epoch;
  el('connection-status').textContent='Consultando conexión guardada…';
  try{
   const client=await api().client();const {data,error}=await client.functions.invoke('portal-drive-oauth',{body:{action:'status'}});
   if(current!==epoch)return;if(error||typeof data?.connection_saved!=='boolean')throw Error();
   el('connection-status').textContent=data.connection_saved===true?'Autorización de Google guardada. Falta seleccionar archivos y probar su acceso privado.':'Google todavía no está conectado. Comprueba la configuración y pulsa Conectar Google Drive.';
  }catch{if(current===epoch)el('connection-status').textContent='No se pudo consultar. Revisa la instalación de portal-drive-oauth y tu sesión.';}
  finally{busy=false;el('connection').disabled=false;}
 });
 const result=new URL(location.href).searchParams.get('drive');
 const messages={connected:'Google devolvió la autorización. Pulsa Consultar conexión para verificar que quedó guardada.',cancelled:'Se canceló la autorización de Google.',failed:'Google no completó la conexión. Puedes volver a intentarlo.', 'wrong-account':'La cuenta de Google no coincide con la cuenta corporativa que inició la conexión.'};
 if(messages[result])el('connection-status').textContent=messages[result];
 session();
})();
