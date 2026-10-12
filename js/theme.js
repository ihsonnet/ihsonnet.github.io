// Light/dark theme. Loaded as a classic script in <head> so the theme
// is applied before first paint (no flash).
(function () {
  var KEY = 'theme';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function apply(theme) { root.setAttribute('data-theme', theme); }

  apply(stored() || (media.matches ? 'dark' : 'light'));

  // Follow the OS setting until the visitor picks a theme themselves.
  media.addEventListener('change', function (e) {
    if (!stored()) apply(e.matches ? 'dark' : 'light');
  });

  // Delegated: the toggle button is rendered later by ui.js.
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.theme-toggle')) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (err) { /* private mode */ }
  });
})();
