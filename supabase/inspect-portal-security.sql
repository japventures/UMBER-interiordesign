-- READ ONLY: run only in the verified UMBER project (nsugfmibvlrifcrvmsex).
-- Catalog metadata only. No client rows, auth.users, credentials or secrets.
-- This is evidence collection, not proof of correct runtime authorization.
begin read only;

-- Expected seven tables; missing names or rls_enabled=false require investigation.
with expected(name) as (values ('portal_staff'),('portal_projects'),('portal_members'),
 ('portal_entries'),('portal_comments'),('portal_decisions'),('portal_audit'))
select e.name, c.oid is not null as exists_in_public,
 c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from expected e left join pg_namespace n on n.nspname='public'
left join pg_class c on c.relnamespace=n.oid and c.relname=e.name and c.relkind='r'
order by e.name;

-- Compare names, roles and predicates with the checked-in migration.
select tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies where schemaname='public' and tablename in
 ('portal_staff','portal_projects','portal_members','portal_entries',
  'portal_comments','portal_decisions','portal_audit')
order by tablename,policyname;

-- All explicit portal grants, including PUBLIC. Investigate unexpected grants.
select table_name,grantee,privilege_type,is_grantable
from information_schema.table_privileges where table_schema='public'
and table_name in ('portal_staff','portal_projects','portal_members','portal_entries',
 'portal_comments','portal_decisions','portal_audit')
order by table_name,grantee,privilege_type;

-- Function identity/security settings and digest, not function body or row data.
select p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
 p.prosecdef as security_definer,p.proconfig as settings,p.proacl as acl,
 md5(pg_get_functiondef(p.oid)) as definition_digest
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='portal_private' and p.prokind='f' order by p.proname;

select c.relname as table_name,t.tgname,t.tgenabled,p.proname as function_name
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace join pg_proc p on p.oid=t.tgfoid
where n.nspname='public' and c.relname in
 ('portal_projects','portal_members','portal_entries','portal_comments','portal_decisions')
and not t.tgisinternal order by c.relname,t.tgname;
rollback;
