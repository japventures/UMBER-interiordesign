/* The same tree works at a custom-domain root and a GitHub Pages project path.
 * HTML resolves and pins its relative <base> before any styles/scripts load.
 * The pathname fallback supports non-DOM offline tests, not a second site host. */
(function () {
  const projectBase = '/UMBER-interiordesign';
  const path = location.pathname;
  const base = document.baseURI
    ? new URL(document.baseURI).pathname.replace(/\/$/, '')
    : (path === projectBase || path.startsWith(projectBase + '/') ? projectBase : '');
  window.UMBER_BASE = base;
  const origin = /^https:\/\/(?:www\.)?umberinteriordesign\.com$/.test(location.origin)
    ? 'https://umberinteriordesign.com' : location.origin;
  window.UMBER_SITE_URL = origin + base;
})();
function umberRoutePath(path) {
  const base = window.UMBER_BASE || '';
  const route = path === base ? '/' : base && path.startsWith(base + '/') ? path.slice(base.length) : path;
  return route.replace(/\/index\.html$/, '/') || '/';
}
