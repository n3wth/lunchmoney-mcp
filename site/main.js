// Animate the illustrative conversation once; no data is fetched.
(function () {
  var panel = document.getElementById('spending');
  if (!panel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  requestAnimationFrame(function () { panel.classList.add('is-playing'); });
})();
