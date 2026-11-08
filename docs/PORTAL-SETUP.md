# UMBER portal — activation and operating boundaries

## Current state

The public site contains a functional fictional sandbox at `/es/portal/demo/` and `/portal/demo/`. It supports client/team views, two sample projects, nine client sections, project creation, content editing, client publication/drafts, contextual comments, selection decisions, document filters and calendar exports. Sandbox changes remain in memory and disappear on reload. No invitation email is sent in sandbox mode.

The live adapter and Supabase schema are prepared. **No Supabase project, migration, staff account, private Drive integration or SMTP service has been provisioned or verified by this source change.** `portal-config.js` intentionally has `enabled: false` and empty URL/key. No credentials are collected until activated. Live failures never fall back to sample data.

Use the owner's existing Supabase account (the one with Pepper). Create a distinct project named `umber-portal` if a Free project slot is available. Do not run any SQL in Pepper, add UMBER tables to Pepper, change Pepper billing or create a paid project without authorization. Check the target organization plan before creation; a project in a paid organization can incur compute charges. The owner enters any new database password personally.

## Activation sequence

1. Verify owner account, organization, Free-plan availability and the new UMBER project identity.
2. Apply `supabase/migrations/202611080001_portal.sql` once to that new project. No clients or passwords are seeded.
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

No Drive OAuth client, service account, domain-wide delegation, file upload, private video embedding or file proxy has been configured. A seamless single-login file experience needs a separately reviewed server integration. Do not make files public to simulate it. Large files stay in Workspace; no binary client uploads are added to the public repository.

## Cost boundaries

Use a single Free Supabase project for initial integration, within the account's available project limit. It can pause after inactivity. Do not add artificial keep-alive tasks. Workspace/domain/Wix charges remain separate. Email delivery and third-party tour/video hosting may have their own limits. No payment provider is connected.

## Verification

Run `node tests/portal.test.cjs` from the published source parent workspace using the test's documented path, or adjust its root. Tests currently cover configuration guards, links, portal sections, filters, project switching, team/client separation, escaped comments, selection simulation and Houston daylight-saving transitions. Run `node --check` on each changed JavaScript file.

The transactional Postgres test is supplied but **must be executed in the new UMBER Supabase project**. Mock/UI tests do not prove hosted RLS or Auth. Browser verification must use the published review site if the local preview is unavailable. Keep review noindex; it is not a privacy control.
