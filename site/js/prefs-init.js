/* Applies saved display settings before the first paint, so the page never
   flashes in the wrong theme or size. Loaded without defer in <head>.
   site.js owns the same option list and does everything else. */
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  var OPTIONS = {
    theme: ["system", "light", "dark", "contrast"],
    text: ["100", "125", "150", "175", "200"],
    spacing: ["normal", "wide"],
    measure: ["standard", "narrow"],
    motion: ["system", "reduce"],
    targets: ["normal", "large"],
    aloud: ["off", "on"]
  };

  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem("display-prefs") || "{}") || {}; } catch (e) { prefs = {}; }
  if (typeof prefs !== "object") prefs = {};

  var theme = OPTIONS.theme.indexOf(prefs.theme) > -1 ? prefs.theme : "system";
  var dark = theme === "dark" || theme === "contrast" ||
    (theme === "system" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  root.setAttribute("data-theme", dark ? "dark" : "light");
  if (theme === "contrast") root.setAttribute("data-contrast", "high");

  ["text", "spacing", "measure", "motion", "targets", "aloud"].forEach(function (key) {
    if (OPTIONS[key].indexOf(prefs[key]) > 0) root.setAttribute("data-" + key, prefs[key]);
  });
})();
