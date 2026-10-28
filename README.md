# UMBER Interior Design

Development version of umberinteriordesign.com, based on the current UMBER website. Public source repository: japventures/UMBER-interiordesign.

## Included

- Original UMBER logo, warm brown/white palette, editorial home layout, and rotating photography.
- Eight portfolio projects with local detail pages and image lightboxes.
- Services, four-stage process, studio/about page, and contact layout.
- Six FAQ answers and two complete blog articles copied from the current site.
- Responsive mobile navigation, keyboard-accessible galleries, and reduced-motion support.
- 64 locally stored, optimized WebP images; original source URLs in docs/asset-manifest.json and docs/home-assets.json.

## Preview and hosting

Buildless HTML/CSS/JavaScript. Serve this directory with a static HTTP server. Each current website path has an index.html entry so direct links work on static hosting. Asset paths assume the root of a domain; a GitHub project subpath would need base-path configuration. No GitHub Pages workflow or hosting configuration has been activated.

## Deliberately disconnected

Contact and newsletter forms demonstrate layout and validation but do not transmit or store data. Their preview notices explicitly explain this. Login, client portal, blog comments/likes, and the deactivated Instagram widget are not replicated as operational services. Hosting, forms, subscriber data, analytics, DNS, email, and Wix migration remain separate work.

## Content review before release

The current Veneros detail page describes Tapalpa/rural woodland, although its portfolio location is Punta Mita. Its description is preserved for owner review. Arethusa's current detail page has no gallery images; this draft uses its verified portfolio thumbnail. Its location is shown as Houston, USA, consistent with the current portfolio (the source detail page says Houston, Mx.). Existing FAQ terms, pricing, timelines, and portal claims are copied from the source and require business confirmation before launch.

The original typeface is a licensed DIN family. This draft uses a local system-font fallback until appropriate font licensing/files are available. The home slideshow currently includes three original images rather than the full source rotation.

## Validation

JavaScript syntax checked. Browser-tested at desktop and 390px mobile width; inspected main routes, no horizontal overflow or broken rendered content images found. Navigation, mobile menu, FAQ disclosure, and gallery open/next/close tested. No real forms submitted. This is a reviewable visual replica, not a completed operational migration. Development pages retain noindex,nofollow.
