/* Data boundary: demo is explicit; live errors never fall back to sample data. */
window.UMBERPortalService=(()=>{
 const config=()=>window.UMBER_PORTAL_CONFIG||{};
 const configured=()=>{const c=config();return c.enabled===true&&(!c.expectedProjectRef||c.supabaseUrl===`https://${c.expectedProjectRef}.supabase.co`)&&/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(c.supabaseUrl)&&typeof c.publishableKey==='string'&&c.publishableKey.length>20&&!c.publishableKey.startsWith('sb_secret_')&&validPublicKey(c.publishableKey);};
 function validPublicKey(key){if(key.startsWith('sb_publishable_'))return true;try{return JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}catch{return false;}}
 let authFlow=['invite','recovery'].includes(new URLSearchParams(location.hash.slice(1)).get('type'))?new URLSearchParams(location.hash.slice(1)).get('type'):null;
 const passwordFlow=()=>authFlow;
 const clearPasswordFlow=()=>{authFlow=null;};
 let clientPromise;
 async function client(){if(!configured())throw Error('PORTAL_NOT_CONFIGURED');if(!clientPromise)clientPromise=import(config().sdkUrl).then(m=>m.createClient(config().supabaseUrl,config().publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'umber-portal-session'}})).catch(e=>{clientPromise=null;throw e;});return clientPromise;}
 const unwrap=r=>{if(r.error)throw r.error;return r.data;};
 const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
 const driveUrl=value=>{const u=safeUrl(value);if(!u)return null;return ['drive.google.com','docs.google.com'].includes(new URL(u).hostname)?u:null;};
 const fileUrl=e=>driveUrl(e.data?.drive_url)||safeUrl(e.data?.external_url);
 async function live(){const c=await client();const auth=await c.auth.getUser();if(auth.error?.name==='AuthSessionMissingError'||auth.error?.status===401)return null;const {user}=unwrap(auth);if(!user)return null;const assurance=unwrap(await c.auth.mfa.getAuthenticatorAssuranceLevel());if(assurance.currentLevel!=='aal2')return {user,staff:false,mfaRequired:true};const staffRows=unwrap(await c.from('portal_staff').select('user_id').eq('user_id',user.id));return {user,staff:staffRows.length>0};}
 async function projects(){return unwrap(await (await client()).from('portal_projects').select('*').order('created_at',{ascending:false}));}
 function scopeProjectData(id,result){for(const name of ['entries','comments','decisions','members']){if(!Array.isArray(result[name])||result[name].some(row=>row.project_id!==id))throw Error('PROJECT_SCOPE_MISMATCH');}const ids=new Set(result.entries.map(row=>row.id));if(result.comments.some(row=>row.entry_id&&!ids.has(row.entry_id))||result.decisions.some(row=>!ids.has(row.entry_id)))throw Error('PROJECT_SCOPE_MISMATCH');return result;}
 async function projectData(id){const c=await client();const results=await Promise.all([c.from('portal_entries').select('*').eq('project_id',id).order('position').order('created_at'),c.from('portal_comments').select('*').eq('project_id',id).order('created_at'),c.from('portal_decisions').select('*').eq('project_id',id),c.from('portal_members').select('project_id,user_id,role').eq('project_id',id)]);return scopeProjectData(id,{entries:unwrap(results[0]),comments:unwrap(results[1]),decisions:unwrap(results[2]),members:unwrap(results[3])});}
 async function signIn(email,password){return unwrap(await (await client()).auth.signInWithPassword({email,password}));}
 async function signOut(authClient=null){const c=authClient||await client();let remoteError=null;try{const r=await c.auth.signOut();remoteError=r.error||null;}catch(e){remoteError=e;}try{await c.auth.stopAutoRefresh();for(const storage of [window.localStorage,window.sessionStorage])for(const suffix of ['','-code-verifier','-user'])storage?.removeItem('umber-portal-session'+suffix);}finally{clientPromise=null;}return {localOnly:!!remoteError};}
 async function mfaStatus(){
  const c=await client();const factors=unwrap(await c.auth.mfa.listFactors());
  return (factors.totp||[]).filter(f=>f.status==='verified').map(f=>({id:f.id,name:f.friendly_name||'UMBER Portal'}));
 }
 async function mfaEnroll(){
  const c=await client();const factors=unwrap(await c.auth.mfa.listFactors());
  if((factors.totp||[]).some(f=>f.status==='verified'))throw Error('MFA_ALREADY_ENROLLED');
  for(const f of factors.all||[])if(f.factor_type==='totp'&&f.status==='unverified'&&f.friendly_name==='UMBER Portal')unwrap(await c.auth.mfa.unenroll({factorId:f.id}));
  return unwrap(await c.auth.mfa.enroll({factorType:'totp',friendlyName:'UMBER Portal',issuer:'UMBER Interior Design'}));
 }
 async function mfaVerify(factorId,code){
  if(!/^[0-9]{6}$/.test(code)||typeof factorId!=='string')throw Error('INVALID_MFA_CODE');
  const c=await client();const challenge=unwrap(await c.auth.mfa.challenge({factorId}));
  return unwrap(await c.auth.mfa.verify({factorId,challengeId:challenge.id,code}));
 }
 async function reset(email,redirectTo){return unwrap(await (await client()).auth.resetPasswordForEmail(email,{redirectTo}));}
 async function password(password){return unwrap(await (await client()).auth.updateUser({password}));}
 async function saveProject(row){return unwrap(await (await client()).from('portal_projects').insert(row).select().single());}
 async function saveEntry(row){const c=await client();return unwrap(await (row.id?c.from('portal_entries').update(row).eq('id',row.id):c.from('portal_entries').insert(row)).select().single());}
 async function comment(row){return unwrap(await (await client()).from('portal_comments').insert(row).select().single());}
 async function decide(row){return unwrap(await (await client()).from('portal_decisions').upsert(row,{onConflict:'entry_id,user_id'}).select().single());}
 async function downloadEntry(entryId){
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId))throw Error('INVALID_FILE');
  const c=await client();const {data,error}=await c.functions.invoke('portal-drive',{body:{action:'download',entry_id:entryId}});
  if(error)throw error;if(!(data instanceof Blob)||data.type.split(';')[0]!=='application/octet-stream'||!data.size||data.size>25*1024*1024)throw Error('INVALID_FILE_RESPONSE');
  return data;
 }
 async function admin(body){return unwrap(await (await client()).functions.invoke('portal-admin',{body}));}
 return {scopeProjectData,configured,client,live,projects,projectData,signIn,signOut,passwordFlow,clearPasswordFlow,mfaStatus,mfaEnroll,mfaVerify,reset,password,saveProject,saveEntry,comment,decide,downloadEntry,admin,safeUrl,driveUrl,fileUrl};
})();


