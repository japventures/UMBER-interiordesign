# Private files and hosted access verification

Prepared from baseline 244d817. Nothing below has been run against a hosted project in this QA pass. It is a plan and a read-only catalog query, not a certification.

## Recovery result

- Git history contains only `supabase/functions/portal-admin/index.ts`; the three Drive functions are not in the fetched repository history.
- The known implementation thread is on the user's unavailable Mac. Do not access that screen or invent its contents.
- Targeted Space title searches found no Umber/portal-drive source package. Broader content search found unrelated files, not recoverable function source. This is not a complete inventory of all possible storage.
- The available Supabase plugin listing says installed=false in this runtime. No hosted catalog or function-source API was available. Do not generate tokens, grant OAuth or create ongoing access to work around this.

## First read-only checks when authorized access is available

1. Confirm project ref `nsugfmibvlrifcrvmsex` under JAP Ventures in the trusted service UI/API; never choose a project from its display name alone.
2. Run `supabase/inspect-portal-security.sql` via an already-authorized connection. It reads catalogs only, not project/client records. Save the time and output privately. Expect seven tables with RLS enabled, policies matching the reviewed migration, restricted grants and the intended audit triggers. RLS not forced does not by itself prove a vulnerability: table owner/service role may intentionally bypass it; callers must not receive those credentials.
3. Read migration history and edge function inventory/version metadata. Recover exact deployed source for `portal-drive`, `portal-drive-check`, `portal-drive-oauth` through the authorized management interface. Never collect secret values or access tokens. Compare code/version digest against what will be committed before claiming reproducibility.
4. Read hosted auth configuration (signup policy, exact redirects, SMTP readiness and session settings) without exposing credentials. Distinguish dashboard state from source TOML, which does not prove hosted state.

## Function review before any live file test

- Authenticate and authorize every download on the server; origin/CORS is not authorization.
- Resolve a file through a project entry visible to the caller, rather than trusting arbitrary project/file IDs from the client.
- Require active membership and client-visible publication; staff-only drafts and other projects return indistinguishable not-found responses.
- Restrict Drive traversal to the approved root and project mapping, including shortcuts, shared-drive targets and moved files. A Picker filter alone is not an access boundary.
- Keep OAuth tokens server-side and out of URLs, logs and client errors; validate state, expiry, redirect origin and caller binding on callbacks. Do not expand scopes during testing.
- Prevent shared caching of authenticated file responses; use private/no-store behavior and safe content/disposition headers. Do not leak Google token or resource URLs to unauthorized callers.
- Portal membership revocation must stop proxy reads immediately. Direct Google sharing remains a separate permission system requiring separate revocation.

## Synthetic test matrix (requires explicit approved test access; not run here)

Use isolated fictional projects A/B with staff S, client A, client B, viewer A and unassigned user U. Three tiny synthetic files: published A, team-only A, published B. No real client files.

- Anonymous, expired/invalid token, U: no private project/file access.
- Client A: published A only; team A and B denied even with a known file ID.
- Client B: published B only; A denied.
- Viewer A: published A readable; comments/decisions/writes denied.
- Staff S: all synthetic files readable; publication state changes explicit and audited.
- Remove A membership: fresh metadata and file requests denied; test both old URL and new request. Do not claim Google links revoked unless independently removed.
- Change published A to team-only: client A immediately loses metadata/file access.
- Alter project ID, entry ID and file ID separately; include a Drive shortcut outside the project/root. Each mismatch denied.
- Failed Drive/OAuth dependency: no fallback to public file access or demo data.
- User-visible errors/logs: no tokens, file content, unrelated file names or internal project data.

## Important existing test limitation

`supabase/verify-rls.sql` is **not read-only**: it inserts synthetic auth users and records inside a rollback transaction. It also asserts global staff-visible counts of 2 projects and 4 entries, so it assumes a clean test database and can fail on a populated deployment. Do not run it as this read-only audit or blindly run it on production. Prefer an approved isolated test database/branch; any adaptation must scope all counts and writes to fixture IDs and confirm cleanup. The new catalog query avoids those writes entirely.

Pass criteria must include both server denial evidence and the client experience. UI hiding and offline mocks alone do not prove hosted RLS or file confidentiality.
