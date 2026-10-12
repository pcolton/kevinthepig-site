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

// Autoplay is opt-in here, never in markup: Reduce Motion is checked first.
(function () {
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var players = [];
  document.querySelectorAll("video[data-auto-video]").forEach(function (video) {
    var wrap = document.createElement("span");
    wrap.className = "vid";
    video.parentNode.insertBefore(wrap, video);
    wrap.appendChild(video);
    var poster = document.createElement("img");
    poster.className = "vid-poster";
    poster.src = video.poster;
    poster.alt = ""; // The video's accessible label describes the same content.
    poster.setAttribute("aria-hidden", "true");
    wrap.appendChild(poster);
    var button = document.createElement("button");
    button.type = "button";
    button.className = "vid-play";
    button.setAttribute("aria-label", "Play video: " + video.getAttribute("aria-label"));
    wrap.appendChild(button);
    var generation = 0;
    var manual = false;

    function showPaused() {
      button.hidden = false;
      video.controls = true;
    }
    function start(userInitiated) {
      var request = ++generation;
      manual = userInitiated;
      video.controls = userInitiated;
      poster.hidden = true;
      var attempt;
      try { attempt = video.play(); } catch (error) { failed(); return; }
      Promise.resolve(attempt).then(function () {
        // A preference change invalidates earlier play promises.
        if (request !== generation) return;
        button.hidden = true;
        if (userInitiated && document.activeElement === button) video.focus();
      }, failed);
      function failed() {
        if (request !== generation || !video.paused) return;
        manual = true;
        poster.hidden = true; // The video's own poster remains visible before playback.
        showPaused();
      }
    }
    function applyPreference() {
      ++generation;
      manual = false;
      video.pause();
      video.loop = !motion.matches;
      if (motion.matches) {
        poster.hidden = false; // Also restore the poster after an already-playing video.
        showPaused();
        video.controls = false; // The poster button is the initial playback control.
      } else {
        start(false);
      }
    }
    button.addEventListener("click", function () { start(true); });
    video.addEventListener("play", function () {
      if (motion.matches && !manual) {
        video.pause();
        return;
      }
      poster.hidden = true;
      button.hidden = true;
    });
    video.addEventListener("pause", showPaused);
    video.addEventListener("ended", showPaused);
    players.push(applyPreference);
    applyPreference();
  });
  function changed() { players.forEach(function (apply) { apply(); }); }
  if (motion.addEventListener) motion.addEventListener("change", changed);
  else motion.addListener(changed); // Older Safari.
})();
