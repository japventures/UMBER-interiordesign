// Offline security-boundary regressions. No SDK imports, network or real data.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(hash=''){
 const removed=[];
 const context={window:{localStorage:{removeItem:k=>removed.push(['local',k])},sessionStorage:{removeItem:k=>removed.push(['session',k])}},location:{hash},URL,URLSearchParams,atob};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../portal-service.js'),'utf8'),context);
 return {context,S:context.window.UMBERPortalService,removed};
}
const config={enabled:true,supabaseUrl:'https://fictional.supabase.co',expectedProjectRef:'fictional',publishableKey:'sb_publishable_fictional_test_only'};
test('configuration fails closed on wrong project, secret/invalid keys and disabled portal',()=>{
 const {context,S}=fixture();
 for(const patch of [{enabled:false},{supabaseUrl:'http://fictional.supabase.co'},{expectedProjectRef:'other'},{publishableKey:'sb_secret_fake_should_never_work'},{publishableKey:'not-a-valid-public-key-at-all'}, {publishableKey:'x.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64')+'.x'}]){
  context.window.UMBER_PORTAL_CONFIG={...config,...patch};assert.equal(S.configured(),false,JSON.stringify(patch));
 }
 context.window.UMBER_PORTAL_CONFIG=config;assert.equal(S.configured(),true);
 context.window.UMBER_PORTAL_CONFIG={...config,publishableKey:'x.'+Buffer.from(JSON.stringify({role:'anon'})).toString('base64')+'.x'};assert.equal(S.configured(),true);
});
function rows(){return {entries:[{id:'e-a',project_id:'a'}],comments:[{project_id:'a',entry_id:'e-a'},{project_id:'a',entry_id:null}],decisions:[{project_id:'a',entry_id:'e-a'}],members:[{project_id:'a',user_id:'fake'}]};}
test('every collection rejects cross-project or malformed responses',()=>{
 const {S}=fixture();const good=rows();assert.equal(S.scopeProjectData('a',good),good);
 for(const name of ['entries','comments','decisions','members']){
  for(const mutation of [null,{},[{project_id:'b',id:'e-b'}]]){
   assert.throws(()=>S.scopeProjectData('a',{...rows(),[name]:mutation}),/PROJECT_SCOPE_MISMATCH/,name);
  }
 }
});
test('comments/decisions cannot refer to an entry missing from visible project results',()=>{
 const {S}=fixture();
 for(const name of ['comments','decisions'])assert.throws(()=>S.scopeProjectData('a',{...rows(),[name]:[{project_id:'a',entry_id:'hidden-or-other-project'}]}),/PROJECT_SCOPE_MISMATCH/);
 assert.throws(()=>S.scopeProjectData('a',{...rows(),decisions:[{project_id:'a',entry_id:null}]}),/PROJECT_SCOPE_MISMATCH/);
});
test('resource URLs reject active schemes, HTTP, credentials and Drive lookalikes',()=>{
 const {S}=fixture();
 for(const url of ['javascript:alert(1)','data:text/html,test','http://drive.google.com/file/d/test','https://user:pass@drive.google.com/file/d/test'])assert.equal(S.safeUrl(url),null);
 for(const url of ['https://drive.google.com.evil.test/file','https://evil.test/?drive.google.com','https://drive.google.com@evil.test/file'])assert.equal(S.driveUrl(url),null);
 assert.equal(S.fileUrl({data:{drive_url:'javascript:alert(1)'}}),null);
 assert.equal(S.driveUrl('https://docs.google.com/document/d/fake'),'https://docs.google.com/document/d/fake');
});
for(const failure of ['none','returned','thrown'])test(`sign-out clears local session even when remote outcome is ${failure}`,async()=>{
 const {S,removed}=fixture();let stopped=0;
 const client={auth:{signOut:async()=>{if(failure==='thrown')throw Error('offline');return {error:failure==='returned'?Error('offline'):null};},stopAutoRefresh:async()=>{stopped++;}}};
 const result=await S.signOut(client);assert.equal(result.localOnly,failure!=='none');assert.equal(stopped,1);
 assert.equal(removed.length,6);assert.deepEqual(removed.map(r=>r[1]),['umber-portal-session','umber-portal-session-code-verifier','umber-portal-session-user','umber-portal-session','umber-portal-session-code-verifier','umber-portal-session-user']);
});

test('only invitation and recovery hashes enter password setup before SDK initialization',()=>{
 for(const flow of ['invite','recovery']){
  const {S,context}=fixture('#type='+flow+'&access_token=fictional-unused');
  assert.equal(S.passwordFlow(),flow);
  context.location.hash='';assert.equal(S.passwordFlow(),flow,'SDK hash cleanup must not erase flow');
  S.clearPasswordFlow();assert.equal(S.passwordFlow(),null);
 }
 for(const hash of ['', '#type=signup', '#type=magiclink', '#type=unknown'])assert.equal(fixture(hash).S.passwordFlow(),null);
});
test('malformed MFA codes and file IDs fail before any SDK or network access',async()=>{
 const {S}=fixture();
 for(const code of ['', '12345', '1234567', '12a456'])await assert.rejects(S.mfaVerify('fixture-factor',code),/INVALID_MFA_CODE/);
 await assert.rejects(S.mfaVerify(null,'123456'),/INVALID_MFA_CODE/);
 for(const id of ['', '../other', 'not-an-id'])await assert.rejects(S.downloadEntry(id),/INVALID_FILE/);
});
