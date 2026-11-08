-- UMBER client portal. Apply once to a new Supabase project (Free supported).
-- No real users, client information or credentials are included in this migration.
begin;
create schema if not exists portal_private;
revoke all on schema portal_private from public;
grant usage on schema portal_private to authenticated;

create table public.portal_staff (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table public.portal_projects (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 160),
 location text not null default '',
 status text not null default 'active' check(status in ('active','on_hold','completed','archived')),
 start_date date, target_date date,
 created_at timestamptz not null default now()
);
create table public.portal_members (
 project_id uuid not null references public.portal_projects(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'client' check(role in ('client','viewer')),
 primary key(project_id,user_id)
);
create table public.portal_entries (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.portal_projects(id) on delete cascade,
 kind text not null check(kind in ('stage','event','document','render','moodboard','tour','selection','invoice','update')),
 title text not null check(length(title) between 1 and 200),
 description text not null default '' check(length(description)<=10000),
 status text not null default 'pending' check(status in ('pending','in_progress','completed','review','ordered','delivered','paid','outstanding')),
 visibility text not null default 'team' check(visibility in ('team','client')),
 position integer not null default 0,
 starts_at timestamptz, ends_at timestamptz,
 data jsonb not null default '{}'::jsonb check(jsonb_typeof(data)='object' and octet_length(data::text)<=20000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,project_id),
 check(ends_at is null or (starts_at is not null and ends_at>=starts_at))
);
create index portal_entries_project_kind on public.portal_entries(project_id,kind,position);
create index portal_members_user on public.portal_members(user_id);
create table public.portal_comments (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.portal_projects(id) on delete cascade,
 entry_id uuid,
 author_id uuid not null references auth.users(id),
 body text not null check(length(trim(body)) between 1 and 4000),
 created_at timestamptz not null default now(),
 foreign key(entry_id,project_id) references public.portal_entries(id,project_id) on delete cascade
);
create index portal_comments_project on public.portal_comments(project_id,created_at);
create table public.portal_decisions (
 entry_id uuid not null,
 project_id uuid not null,
 user_id uuid not null references auth.users(id),
 decision text not null check(decision in ('approved','changes_requested')),
 note text not null default '' check(length(note)<=2000),
 updated_at timestamptz not null default now(),
 primary key(entry_id,user_id),
 foreign key(entry_id,project_id) references public.portal_entries(id,project_id) on delete cascade
);
create table public.portal_audit (
 id bigint generated always as identity primary key,
 actor_id uuid, action text not null, table_name text not null, record_id text,
 project_id uuid, created_at timestamptz not null default now()
);

create function portal_private.is_staff() returns boolean language sql stable security definer
 set search_path='' as $$ select exists(select 1 from public.portal_staff where user_id=(select auth.uid())); $$;
create function portal_private.can_view(pid uuid) returns boolean language sql stable security definer
 set search_path='' as $$ select portal_private.is_staff() or exists(select 1 from public.portal_members where project_id=pid and user_id=(select auth.uid())); $$;
create function portal_private.can_comment(pid uuid) returns boolean language sql stable security definer
 set search_path='' as $$ select portal_private.is_staff() or exists(select 1 from public.portal_members where project_id=pid and user_id=(select auth.uid()) and role='client'); $$;
create function portal_private.visible_entry(eid uuid,pid uuid) returns boolean language sql stable security definer
 set search_path='' as $$ select exists(select 1 from public.portal_entries where id=eid and project_id=pid and (portal_private.is_staff() or (visibility='client' and portal_private.can_view(pid)))); $$;
create function portal_private.decide_entry(eid uuid,pid uuid) returns boolean language sql stable security definer
 set search_path='' as $$ select portal_private.can_comment(pid) and exists(select 1 from public.portal_entries where id=eid and project_id=pid and kind='selection' and visibility='client' and status='review'); $$;
revoke all on all functions in schema portal_private from public;
grant execute on function portal_private.is_staff(),portal_private.can_view(uuid),portal_private.can_comment(uuid),portal_private.visible_entry(uuid,uuid),portal_private.decide_entry(uuid,uuid) to authenticated;

alter table public.portal_staff enable row level security;
alter table public.portal_projects enable row level security;
alter table public.portal_members enable row level security;
alter table public.portal_entries enable row level security;
alter table public.portal_comments enable row level security;
alter table public.portal_decisions enable row level security;
alter table public.portal_audit enable row level security;
revoke all on public.portal_staff,public.portal_projects,public.portal_members,public.portal_entries,public.portal_comments,public.portal_decisions,public.portal_audit from anon,authenticated;
grant select on public.portal_staff,public.portal_members,public.portal_audit to authenticated;
grant select,insert,update,delete on public.portal_projects,public.portal_entries to authenticated;
grant select,insert on public.portal_comments to authenticated;
grant select,insert,update on public.portal_decisions to authenticated;
-- Staff/member role changes are server-only; clients cannot grant themselves access.
create policy staff_read_self on public.portal_staff for select to authenticated using(user_id=(select auth.uid()));
create policy projects_read on public.portal_projects for select to authenticated using(portal_private.can_view(id));
create policy projects_staff_insert on public.portal_projects for insert to authenticated with check(portal_private.is_staff());
create policy projects_staff_update on public.portal_projects for update to authenticated using(portal_private.is_staff()) with check(portal_private.is_staff());
create policy projects_staff_delete on public.portal_projects for delete to authenticated using(portal_private.is_staff());
create policy members_read on public.portal_members for select to authenticated using(user_id=(select auth.uid()) or portal_private.is_staff());
create policy entries_read on public.portal_entries for select to authenticated using(portal_private.can_view(project_id) and (visibility='client' or portal_private.is_staff()));
create policy entries_staff_insert on public.portal_entries for insert to authenticated with check(portal_private.is_staff());
create policy entries_staff_update on public.portal_entries for update to authenticated using(portal_private.is_staff()) with check(portal_private.is_staff());
create policy entries_staff_delete on public.portal_entries for delete to authenticated using(portal_private.is_staff());
create policy comments_read on public.portal_comments for select to authenticated using(portal_private.can_view(project_id) and (entry_id is null or portal_private.visible_entry(entry_id,project_id)));
create policy comments_insert on public.portal_comments for insert to authenticated with check(author_id=(select auth.uid()) and portal_private.can_comment(project_id) and (entry_id is null or portal_private.visible_entry(entry_id,project_id)));
create policy decisions_read on public.portal_decisions for select to authenticated using(portal_private.can_view(project_id) and portal_private.visible_entry(entry_id,project_id));
create policy decisions_insert on public.portal_decisions for insert to authenticated with check(user_id=(select auth.uid()) and portal_private.decide_entry(entry_id,project_id));
create policy decisions_update on public.portal_decisions for update to authenticated using(user_id=(select auth.uid()) and portal_private.decide_entry(entry_id,project_id)) with check(user_id=(select auth.uid()) and portal_private.decide_entry(entry_id,project_id));
create policy audit_staff_read on public.portal_audit for select to authenticated using(portal_private.is_staff());

create function portal_private.touch_updated() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
create trigger entries_updated before update on public.portal_entries for each row execute function portal_private.touch_updated();
create trigger decisions_updated before update on public.portal_decisions for each row execute function portal_private.touch_updated();
create function portal_private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
 declare row_data jsonb; begin
 row_data=case when TG_OP='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 insert into public.portal_audit(actor_id,action,table_name,record_id,project_id)
 values(auth.uid(),TG_OP,TG_TABLE_NAME,coalesce(row_data->>'id',row_data->>'entry_id'),case when TG_TABLE_NAME='portal_projects' then (row_data->>'id')::uuid else (row_data->>'project_id')::uuid end);
 if TG_OP='DELETE' then return old; end if; return new;
 end; $$;
create trigger project_audit after insert or update or delete on public.portal_projects for each row execute function portal_private.audit_change();
create trigger entry_audit after insert or update or delete on public.portal_entries for each row execute function portal_private.audit_change();
create trigger comment_audit after insert on public.portal_comments for each row execute function portal_private.audit_change();
create trigger decision_audit after insert or update on public.portal_decisions for each row execute function portal_private.audit_change();
create trigger membership_audit after insert or update or delete on public.portal_members for each row execute function portal_private.audit_change();
revoke all on function portal_private.touch_updated(),portal_private.audit_change() from public;
grant all on public.portal_staff,public.portal_projects,public.portal_members,public.portal_entries,public.portal_comments,public.portal_decisions,public.portal_audit to service_role;
grant usage,select on sequence public.portal_audit_id_seq to service_role;
-- No Storage bucket is created: private Drive files remain in Workspace.
-- No anonymous read policies, public registrations or seeded client records.
commit;
