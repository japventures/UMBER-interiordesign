# Blog label regression

The section is named **Blog** in English and Spanish, including navigation in the client portal. Its existing `/blog`, `/es/blog` and article routes are unchanged.

The static HTML already said `BLOG`. The translation dictionary still mapped `JOURNAL` to `BLOG`, so its reverse lookup silently replaced the correct label with `JOURNAL` when English was applied. The dictionary now maps `BLOG` to itself. All 47 static shells request the updated translator, and both static blog titles now identify Blog rather than Home.

## Verification

- `node --test tests/*.test.cjs`: 68 tests passed after domain integration.
- `node tests/portal.test.cjs`: passed.
- `node --check i18n.js`, `node --check tests/blog-label-browser.cjs` and `git diff --check`: passed.
- The focused 20-test suite exercises the real translator with English and Spanish initial states, repeated language changes, blog/portal/article paths, header/footer labels, canonical/hreflang links, and all 47 static shells at project, root and www mounts. On the original preview branch, reintroducing the old dictionary entry made all six runtime cases fail. After domain integration, all 20 focused tests pass.
- `CHROMIUM_PATH=/usr/bin/chromium node tests/blog-label-browser.cjs`: blocked before any page loaded. Chromium's local socket was denied by the execution environment (`Operation not permitted`). No browser assertions or visual checks are reported as passed. This optional test covers direct loads, repeated toggles and back/forward at 390px and 1440px with external requests blocked and the live backend disabled.

This change is for a review branch only. It does not deploy the site or change the domain, email, backend or access settings. The correction is integrated into domain-readiness without replacing its route/base-path changes.
