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

// Some browsers block autoplay (e.g. Safari set to "Never Auto-Play"), leaving the poster.
// When that happens, put a play button on the video so one tap starts Kevin.
(function () {
  document.querySelectorAll("video[autoplay]").forEach(function (video) {
    var attempt = video.play();
    if (!attempt || !attempt.catch) return;
    attempt.catch(function () {
      if (!video.paused) return;
      var wrap = document.createElement("span");
      wrap.className = "vid";
      video.parentNode.insertBefore(wrap, video);
      wrap.appendChild(video);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "vid-play";
      button.setAttribute("aria-label", "Play video");
      wrap.appendChild(button);
      function start() {
        video.play().then(function () { button.remove(); }, function () {});
      }
      button.addEventListener("click", start);
      video.addEventListener("click", start);
    });
  });
})();
