# Contact form: Formspree integration, staged only

## Destination and scope

The ES/EN contact form now posts to `https://formspree.io/f/mzerpbpg`.
The form's notification destination was confirmed in Formspree as
`info@umberinteriordesign.com` before implementation. The endpoint is a public
form ID, not a secret. The recipient is configured in Formspree, not by a
visitor-controlled field.

Based on remote domain-readiness commit `7f1dfe8801cb66838fd1831047c8c0f8f6b31992`,
including the Blog correction. This change does not modify main, deploy the
site, update Pages/DNS/email, or send a real submission. No private client data
or credentials were added. Existing noindex and portal behavior are retained.

## Behavior

- POST multipart to the fixed endpoint, with JSON response requested. Data is
  never put in a query string. Requests omit credentials and referrer and do not
  follow redirects. No automatic retries.
- Formspree receives the name/company, optional surname, project address/city,
  phone, lowercase `email` reply field, all selected project types, surface area,
  source, optional message, language, constant subject and empty honeypot.
- Required fields reject whitespace; email, phone (7–15 digits), positive area,
  at least one project type and field lengths are validated in ES/EN. Browser
  limits do not replace Formspree's server-side validation or spam protection.
- Only an HTTP success plus recognized JSON acceptance (`next` string, as used
  by Formspree's official client, or `ok: true`), without errors or contradictory
  `ok: false`, shows success and clears the form. The returned `next` is never
  followed. Success confirms submission acceptance, not inbox delivery.
- 4xx rejection, 429 rate limits, 5xx, invalid JSON, missing acknowledgment,
  connection loss and the 20-second timeout never produce a success message.
  Network/ambiguous errors explain that delivery is uncertain and warn against
  sending duplicates. Values remain available for correction.
- A shared pending lock prevents double-clicks or SPA/language navigation from
  starting parallel sends. An in-memory draft preserves fields and selected
  types across SPA/language changes, including failures. It is cleared after
  confirmed acceptance and is not saved in cookies, local/session storage or
  URLs. Full reloads/closed tabs do not retain it.
- Prerendered and runtime forms use explicit POST and disabled fieldsets/buttons.
  Controls are enabled only after the safe submit handler is installed. Missing
  JavaScript or required browser APIs leaves the form unavailable with the
  contact email visible. It does not silently fall back to GET or claim success.
- Shared app/style cache keys are refreshed on all public shells.

## Verification

Passed after the final changes:

```sh
node --test tests/*.test.cjs
for f in *.js tests/*.cjs; do node --check "$f"; done
git diff --check
```

103 tests passed in the final integrated tree, including the source-review
corrections, portal regression and 36 dedicated contact
checks. All use fictional data and mocked transports. Coverage includes ES/EN,
field validation, multiple types, success formats, rejected/malformed responses,
rate limit, timeout, connection failure, duplicate submit, missing APIs, honeypot,
static/runtime parity and blank SPA replacement forms restored after 422/timeout.
An independent read-only review confirmed that the draft-loss issue was fixed.

Prepared but **not run successfully**:

```sh
CHROMIUM_PATH=/usr/bin/chromium node tests/contact-form-browser.cjs
```

Chromium exited before opening any page because this environment denied its
local socket (`Operation not permitted`). None of that browser suite's assertions
or screenshots should be counted as passed. The script intercepts every request,
never forwards to Formspree, and covers desktop/mobile, both mounts, ES/EN,
failures, repeated sends, language change, no-JS and a missing app script.

Before production acceptance, run the browser suite in a capable environment
and authorize one clearly marked fictional submission from the intended hosted
origin. Confirm the request in Formspree and actual arrival at the destination
inbox, including spam/quota/challenge/domain restrictions. No real delivery or
hosted behavior has been certified by these local tests. The currently reported
free tier allows 50 submissions/month; verify current limits before release.

## Response contract reference

- [Formspree AJAX documentation](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax/)
- [Official success-response type and guard](https://github.com/formspree/formspree-js/blob/main/packages/formspree-core/src/submission.ts)

The custom handler does not load a third-party JavaScript library or add account
credentials to the public website.
