-- Run only in the NEW UMBER project, as an owner in Supabase SQL Editor.
-- First create/invite the two staff accounts in Authentication. This SQL sends
-- no invitations and does not grant privileges to anyone who has not signed up.
-- Replace placeholders; never put passwords or keys in this file.
insert into public.portal_staff(user_id)
select id from auth.users where email in (
 'REPLACE_WITH_AUTHORIZED_STAFF_EMAIL_1',
 'REPLACE_WITH_AUTHORIZED_STAFF_EMAIL_2'
) on conflict(user_id) do nothing;
-- Verify staff identities privately in Supabase before enabling the website.
