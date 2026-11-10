function verifiedMfa(token,user){
 // Call only after Supabase auth.getUser(token) validates this same JWT.
 try{const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const claims=JSON.parse(atob(part));return claims.sub===user.id&&claims.aal==='aal2';}catch{return false;}
}
import { createClient } from 'npm:@supabase/supabase-js@2.102.1';
import { OAuth2Client } from 'npm:google-auth-library@10.5.0';
const PROJECT='umber-portal-20261109';
const CALLBACK='https://nsugfmibvlrifcrvmsex.supabase.co/functions/v1/portal-drive-oauth/callback';
const FILE_SCOPE='https://www.googleapis.com/auth/drive.file';
const TEAM_EMAILS=['anapaula@umberinteriordesign.com','melissa@umberinteriordesign.com'];
const encoder=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...bytes));
const unb64=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
const random=()=>b64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
function oauthConfig(raw){
 const web=JSON.parse(raw||'{}').web;
 if(!web||web.project_id!==PROJECT||typeof web.client_id!=='string'||!web.client_id.endsWith('.apps.googleusercontent.com')||typeof web.client_secret!=='string'||!web.client_secret||!web.redirect_uris?.includes(CALLBACK))throw Error('OAUTH_NOT_CONFIGURED');
 return {clientId:web.client_id,clientSecret:web.client_secret};
}
async function encryptionKey(secret){
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),'HKDF',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:encoder.encode(PROJECT),info:encoder.encode('umber-drive-oauth-storage-v1')},key,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function seal(value,secret,purpose){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(purpose)},await encryptionKey(secret),encoder.encode(value));
 return 'v1.'+b64(iv)+'.'+b64(new Uint8Array(ciphertext));
}
async function open(value,secret,purpose){
 const [version,iv,data,...extra]=String(value).split('.');if(version!=='v1'||!iv||!data||extra.length)throw Error('INVALID_ENVELOPE');
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv),additionalData:encoder.encode(purpose)},await encryptionKey(secret),unb64(data));
 return new TextDecoder().decode(plain);
}
function validIdentity(payload,state){
 return !!payload&&payload.email_verified===true&&payload.hd==='umberinteriordesign.com'&&payload.nonce===state.nonce&&typeof payload.sub==='string'&&payload.sub.length>0&&TEAM_EMAILS.includes(payload.email)&&payload.email===state.actor_email;
}
function validScopes(scopes){
 const granted=new Set(String(scopes||'').split(/\s+/));
 const allowed=new Set(['openid','email','https://www.googleapis.com/auth/userinfo.email',FILE_SCOPE]);
 return granted.has(FILE_SCOPE)&&granted.has('openid')&&(granted.has('email')||granted.has('https://www.googleapis.com/auth/userinfo.email'))&&[...granted].every(s=>allowed.has(s));
}
async function jsonBody(req){
 const reader=req.body?.getReader();if(!reader)throw Error('INVALID_REQUEST');
 let length=0;const parts=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>1024){await reader.cancel();throw Error('INVALID_REQUEST');}parts.push(value);}}
 finally{reader.releaseLock();}
 const all=new Uint8Array(length);let offset=0;for(const part of parts){all.set(part,offset);offset+=part.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
}
const ROOT='1aXqlTUWrToTIT610lG1G-zrh-2WRMj23';
const SHARED_DRIVE='0AIUOZKId18GEUk9PVA';
const QA_PROJECT='e2e00000-0000-4000-8000-000000000001';
const OTHER_PROJECT='e2e00000-0000-4000-8000-000000000002';
const QA_USER='fabd96bc-80fd-439d-a68e-31725555fd32';
const FIXTURES=[
 {id:'e2e20000-0000-4000-8000-000000000001',project_id:QA_PROJECT,visibility:'client',title:'[QA] Archivo publicado de Drive'},
 {id:'e2e20000-0000-4000-8000-000000000002',project_id:QA_PROJECT,visibility:'team',title:'[QA] Archivo interno de Drive'},
 {id:'e2e20000-0000-4000-8000-000000000003',project_id:OTHER_PROJECT,visibility:'client',title:'[QA] Archivo de otro proyecto'}
];
const QA_TEXT='UMBER - PRUEBA FICTICIA DE DRIVE\nEste archivo no contiene informacion real de clientes.\n';
const driveId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{10,200}$/.test(value);
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const canRead=(user,staff,member,entry)=>!!user&&!!entry&&(staff||(member?.user_id===user&&member.project_id===entry.project_id&&['client','viewer'].includes(member.role)&&entry.visibility==='client'));
function folderMatches(meta,id,parent){return meta?.id===id&&!meta.trashed&&meta.mimeType==='application/vnd.google-apps.folder'&&meta.parents?.length===1&&meta.parents[0]===parent&&meta.driveId===SHARED_DRIVE;}
async function within(id,folder,meta){
 if(!driveId(id)||!driveId(folder)||id===folder)throw Error('FILE_NOT_AVAILABLE');
 const seen=new Set();let next=id;
 for(let depth=0;depth<32;depth++){
  if(seen.has(next))throw Error('FILE_NOT_AVAILABLE');seen.add(next);
  const m=await meta(next);if(m.id!==next||m.trashed||m.mimeType==='application/vnd.google-apps.shortcut'||m.parents?.length!==1||m.driveId!==SHARED_DRIVE)throw Error('FILE_NOT_AVAILABLE');
  if(depth>0&&m.mimeType!=='application/vnd.google-apps.folder')throw Error('FILE_NOT_AVAILABLE');
  if(m.parents[0]===folder)return;next=m.parents[0];
 }
 throw Error('FILE_NOT_AVAILABLE');
}
const safeName=value=>String(value||'UMBER-file').replace(/[\u0000-\u001f\u007f/\\]/g,'_').slice(0,180);
function makeFileHandler({createClient,OAuth2Client,env,security,jsonBody,access,fetchImpl=fetch}){
 const {oauthConfig,open,hash,TEAM_EMAILS}=security;
 const {ROOT,SHARED_DRIVE,QA_PROJECT,OTHER_PROJECT,QA_USER,FIXTURES,QA_TEXT,driveId,uuid,canRead,folderMatches,within,safeName}=access;
 const ORIGIN='https://japventures.github.io',MAX=25*1024*1024;
 return async req=>{
  const headers={'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Expose-Headers':'Content-Disposition','Vary':'Origin'};
  const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
  if(req.headers.get('origin')&&req.headers.get('origin')!==ORIGIN)return reply(403,{error:'Origin not allowed'});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply(405,{error:'Use POST'});
  const bearer=(req.headers.get('authorization')||'').replace(/^Bearer /i,'');if(!bearer)return reply(401,{error:'Inicia sesión en el portal'});
  let admin;
  try{
   admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
   const auth=await admin.auth.getUser(bearer),user=auth.data?.user;if(auth.error||!user)return reply(401,{error:'Sesión no válida'});
   if(!verifiedMfa(bearer,user))return reply(403,{error:'MFA_REQUIRED'});
   const staffResult=await admin.from('portal_staff').select('user_id').eq('user_id',user.id).maybeSingle();if(staffResult.error)throw Error('SERVER_ERROR');
   const staff=!!staffResult.data&&TEAM_EMAILS.includes(user.email);
   const body=await jsonBody(req);
   if(!['picker','verify_root','create_qa','download'].includes(body.action))return reply(400,{error:'Acción no válida'});
   if(body.action!=='download'&&!staff)return reply(403,{error:'Acceso del equipo UMBER requerido'});
   let connection,google;
   async function googleClient(){
    if(google)return google;
    const result=await admin.from('portal_drive_connections').select('*').eq('id','umber-drive').maybeSingle();if(result.error||!result.data)throw Error('NOT_CONNECTED');connection=result.data;
    const owner=await admin.from('portal_staff').select('user_id').eq('user_id',connection.actor_id).maybeSingle();
    if(owner.error||!owner.data||!TEAM_EMAILS.includes(connection.google_email))throw Error('NOT_CONNECTED');
    const config=oauthConfig(env('GOOGLE_DRIVE_OAUTH_CLIENT'));
    google=new OAuth2Client(config.clientId,config.clientSecret,security.CALLBACK);
    google.setCredentials({refresh_token:await open(connection.refresh_token_encrypted,config.clientSecret,'refresh:'+connection.google_subject)});
    return google;
   }
   async function token(){const c=await googleClient();const r=await c.getAccessToken();if(!r.token)throw Error('NOT_CONNECTED');return r.token;}
   async function drive(path,options={}){
    const url=new URL(path,'https://www.googleapis.com');
    if(url.origin!=='https://www.googleapis.com'||!/^\/(?:upload\/)?drive\/v3\/files(?:\/|$)/.test(url.pathname))throw Error('SERVER_ERROR');
    return fetchImpl(url.href,{...options,headers:{...(options.headers||{}),Authorization:'Bearer '+await token()},redirect:'error',signal:AbortSignal.timeout(20000)});
   }
   async function meta(id){
    if(!driveId(id))throw Error('FILE_NOT_AVAILABLE');
    const response=await drive('/drive/v3/files/'+encodeURIComponent(id)+'?supportsAllDrives=true&fields=id,name,mimeType,parents,trashed,size,driveId,appProperties,capabilities(canDownload)');
    if(!response.ok)throw Error('FILE_NOT_AVAILABLE');return response.json();
   }
   async function root(){const m=await meta(ROOT);if(m.mimeType!=='application/vnd.google-apps.folder'||m.trashed||m.driveId!==SHARED_DRIVE)throw Error('ROOT_REQUIRED');return m;}
   if(body.action==='picker'){
    const config=oauthConfig(env('GOOGLE_DRIVE_OAUTH_CLIENT'));
    const key=String(env('GOOGLE_PICKER_BROWSER_KEY')||'').trim();if(!/^[A-Za-z0-9_-]{20,200}$/.test(key))return reply(503,{error:'Falta la clave de Google Picker'});
    const app=config.clientId.match(/^(\d+)-/);if(!app)return reply(503,{error:'No se pudo identificar el proyecto de Google Picker'});
    await googleClient();
    // The short-lived drive.file token is only for Google's Picker in a staff browser.
    // Refresh tokens/client secrets never leave the server. Customers cannot use this action.
    if(connection.google_email!==user.email)return reply(403,{error:'Abre el selector con la cuenta corporativa que conectó Google Drive.'});
    return reply(200,{access_token:await token(),developer_key:key,app_id:app[1],root_id:ROOT});
   }
   if(body.action==='verify_root'){
    if(body.folder_id!==ROOT)return reply(400,{error:'Selecciona únicamente PORTAL CLIENTES de UMBER'});
    await root();return reply(200,{ok:true,folder:'PORTAL CLIENTES'});
   }
   if(body.action==='create_qa'){
    await root();
    const membership=await admin.from('portal_members').select('user_id,project_id').eq('project_id',QA_PROJECT).eq('user_id',QA_USER).maybeSingle();
    const foreign=await admin.from('portal_members').select('user_id').eq('project_id',OTHER_PROJECT).eq('user_id',QA_USER).maybeSingle();
    if(membership.error||foreign.error||!membership.data||foreign.data)return reply(409,{error:'La asignación del cliente ficticio no coincide con la prueba prevista'});
    for(const id of [QA_PROJECT,OTHER_PROJECT]){const p=await admin.from('portal_projects').select('id,name').eq('id',id).maybeSingle();if(p.error||!p.data)return reply(409,{error:'Falta un proyecto ficticio para la prueba'});}
    const lockId=crypto.randomUUID();
    const cleaned=await admin.from('portal_drive_test_lock').delete().eq('id','qa-files').lt('expires_at',new Date().toISOString());if(cleaned.error)throw Error('SERVER_ERROR');
    const lock=await admin.from('portal_drive_test_lock').insert({id:'qa-files',owner_id:lockId,expires_at:new Date(Date.now()+20*60000).toISOString()});
    if(lock.error)return reply(409,{error:'Hay otra preparación QA en curso. Espera a que termine.'});
    try{
     const folders={};
     for(const pid of [QA_PROJECT,OTHER_PROJECT]){
      const binding=await admin.from('portal_drive_folders').select('folder_id').eq('project_id',pid).maybeSingle();if(binding.error)throw Error('SERVER_ERROR');
      if(binding.data){const m=await meta(binding.data.folder_id);if(!folderMatches(m,binding.data.folder_id,ROOT))throw Error('FILE_NOT_AVAILABLE');folders[pid]=m.id;continue;}
      const query="'"+ROOT+"' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='umber_qa_project' and value='"+pid+"' }";
      const found=await drive('/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId='+SHARED_DRIVE+'&q='+encodeURIComponent(query)+'&fields=files(id)&pageSize=2');if(!found.ok)throw Error('SERVER_ERROR');
      const candidates=(await found.json()).files||[];if(candidates.length>1)throw Error('SERVER_ERROR');let id=candidates[0]?.id;
      if(!id){const created=await drive('/drive/v3/files?supportsAllDrives=true&fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:pid===QA_PROJECT?'[QA] Portal - proyecto asignado':'[QA] Portal - otro proyecto',mimeType:'application/vnd.google-apps.folder',parents:[ROOT],appProperties:{umber_qa_project:pid}})});if(!created.ok)throw Error('SERVER_ERROR');id=(await created.json()).id;}
      if(!folderMatches(await meta(id),id,ROOT))throw Error('FILE_NOT_AVAILABLE');
      const saved=await admin.from('portal_drive_folders').insert({project_id:pid,folder_id:id});if(saved.error)throw Error('SERVER_ERROR');folders[pid]=id;
     }
     const digest=await hash(QA_TEXT);
     for(const fixture of FIXTURES){
      const existing=await admin.from('portal_entries').select('id,project_id,data').eq('id',fixture.id).maybeSingle();if(existing.error)throw Error('SERVER_ERROR');let fileId=existing.data?.data?.drive_file_id;
      if(existing.data&&existing.data.project_id!==fixture.project_id)throw Error('SERVER_ERROR');
      if(fileId){await within(fileId,folders[fixture.project_id],meta);continue;}
      const q="'"+folders[fixture.project_id]+"' in parents and trashed = false and appProperties has { key='umber_qa_entry' and value='"+fixture.id+"' }";
      const found=await drive('/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId='+SHARED_DRIVE+'&q='+encodeURIComponent(q)+'&fields=files(id)&pageSize=2');if(!found.ok)throw Error('SERVER_ERROR');const matches=(await found.json()).files||[];if(matches.length>1)throw Error('SERVER_ERROR');fileId=matches[0]?.id;
      const filename='UMBER-QA-'+fixture.id.slice(-4)+'.txt';
      if(!fileId){
       const boundary='umber_'+crypto.randomUUID();const metadata={name:filename,mimeType:'text/plain',parents:[folders[fixture.project_id]],appProperties:{umber_qa_entry:fixture.id}};
       const multipart='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(metadata)+'\r\n--'+boundary+'\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n'+QA_TEXT+'\r\n--'+boundary+'--\r\n';
       const created=await drive('/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body:multipart});if(!created.ok)throw Error('SERVER_ERROR');fileId=(await created.json()).id;
      }
      await within(fileId,folders[fixture.project_id],meta);
      const saved=await admin.from('portal_entries').upsert({...fixture,kind:'document',status:'review',description:'Documento ficticio para verificar acceso privado desde el portal.',data:{category:'other',drive_file_id:fileId,file_name:filename,sha256:digest,qa_fixture:true}});if(saved.error)throw Error('SERVER_ERROR');
     }
     return reply(200,{ok:true,files:3,project_folders:2,expected_sha256:digest});
    }finally{await admin.from('portal_drive_test_lock').delete().eq('id','qa-files').eq('owner_id',lockId);}
   }
   if(!uuid(body.entry_id))return reply(400,{error:'Documento no válido'});
   const r=await admin.from('portal_entries').select('id,project_id,visibility,data').eq('id',body.entry_id).maybeSingle();if(r.error)throw Error('SERVER_ERROR');const entry=r.data;
   if(!entry)return reply(404,{error:'Archivo no disponible'});
   const member=await admin.from('portal_members').select('user_id,project_id,role').eq('project_id',entry.project_id).eq('user_id',user.id).maybeSingle();if(member.error)throw Error('SERVER_ERROR');
   if(!canRead(user.id,staff,member.data,entry))return reply(404,{error:'Archivo no disponible'});
   const binding=await admin.from('portal_drive_folders').select('folder_id').eq('project_id',entry.project_id).maybeSingle();if(binding.error)throw Error('SERVER_ERROR');
   const fileId=entry.data?.drive_file_id;if(!binding.data||!driveId(fileId))return reply(404,{error:'Archivo no disponible'});
   const folderId=binding.data.folder_id;
   if(!folderMatches(await meta(folderId),folderId,ROOT))throw Error('FILE_NOT_AVAILABLE');
   const file=await meta(fileId);await within(fileId,folderId,meta);
   if(!file.capabilities?.canDownload||file.mimeType==='application/vnd.google-apps.folder')return reply(403,{error:'Descarga no permitida'});
   if(Number(file.size||0)>MAX)return reply(413,{error:'El archivo supera 25 MB'});
   const native=['application/vnd.google-apps.document','application/vnd.google-apps.spreadsheet','application/vnd.google-apps.presentation'].includes(file.mimeType);
   if(file.mimeType.startsWith('application/vnd.google-apps.')&&!native)return reply(415,{error:'Formato no compatible'});
   const response=await drive('/drive/v3/files/'+encodeURIComponent(fileId)+(native?'/export?mimeType=application%2Fpdf':'?supportsAllDrives=true&alt=media'));
   if(!response.ok)return reply(502,{error:'No se pudo descargar el archivo'});
   if(Number(response.headers.get('content-length')||0)>MAX){await response.body?.cancel();return reply(413,{error:'El archivo supera 25 MB'});}
   let size=0;const stream=response.body?.pipeThrough(new TransformStream({transform(chunk,c){size+=chunk.byteLength;if(size>MAX)throw Error('FILE_TOO_LARGE');c.enqueue(chunk);}}));
   return new Response(stream,{status:200,headers:{...headers,'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(safeName(file.name)+(native?'.pdf':''))}});
  }catch(error){
   if(['FILE_NOT_AVAILABLE','ROOT_REQUIRED'].includes(error?.message))return reply(404,{error:'Archivo o carpeta no disponible para esta conexión'});
   if(error?.message==='NOT_CONNECTED')return reply(409,{error:'Vuelve a conectar Google Drive desde la cuenta del estudio'});
   return reply(503,{error:'No se pudo completar la operación privada de Drive. Revisa la instalación.'});
  }
 };
}

Deno.serve(makeFileHandler({createClient,OAuth2Client,env:name=>Deno.env.get(name),security:{oauthConfig,open,hash,TEAM_EMAILS,CALLBACK},jsonBody,access:{ROOT,SHARED_DRIVE,QA_PROJECT,OTHER_PROJECT,QA_USER,FIXTURES,QA_TEXT,driveId,uuid,canRead,folderMatches,within,safeName}}));
