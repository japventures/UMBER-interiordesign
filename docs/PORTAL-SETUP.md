# UMBER portal — activation and operating boundaries

## Current state

The public site contains a functional fictional sandbox at `/es/portal/demo/` and `/portal/demo/`. It supports client/team views, two sample projects, nine client sections, project creation, content editing, client publication/drafts, contextual comments, selection decisions, document filters and calendar exports. Sandbox changes remain in memory and disappear on reload. No invitation email is sent in sandbox mode.

The checked-in adapter is now **enabled** and pinned to UMBER project `nsugfmibvlrifcrvmsex`. Do not create another project or re-run initial provisioning just because an older version of this document said it was disabled. The deployment manifest reports prior real-account core walkthroughs; the offline tests described below do not independently verify that claim or hosted RLS/Auth configuration.

Use the existing UMBER project under JAP Ventures. Do not modify Pepper, other companies, billing or production settings as part of offline QA. The public configuration may contain only a publishable/anon key, never a server key or database password.

## Activation checklist (reconcile against existing deployment before acting)

1. Verify owner account, organization, current plan and the existing UMBER project identity. No paid change is implied.
2. Check the migration history before applying `supabase/migrations/202611080001_portal.sql`. Never blindly repeat provisioning. No clients or passwords are seeded by the migration.
3. Run `supabase/verify-rls.sql` transactionally; it must pass and roll back. This checks client A/B isolation, team-only drafts, viewer restrictions, denied anonymous access, denied staff escalation, invoice immutability for clients, allowed design decisions and staff audit logging.
4. Authentication: disable public sign-ups, use email/password, minimum password length 12, set the Site URL and exact redirect URLs listed in `supabase/config.toml`. Hosted dashboard values must be configured explicitly; the TOML is a local/deployment reference and does not configure hosted Auth by itself. Avoid wildcard redirects. Do not enable SMS, SAML, custom API domains or paid add-ons.
5. Configure a production SMTP provider before client invitations or password resets. Supabase's default mail service is restricted and cannot be assumed to email arbitrary clients. Verify UMBER domain SPF/DKIM separately. Do not send invitations during development without an explicit request.
6. Create/invite authorized staff through Authentication; have them set their own passwords. Run the reviewed `bootstrap-staff.sql` for those exact accounts only. Browser clients cannot assign staff roles.
7. Deploy `portal-admin` Edge Function. It authenticates every request with `auth.getUser`, checks `portal_staff`, validates the project and only then handles membership/invitations. Required server environment: default `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, plus `PORTAL_SITE_URL` and `PORTAL_ALLOWED_ORIGINS`. No server secret goes in GitHub or browser config. `verify_jwt=false` is intentional for current signing keys; authorization is enforced inside the function, including on every POST. Deploy with no gateway JWT verification if required by the CLI configuration.
8. In `portal-config.js`, set only the project URL and its **publishable** key (or legacy `anon` key). Never use `service_role`, a secret key, access token or database password. Set `enabled: true` only after step 3 passes.
9. Test two isolated accounts, a viewer, a staff account, expired session, recovery/invitation links, actual saving/reload, sign out, rejected unauthorized API calls and the private Drive access path. Only then admit real clients.

## Data and access

- `portal_projects`: client project records, independent from Supabase infrastructure projects.
- `portal_members`: project membership (`client` can comment/decide; `viewer` reads only).
- `portal_staff`: authorized UMBER staff. Server/bootstrap only for writes.
- `portal_entries`: stages, events, documents, renders, moodboards, tours, selections, invoices and progress updates. Default visibility is team-only. Staff explicitly publish to clients.
- `portal_comments`: general or entry-specific discussion; no email notifications yet.
- `portal_decisions`: client design choices. No purchase authorization or payment processing.
- `portal_audit`: server-generated activity metadata readable by staff only. No raw document contents or credentials.

All seven tables use RLS and explicit grants. Authorization is enforced in Postgres, not just in the navigation. No public read policy or public storage bucket is created.

## Drive phase 1

Staff attach **restricted** Drive/Docs links to a project entry. Drive independently enforces its own permissions. A Supabase login does not automatically give Drive access; the client may need a Google account with permission on the specific folder/file. No one is added to the entire UMBER shared drive automatically. Removing portal membership does not revoke existing Drive permissions; revoke those separately.

The `/es/admin/drive-check/` QA screen references `portal-drive`, `portal-drive-check` and `portal-drive-oauth`, but their server implementations are not in this repository at the audited revision. This source review cannot verify their deployment or authorization. The normal portal still uses direct Drive links; the QA screen is not proof that private proxy delivery is integrated into the client portal. A seamless single-login file experience needs a separately reviewed server integration. Do not make files public to simulate it. Large files stay in Workspace; no binary client uploads are added to the public repository.

## Cost boundaries

Use a single Free Supabase project for initial integration, within the account's available project limit. It can pause after inactivity. Do not add artificial keep-alive tasks. Workspace/domain/Wix charges remain separate. Email delivery and third-party tour/video hosting may have their own limits. No payment provider is connected.

## Verification

Run `node tests/portal.test.cjs` and `node --test tests/portal-service.test.cjs` from the repository root. Both are offline and use fictional fixtures; the UI test has a fixed clock and neither reads the deployed portal configuration. Tests currently cover configuration guards, links, portal sections, filters, project switching, team/client separation, escaped comments, selection simulation and Houston daylight-saving transitions. Run `node --check` on each changed JavaScript file.

The transactional Postgres test is supplied but **must be verified against the existing UMBER Supabase project under the appropriate authorization**. Mock/UI tests do not prove hosted RLS or Auth. Browser verification must use the published review site if the local preview is unavailable. Keep review noindex; it is not a privacy control.

## Calendar and Gantt

The calendar section has Calendar and Gantt views over the same visible stage/event records. Gantt supports entire-project or month ranges, status bars, event/milestone markers, a today line and detail dialogs. Rows without a start date appear under To be scheduled rather than receiving inferred dates. The normal calendar also shows scheduled stages across their date ranges. Staff can edit stage start/end dates using Houston time. No drag scheduling, dependency automation or notifications are enabled. Existing starts_at/ends_at fields support both views without a new migration. Demo schedule dates are fictional.
