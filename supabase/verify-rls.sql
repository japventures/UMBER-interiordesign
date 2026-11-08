-- Run in the SQL editor AFTER the migration, before enabling the live portal.
-- Uses fictional users and records inside a transaction; ROLLBACK removes them.
-- An error aborts the transaction. Do not remove ROLLBACK or run against Pepper.
begin;
insert into auth.users(id,email,aud,role) values
('11111111-1111-4111-8111-111111111111','team@umber-rls.example.test','authenticated','authenticated'),
('22222222-2222-4222-8222-222222222222','client-a@umber-rls.example.test','authenticated','authenticated'),
('33333333-3333-4333-8333-333333333333','client-b@umber-rls.example.test','authenticated','authenticated'),
('44444444-4444-4444-8444-444444444444','viewer@umber-rls.example.test','authenticated','authenticated');
insert into public.portal_staff(user_id) values('11111111-1111-4111-8111-111111111111');
insert into public.portal_projects(id,name) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','RLS fixture A'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','RLS fixture B');
insert into public.portal_members(project_id,user_id,role) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','client'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','33333333-3333-4333-8333-333333333333','client'),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','viewer');
insert into public.portal_entries(id,project_id,kind,title,visibility,status) values
('10000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','selection','Review selection','client','review'),
('10000000-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','document','Internal draft','team','pending'),
('10000000-0000-4000-8000-000000000003','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','document','Other project document','client','review'),
('10000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','invoice','Invoice fixture','client','outstanding');
set local role authenticated;
set local request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$ begin
 if (select count(*) from public.portal_projects)<>1 then raise exception 'Client project isolation failed'; end if;
 if (select count(*) from public.portal_entries)<>2 then raise exception 'Internal/other project entry isolation failed'; end if;
 if exists(select 1 from public.portal_staff) then raise exception 'Staff list exposed'; end if;
 begin
  insert into public.portal_staff(user_id) values(auth.uid());
  raise exception 'Client escalated to staff';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.portal_projects(name) values('Unauthorized project');
  raise exception 'Client created project';
 exception when insufficient_privilege then null; end;
 update public.portal_entries set status='paid' where kind='invoice';
 if found then raise exception 'Client changed invoice'; end if;
end $$;
insert into public.portal_comments(project_id,author_id,body) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',auth.uid(),'Allowed comment');
insert into public.portal_decisions(entry_id,project_id,user_id,decision) values('10000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',auth.uid(),'approved');
do $$ begin
 begin
  insert into public.portal_comments(project_id,author_id,body) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',auth.uid(),'Denied comment');
  raise exception 'Cross-project comment accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.portal_decisions(entry_id,project_id,user_id,decision) values('10000000-0000-4000-8000-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',auth.uid(),'approved');
  raise exception 'Invoice decision accepted';
 exception when insufficient_privilege then null; end;
end $$;
set local request.jwt.claim.sub='44444444-4444-4444-8444-444444444444';
do $$ begin
 if (select count(*) from public.portal_projects)<>1 then raise exception 'Viewer cannot read assigned project'; end if;
 begin
  insert into public.portal_comments(project_id,author_id,body) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',auth.uid(),'Viewer cannot write');
  raise exception 'Viewer wrote comment';
 exception when insufficient_privilege then null; end;
end $$;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$ begin
 if (select count(*) from public.portal_projects)<>2 then raise exception 'Staff project visibility failed'; end if;
 if (select count(*) from public.portal_entries)<>4 then raise exception 'Staff draft visibility failed'; end if;
 update public.portal_entries set description='Staff edit verified' where id='10000000-0000-4000-8000-000000000002';
 if not found then raise exception 'Staff cannot edit'; end if;
 if not exists(select 1 from public.portal_audit where action='UPDATE') then raise exception 'Audit missing'; end if;
end $$;
set local role anon;
do $$ begin
 begin
  perform * from public.portal_projects;
  raise exception 'Anonymous project access allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
-- PASS if all blocks complete without an error. No fixture remains.
