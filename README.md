# UMBER — public design review

Review URL: https://japventures.github.io/UMBER-interiordesign/es/

This is a public review version. Homepage and San Francisco Ranch have an editorial design and ESP/ENG switch. Spanish translation of remaining legacy content is still in progress. Noindex is retained for review; it does not make this site private.

The client portal has a fictional sandbox and an enabled Supabase adapter. The checked-in configuration targets UMBER's separate project `nsugfmibvlrifcrvmsex`; it must not be treated as an unconfigured template or connected to another company's project. `review-version.json` records earlier real-account walkthroughs, but it is not independent evidence that all production access controls and integrations are ready. Private Drive delivery, external integrations and mobile visual acceptance still need verification. See docs/PORTAL-SETUP.md and docs/CLOUD-QA-20261109.md. Do not upload client documents or secrets to this public repository.

Offline regression tests (no real accounts, mail or backend requests):

```sh
node tests/portal.test.cjs
node --test tests/portal-service.test.cjs
```

Tests resolve files relative to their own directory and use a fixed fictional calendar date. They do not depend on the production portal configuration.

GitHub Pages currently uses main / root with .nojekyll. The staged domain-readiness version derives its mount from each page's pinned relative base, supporting both the project preview and a custom-domain root. It has not been published and does not change Wix, umberinteriordesign.com, DNS or email. See docs/DOMAIN-CUTOVER-20261110.md for verification, remaining release gates and exact callback/origin preparation.

64 optimized WebP images are reused from the existing public portfolio. Source references and content discrepancies remain documented. Production SEO/GEO, final content review, backend/authentication and domain migration remain separate work.
