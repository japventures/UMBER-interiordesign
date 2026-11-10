import { createClient } from 'npm:@supabase/supabase-js@2.102.1';
// Secrets are set only in Supabase. Neither this function nor the website stores
// a service-role credential in GitHub. Each invocation verifies the caller.
const url=Deno.env.get('SUPABASE_URL')!;
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const origins=(Deno.env.get('PORTAL_ALLOWED_ORIGINS')||'https://japventures.github.io').split(',').map(s=>s.trim());
const site=Deno.env.get('PORTAL_SITE_URL')||'https://japventures.github.io/UMBER-interiordesign';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function verifiedMfa(token,user){
 // Call only after Supabase auth.getUser(token) validates this same JWT.
 try{const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const claims=JSON.parse(atob(part));return claims.sub===user.id&&claims.aal==='aal2';}catch{return false;}
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':origins.includes(origin)?origin:origins[0],'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
 const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!origins.includes(origin))return reply(403,{error:'Origin not allowed'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'Method not allowed'});
 if(Number(req.headers.get('content-length')||0)>5000)return reply(413,{error:'Request too large'});
 const token=(req.headers.get('authorization')||'').replace(/^Bearer /i,'');
 if(!token)return reply(401,{error:'Authentication required'});
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await admin.auth.getUser(token);
 if(authError||!user)return reply(401,{error:'Session expired'});
 if(!verifiedMfa(token,user))return reply(403,{error:'MFA_REQUIRED'});
 const {data:staff,error:staffError}=await admin.from('portal_staff').select('user_id').eq('user_id',user.id).maybeSingle();
 if(staffError||!staff)return reply(403,{error:'UMBER team access required'});
 try{
  const raw=await req.text();if(raw.length>5000)return reply(413,{error:'Request too large'});
  const body=JSON.parse(raw);const pid=body.project_id;
  if(!uuid.test(pid))return reply(400,{error:'Invalid project'});
  const {data:project}=await admin.from('portal_projects').select('id').eq('id',pid).maybeSingle();
  if(!project)return reply(404,{error:'Project not found'});
  if(body.action==='list_members'){
   const {data:members,error}=await admin.from('portal_members').select('user_id,role').eq('project_id',pid);if(error)throw error;
   const rows=await Promise.all((members||[]).map(async m=>{const {data}=await admin.auth.admin.getUserById(m.user_id);return {...m,email:data.user?.email||''};}));
   return reply(200,{members:rows});
  }
  if(body.action==='revoke'){
   if(!uuid.test(body.user_id))return reply(400,{error:'Invalid member'});
   const {error}=await admin.from('portal_members').delete().eq('project_id',pid).eq('user_id',body.user_id);if(error)throw error;
   await admin.from('portal_audit').insert({actor_id:user.id,action:'REVOKE_MEMBER',table_name:'portal_members',record_id:body.user_id,project_id:pid});
   return reply(200,{ok:true});
  }
  if(body.action!=='invite')return reply(400,{error:'Unknown action'});
  const email=String(body.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return reply(400,{error:'Invalid email'});
  const role=body.role==='viewer'?'viewer':'client';
  const {data:existingUsers,error:listError}=await admin.auth.admin.listUsers({page:1,perPage:1000});
  if(listError)throw listError;
  const existing=existingUsers.users.find(u=>u.email?.toLowerCase()===email);
  if(existing){
   const {error}=await admin.from('portal_members').upsert({project_id:pid,user_id:existing.id,role});if(error)throw error;
   await admin.from('portal_audit').insert({actor_id:user.id,action:'ASSIGN_MEMBER',table_name:'portal_members',record_id:existing.id,project_id:pid});
   if(!existing.email_confirmed_at){const {error:sendError}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:site+'/es/portal/reset/'});return reply(200,{ok:true,member_added:true,email_sent:!sendError,existing_account:true,invitation_pending:true});}
   return reply(200,{ok:true,member_added:true,email_sent:false,existing_account:true});
  }
  if(existingUsers.users.length>=1000)return reply(409,{error:'Use Supabase Authentication to assign this account.'});
  // Generate link creates an invite without transmitting email. Establish
  // project membership first, then request the invitation email via Admin API.
  const {data:link,error:linkError}=await admin.auth.admin.generateLink({type:'invite',email,options:{redirectTo:site+'/es/portal/reset/'}});
  if(linkError||!link.user)return reply(400,{error:'Invitation could not be prepared; verify the email or assign an existing user from Supabase.'});
  const {error:memberError}=await admin.from('portal_members').upsert({project_id:pid,user_id:link.user.id,role});if(memberError)throw memberError;
  const {error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:site+'/es/portal/reset/'});
  if(inviteError)return reply(200,{ok:true,member_added:true,email_sent:false,message:'Access assigned. Invitation email failed; verify SMTP and resend from Supabase Authentication.'});
  await admin.from('portal_audit').insert({actor_id:user.id,action:'INVITE_MEMBER',table_name:'portal_members',record_id:link.user.id,project_id:pid});
  return reply(200,{ok:true,member_added:true,email_sent:true});
 }catch{return reply(500,{error:'Unable to complete the action. Check the private function logs.'});}
});

