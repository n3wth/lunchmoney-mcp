// lunchmoney.sh — tab switching for the fictional conversation preview.
// All content is static sample data rendered locally; nothing is fetched.

(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  if (!tabs.length) return;

  function selectTab(active) {
    tabs.forEach(function (tab) {
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      var isActive = tab === active;
      tab.setAttribute('aria-pressed', String(isActive));
      if (panel) panel.hidden = !isActive;
      if (panel) panel.classList.remove('is-playing');
    });
    var panel = document.getElementById(active.getAttribute('aria-controls'));
    if (panel && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(function () { panel.classList.add('is-playing'); });
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      selectTab(tab);
    });
  });

  // Initial state: show only the pressed tab's panel.
  var pressed = tabs.filter(function (t) {
    return t.getAttribute('aria-pressed') === 'true';
  })[0];
  selectTab(pressed || tabs[0]);
})();
