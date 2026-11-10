# UMBER domain readiness — staged, not published

## Scope and source

This isolated change prepares the existing public site for both:

- Custom-domain root: `https://umberinteriordesign.com/` (canonical), with `www` canonicalized to the apex in document metadata.
- Project preview: `https://japventures.github.io/UMBER-interiordesign/`.

Baseline local integration: `539cacbacb4f5c5f35cf15d99214fc5181da870a`.
Remote review commit: `6b677e8099a5e274c547fba57557aadd66b231b2` on `qa/integrated-editorial-emojis-20261110`.
The GitHub Git-commit API and local Git both report baseline tree `ea425a6c9edf5405373c459e5ee006493b524a2e`.

No DNS, domain transfer, Pages settings, deployment, CNAME, hosted Supabase configuration, Google settings, email, live accounts or client data were changed. All pages retain `noindex,nofollow`. The contact form remains a non-sending preview. This is routing preparation, not production acceptance.

## Code changes

- Public HTML uses a route-relative `<base>` that resolves to the mount root on either host, including static ES/EN links before application scripts run. A small early script pins the resolved base to an absolute URL so SPA history changes cannot shift asset paths.
- The 404 shell detects the project prefix or root before loading resources. Its HTTP status remains the host's 404; it is not an authorization mechanism or server rewrite.
- Browser configuration derives its mount from the pinned base. Canonical/alternate metadata uses the actual preview origin or the custom-domain apex, with directory-style trailing slashes. Stale static canonical tags pointing every route to the old preview home are removed.
- `/index.html` route variants resolve to the corresponding directory route. Internal query strings survive language normalization and SPA navigation.
- Shared asset cache versions are refreshed consistently across all 47 public shells. Drive QA source and backend implementation are not changed.

Directory URLs without a trailing slash must be redirected by the host to the slash form before HTML is served. GitHub Pages provides this directory behavior. Any replacement host must preserve it. A custom domain attached to GitHub Pages normally redirects the old `github.io` project URL to that domain; this change does not create a separately hosted permanent staging site.

## Verification

Passed in this environment:

```sh
node --test tests/domain-routing.test.cjs tests/portal-service.test.cjs tests/public-ui.test.cjs tests/website-editorial.test.cjs tests/website-no-emoji.test.cjs
node tests/portal.test.cjs
for f in *.js tests/*.cjs; do node --check "$f"; done
git diff --check
```

The combined Node suite passes 47 tests. The domain suite checks all 46 public index shells at root, www and project mounts; their static resources/links; the 404 bootstrap at arbitrary URL depth; ES/EN URL normalization; canonical/hreflang; and the actual reset form handler's callback URL without transmitting mail. The existing full portal regression also passes. A separate read-only reviewer found no introduced routing regression.

Browser test prepared but **not run successfully**:

```sh
CHROMIUM_PATH=/usr/bin/chromium node tests/domain-routing-browser.cjs
```

Chromium exits before any test page because this environment denies its local socket, including the permitted escalated launch attempt. Do not count the browser assertions as passed. The test intercepts all origins, blocks external network, disables the real backend and uses fictional recovery data. It covers direct/deep loads, assets, ES/EN, canonical/noindex, SPA/reload/back/forward, 404, callback query/hash preservation and static navigation with JavaScript disabled.

Required later: run that browser test on a capable environment, repeat ES/EN desktop/mobile visual checks, and verify actual hosted URLs after an authorized deployment. Mocked/offline tests do not validate HTTPS, DNS propagation, CDN images, SMTP, hosted Auth, MFA/RLS or Drive permissions.

## Supabase settings to reconcile before a future cutover

Target the existing UMBER project `nsugfmibvlrifcrvmsex` only. Read the current settings first. The checked-in `supabase/config.toml` intentionally remains the preview reference; changing that file alone would not update hosted Auth.

Proposed hosted Auth Site URL after approval:

