-- UMBER: exigir MFA para equipo y clientes. No cambia dominios ni membresías.
-- Ejecutar después de desplegar la pantalla MFA y las cuatro Edge Functions.
begin;
do $mfa$
declare tab text;
begin
 foreach tab in array array['portal_staff','portal_projects','portal_members','portal_entries','portal_comments','portal_decisions','portal_audit'] loop
  execute format('drop policy if exists require_mfa on public.%I',tab);
  execute format($policy$create policy require_mfa on public.%I as restrictive for all to authenticated using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2')$policy$,tab);
 end loop;
end $mfa$;
-- Invalida autorizaciones Google pendientes iniciadas antes de exigir MFA.
delete from public.portal_drive_oauth_states;
commit;
select tablename,policyname,permissive,roles,qual,with_check
from pg_policies where schemaname='public' and policyname='require_mfa' order by tablename;
