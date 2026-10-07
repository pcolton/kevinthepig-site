// The download bar: shown whenever the hero's App Store button (or stamp) is off screen,
// so getting Kevin is always one tap away.
(function () {
  var bar = document.querySelector("[data-dl-bar]");
  var heroCta = document.querySelector("[data-hero-cta]");
  if (!bar || !heroCta || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(function (entries) {
    bar.classList.toggle("show", !entries[0].isIntersecting);
  }).observe(heroCta);
})();