```text
https://umberinteriordesign.com/es/portal/
```

Exact allowed redirect URLs, retaining preview links while they may still be in use:

```text
https://umberinteriordesign.com/es/portal/reset/
https://umberinteriordesign.com/portal/reset/
https://www.umberinteriordesign.com/es/portal/reset/
https://www.umberinteriordesign.com/portal/reset/
https://japventures.github.io/UMBER-interiordesign/es/portal/reset/
https://japventures.github.io/UMBER-interiordesign/portal/reset/
```

Only retain `www` callbacks if that host is served or safely redirects to the apex with query and fragment intact. No wildcard redirect grant is needed. Keep public sign-up disabled.

The existing `portal-admin` Edge Function needs its server environment reconciled, not a replacement function or a new Supabase project:

```text
PORTAL_SITE_URL=https://umberinteriordesign.com
PORTAL_ALLOWED_ORIGINS=https://umberinteriordesign.com,https://www.umberinteriordesign.com,https://japventures.github.io
```

Use only origins actually required and authorized. `PORTAL_SITE_URL` has no trailing slash because the function appends `/es/portal/reset/`. CORS origins must not include a path. The function's invitation links use this server variable, whereas browser password resets use the current origin and detected mount. Do not expose server secrets in the site or GitHub.

The email templates use Supabase's `{{ .ConfirmationURL }}` and do not hardcode the preview domain. Verify real SMTP readiness and one authorized invitation/recovery/MFA round trip after the settings change. Do not send test invitations without authorization. Existing browser sessions are origin-specific; users should expect to sign in again on the new domain.

## Drive and Google dependency

The normal portal, private delivery functions and the Drive QA page may need new origin allowlists. Exact deployed `portal-drive`, `portal-drive-check` and `portal-drive-oauth` implementations are not in this source tree, so their server callbacks, CORS and return URLs cannot be certified from this change.

Read their deployed configuration before editing. The Google Picker uses `location.origin`; check the OAuth client's authorized JavaScript origins and API-key referrer restrictions for the actual root/www hosts. Keep the existing Supabase-hosted OAuth callback if that is what the server uses; do not replace it with the website root by assumption. No expansion of OAuth scopes or Drive sharing is implied.

## Future cutover checklist

1. Obtain approval for the final source revision, publication and domain/security settings. Keep `noindex` until its separate release decision; never remove it just because DNS is pointed.
2. Run the blocked browser checks and settle whether a non-sending contact form is acceptable or needs a separately authorized working delivery flow.
3. Verify the DNS provider currently authoritative for the domain. A registrar transfer and a DNS-hosting change are separate operations. Snapshot the current zone and Pages settings for rollback. Preserve MX, SPF, DKIM, DMARC and verification records.
4. Reconcile the Auth, Edge Function and Google origin/callback settings above through authorized account access. Verify that the existing private access controls still hold.
5. Configure the custom domain and its verification/HTTPS in GitHub Pages, and publish the approved revision using the current deployment method. Do not assume pushing a review branch changes the site. Add CNAME only as part of that approved setup if branch publishing requires it.
6. Apply only the verified website DNS records at the authoritative provider, following current GitHub Pages requirements. Do not change nameservers or email records as an accidental side effect.
7. Check apex/www HTTPS, deep routes and their slash redirects, both languages, images, navigation/history, error pages, contact behavior and authenticated portal recovery/invitation/MFA/private-file access. Check the exact deployed commit and deployment status. Verify legacy preview redirects preserve callback parameters.
8. The site still fetches high-resolution public images from Wix's CDN. Verify these images and retain the old hosting/assets until their migration/lifecycle has been reviewed; do not cancel Wix as a side effect of changing DNS.
9. If checks fail, restore only the recorded website DNS/Pages configuration, leave email intact and keep the reviewed source available for correction. DNS caches may delay rollback. Do not broaden auth or sharing permissions to make a test pass.
