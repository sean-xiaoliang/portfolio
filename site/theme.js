// Light/dark theme: follows the system by default, remembers a manual choice.
// Loaded in <head> so the saved theme applies before the page paints (no flash).
(function () {
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) { /* storage blocked: fall back to the system theme */ }

  function current() {
    return root.getAttribute('data-theme') || (media.matches ? 'dark' : 'light');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.getElementById('theme-toggle');
    if (!button) return;

    function sync() {
      var mode = current();
      button.setAttribute('data-mode', mode);
      button.setAttribute('aria-label', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      button.title = button.getAttribute('aria-label');
    }

    button.hidden = false;
    sync();

    button.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* not saved, still switches */ }
      sync();
    });

    media.addEventListener('change', sync);
  });
})();
