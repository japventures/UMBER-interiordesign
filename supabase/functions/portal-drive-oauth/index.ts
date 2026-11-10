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

// Server-side handler. Dependencies are injected for isolated security tests.
function makeHandler({createClient,OAuth2Client,env,security,jsonBody}){
 const {CALLBACK,FILE_SCOPE,TEAM_EMAILS,oauthConfig,random,hash,seal,open,validIdentity,validScopes}=security;
 const origin='https://japventures.github.io';
 const destination=origin+'/UMBER-interiordesign/es/admin/drive-check/';
 return async req=>{
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Pragma':'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
  const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
  const finish=state=>new Response(null,{status:303,headers:{...headers,Location:destination+'?drive='+state}});
  const path=new URL(req.url).pathname;
  const callback=req.method==='GET'&&path.endsWith('/portal-drive-oauth/callback');
  if(!callback&&req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'Origin not allowed'});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!callback&&req.method!=='POST')return reply(405,{error:'Method not allowed'});
  try{
   const admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
   const staff=async id=>{
    const result=await admin.from('portal_staff').select('user_id').eq('user_id',id).maybeSingle();
    return !result.error&&!!result.data;
   };
   if(callback){
    const params=new URL(req.url).searchParams;
    const state=params.get('state')||'';
    if(!/^[A-Za-z0-9_-]{43}$/.test(state))return reply(400,{error:'Enlace de autorización no válido. Vuelve al portal.'});
    // Atomic DELETE RETURNING consumes the state exactly once, before token exchange.
    const consumed=await admin.from('portal_drive_oauth_states').delete().eq('state_hash',await hash(state)).gt('expires_at',new Date().toISOString()).select('*').maybeSingle();
    if(consumed.error||!consumed.data)return reply(400,{error:'Autorización vencida o ya utilizada. Vuelve al portal.'});
    const pending=consumed.data;
    if(!await staff(pending.actor_id))return reply(403,{error:'Acceso del estudio requerido'});
    if(params.has('error'))return finish('cancelled');
    const code=params.get('code');if(!code||code.length>4096)return finish('failed');
    const config=oauthConfig(env('GOOGLE_DRIVE_OAUTH_CLIENT'));
    const client=new OAuth2Client(config.clientId,config.clientSecret,CALLBACK);
    const verifier=await open(pending.verifier_encrypted,config.clientSecret,'state:'+pending.actor_id);
    const {tokens}=await client.getToken({code,codeVerifier:verifier,redirect_uri:CALLBACK});
    if(!tokens.id_token||!tokens.refresh_token||!validScopes(tokens.scope))return finish('failed');
    const ticket=await client.verifyIdToken({idToken:tokens.id_token,audience:config.clientId});
    const identity=ticket.getPayload();
    if(!validIdentity(identity,pending))return finish('wrong-account');
    // Recheck current staff status after the Google requests.
    if(!await staff(pending.actor_id))return finish('failed');
    const refresh=await seal(tokens.refresh_token,config.clientSecret,'refresh:'+identity.sub);
    const saved=await admin.from('portal_drive_connections').upsert({id:'umber-drive',actor_id:pending.actor_id,google_email:identity.email,google_subject:identity.sub,refresh_token_encrypted:refresh,scopes:tokens.scope,updated_at:new Date().toISOString()});
    if(saved.error)return finish('failed');
    return finish('connected');
   }
   const token=(req.headers.get('authorization')||'').replace(/^Bearer /i,'');
   if(!token)return reply(401,{error:'Inicia sesión en el portal'});
   const auth=await admin.auth.getUser(token),user=auth.data?.user;
   if(auth.error||!user)return reply(401,{error:'Sesión no válida'});
   if(!verifiedMfa(token,user))return reply(403,{error:'MFA_REQUIRED'});
   if(!TEAM_EMAILS.includes(user.email)||!await staff(user.id))return reply(403,{error:'Acceso del equipo UMBER requerido'});
   const body=await jsonBody(req);
   if(body.action==='status'){
    const result=await admin.from('portal_drive_connections').select('actor_id,google_email,updated_at').eq('id','umber-drive').maybeSingle();
    if(result.error)throw Error('STORAGE_NOT_READY');
    const current=result.data;
    return reply(200,{connection_saved:!!current&&await staff(current.actor_id),account:current?.google_email||null,updated_at:current?.updated_at||null,files_ready:false});
   }
   if(body.action!=='begin')return reply(400,{error:'Acción no válida'});
   const config=oauthConfig(env('GOOGLE_DRIVE_OAUTH_CLIENT'));
   const state=random(),nonce=random();
   const client=new OAuth2Client(config.clientId,config.clientSecret,CALLBACK);
   const pkce=await client.generateCodeVerifierAsync();
   // Only one pending authorization per staff member; obsolete states expire in 10 minutes.
   const removed=await admin.from('portal_drive_oauth_states').delete().eq('actor_id',user.id);if(removed.error)throw Error('STORAGE_NOT_READY');
   const saved=await admin.from('portal_drive_oauth_states').insert({state_hash:await hash(state),actor_id:user.id,actor_email:user.email,verifier_encrypted:await seal(pkce.codeVerifier,config.clientSecret,'state:'+user.id),nonce,expires_at:new Date(Date.now()+10*60*1000).toISOString()});
   if(saved.error)throw Error('STORAGE_NOT_READY');
   const address=new URL(client.generateAuthUrl({access_type:'offline',prompt:'consent',include_granted_scopes:false,scope:['openid','email',FILE_SCOPE],state,login_hint:user.email,hd:'umberinteriordesign.com',code_challenge:pkce.codeChallenge,code_challenge_method:'S256'}));
   address.searchParams.set('nonce',nonce);
   if(address.protocol!=='https:'||address.hostname!=='accounts.google.com')throw Error('INVALID_AUTH_URL');
   return reply(200,{authorization_url:address.href});
  }catch{
   // Never return OAuth errors, codes, credentials or tokens, including in logs.
   if(callback)return finish('failed');
   return reply(503,{error:'Conexión aún no disponible. Revisa la instalación del componente OAuth.'});
  }
 };
}

Deno.serve(makeHandler({createClient,OAuth2Client,env:name=>Deno.env.get(name),security:{CALLBACK,FILE_SCOPE,TEAM_EMAILS,oauthConfig,random,hash,seal,open,validIdentity,validScopes},jsonBody}));
