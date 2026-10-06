// Shows the App Store badge (and sends kevinthepig.com/app to the App Store)
// only once Kevin is actually on the App Store: Apple's lookup service lists
// an app only after it's released. Until then the page says "Coming soon".
(function () {
  var APP_ID = "6817405741";
  var STORE_URL = "https://apps.apple.com/app/id" + APP_ID;
  window.__kevinStore = function (data) {
    var live = data && data.resultCount > 0;
    if (document.documentElement.dataset.redirect) {
      location.replace(live ? STORE_URL : "/");
      return;
    }
    if (!live) return;
    document.querySelectorAll("[data-store-badge]").forEach(function (el) { el.hidden = false; });
    document.querySelectorAll("[data-store-soon]").forEach(function (el) { el.hidden = true; });
  };
  var script = document.createElement("script");
  script.src = "https://itunes.apple.com/lookup?id=" + APP_ID + "&callback=__kevinStore&t=" + Date.now();
  script.onerror = function () { if (document.documentElement.dataset.redirect) location.replace("/"); };
  document.head.appendChild(script);
})();
