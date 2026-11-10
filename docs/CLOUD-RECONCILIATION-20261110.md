# Cloud QA reconciliation 10 November 2026

## Preserved source

Local branch `qa/cloud-reconcile-20261110` in `umber-reconciled` starts at main `c8db61e9db203c251e9b8a9bda739579d88da0ba`. It incorporates QA commits dc02023 and b8f2695 without conflicts. The original umber-cloud-qa checkout remains unchanged. No push or deployment was made. Emoji changes are being prepared independently and are not included.

Tests needed browser URLSearchParams and location.hash in their offline VM fixtures after the MFA update. Only fixtures were adapted; application source is unchanged. Added password-flow retention and malformed MFA/file-input regressions. No real SDK, credentials, accounts or network are used in these tests.

## Verification

- UI regression passed against reconciled source. Root JavaScript/test syntax and git diff --check also passed.
- Seven original service regressions passed against reconciled source. Two additional auth/input regressions also passed: 9 service tests total.
- Public fictional demo: all nine Spanish client sections opened at the actual 1180px viewport; document scrollWidth was 1165px for each, and the internal fixture draft was absent. This is desktop smoke evidence, not mobile acceptance and not hosted authorization evidence.
- Mobile remains unverified: this browser exposes no viewport setter; device-toolbar keyboard commands did not change the viewport. The existing 375/390/768/1440 browser runner is retained for a functioning supported test environment.
- No PostgreSQL, psql, initdb or Docker runtime is installed here. No SQL was sent to a hosted database.

## Disposable SQL run plan

The separately reviewed SQL and patch remain in ../umber-mfa-test-review, without duplication or edits here. Use a fresh local disposable Supabase database, never the UMBER hosted project, Pepper or customer data. It must contain the standard Supabase auth schema and authenticated/anon roles; bare PostgreSQL is insufficient.

1. Start the disposable local Supabase stack with its own local test credentials. Do not import hosted records, OAuth secrets or users.
2. On that local database only, apply migrations 202611080001_portal.sql and 202611100001_require_mfa.sql in order. The hosted project already has these; do not repeat them there.
3. Inspect target identity locally and confirm it has no customer data. Invoke psql with ON_ERROR_STOP=1 and the separately reviewed verify-rls.sql. Use only the disposable local connection, not an environment variable that might contain production credentials.
4. Require all assertions and final ROLLBACK to complete. Reconnect as local database owner and verify none of the fixture users, projects or entries remain. On any error, close the test connection so its transaction is rolled back; preserve the error and destroy the disposable stack.
5. Record engine/Supabase version, migration hashes, exact patch hash, exit status and cleanup counts. Do not claim integration success from static validation alone.

This plan has not been executed because the required database runtime is absent. Live TOTP, recovery receipt, membership revocation/restoration and Drive permission tests remain separate and require authorized sessions. Historical CLOUD-QA-20261109 and DRIVE-RLS-VERIFICATION describe the earlier baseline; their missing-Drive-source statements are superseded by main c8db61e.
