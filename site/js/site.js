/* liangxiao.de: display settings, read aloud, first-visit welcome,
   glossary, mobile menu and copy buttons.
   Everything here is an enhancement: the page reads and works without it. */

const OPTIONS = {
  theme: ["system", "light", "dark", "contrast"],
  text: ["100", "125", "150", "175", "200"],
  spacing: ["normal", "wide"],
  measure: ["standard", "narrow"],
  motion: ["system", "reduce"],
  targets: ["normal", "large"],
  aloud: ["off", "on"],
  rate: ["1", "0.75", "1.25", "1.5"],
};
const STORE_KEY = "display-prefs";
const WELCOMED_KEY = "display-welcomed";
const root = document.documentElement;
const darkQuery = matchMedia("(prefers-color-scheme: dark)");
const speech = "speechSynthesis" in window ? window.speechSynthesis : null;
const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#i-${id}"/></svg>`;

/* ---------- Preferences ---------- */

const isValid = (key, value) => key in OPTIONS && OPTIONS[key].includes(value);

function loadPrefs() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; } catch { raw = {}; }
  const prefs = {};
  for (const key of Object.keys(OPTIONS)) if (isValid(key, raw[key])) prefs[key] = raw[key];
  return prefs;
}

function savePrefs(prefs) {
  try {
    if (Object.keys(prefs).length) localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
    else localStorage.removeItem(STORE_KEY);
  } catch { /* private mode: settings last for this page only */ }
}

function effectiveTheme(prefs) {
  const theme = prefs.theme || "system";
  if (theme === "dark" || theme === "contrast") return "dark";
  if (theme === "light") return "light";
  return darkQuery.matches ? "dark" : "light";
}

const onPrefsChange = new Set();

function applyPrefs(prefs) {
  root.dataset.theme = effectiveTheme(prefs);
  if (prefs.theme === "contrast") root.dataset.contrast = "high";
  else delete root.dataset.contrast;
  for (const key of ["text", "spacing", "measure", "motion", "targets", "aloud"]) {
    const value = prefs[key];
    if (value && value !== OPTIONS[key][0]) root.dataset[key] = value;
    else delete root.dataset[key];
  }
  onPrefsChange.forEach((fn) => fn(prefs));
}

function setPref(key, value) {
  if (!isValid(key, value)) return;
  const prefs = { ...loadPrefs(), [key]: value };
  if (value === OPTIONS[key][0]) delete prefs[key];
  savePrefs(prefs);
  applyPrefs(prefs);
}

function cleanPrefs(candidate) {
  const prefs = {};
  for (const key of Object.keys(OPTIONS)) {
    if (isValid(key, candidate[key]) && candidate[key] !== OPTIONS[key][0]) prefs[key] = candidate[key];
  }
  return prefs;
}

darkQuery.addEventListener("change", () => applyPrefs(loadPrefs()));

/* ---------- Theme button ---------- */

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  const label = () => {
    const text = effectiveTheme(loadPrefs()) === "dark" ? "Switch to light theme" : "Switch to dark theme";
    button.setAttribute("aria-label", text);
    button.title = text;
  };
  label();
  onPrefsChange.add(label);
  button.addEventListener("click", () => {
    setPref("theme", effectiveTheme(loadPrefs()) === "dark" ? "light" : "dark");
  });
});

/* ---------- Mobile menu ---------- */

const menuButton = document.querySelector("[data-menu-toggle]");
const menu = document.getElementById("site-menu");
if (menuButton && menu) {
  const setOpen = (open, returnFocus = false) => {
    menu.toggleAttribute("data-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (!open && returnFocus) menuButton.focus();
  };
  menuButton.addEventListener("click", () => setOpen(!menu.hasAttribute("data-open")));
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.hasAttribute("data-open")) setOpen(false, true);
  });
}

/* ---------- Display settings dialog ---------- */

const GROUPS = [
  { name: "theme", legend: "Colours", options: [["system", "Match my device"], ["light", "Light"], ["dark", "Dark"], ["contrast", "High contrast"]] },
  { name: "text", legend: "Text size", options: [["100", "100%"], ["125", "125%"], ["150", "150%"], ["175", "175%"], ["200", "200%"]] },
  { name: "spacing", legend: "Space between letters and lines", options: [["normal", "Normal"], ["wide", "Wide"]] },
  { name: "measure", legend: "Line length", options: [["standard", "Standard"], ["narrow", "Shorter lines"]] },
  { name: "motion", legend: "Movement and animation", options: [["system", "Match my device"], ["reduce", "Less movement"]] },
  { name: "targets", legend: "Buttons and links", options: [["normal", "Normal"], ["large", "Bigger"]] },
  { name: "aloud", legend: "Read-aloud player", options: [["off", "Show when I start it"], ["on", "Always show"]], needsSpeech: true },
];

function buildSettings() {
  const groups = GROUPS.filter((g) => !g.needsSpeech || speech).map((g) => `
      <fieldset class="seg-group">
        <legend>${g.legend}</legend>
        <div class="seg">${g.options.map(([value, text]) => `
          <label><input type="radio" name="${g.name}" value="${value}"><span>${text}</span></label>`).join("")}
        </div>
      </fieldset>`).join("");
  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="sheet" id="display-settings" aria-labelledby="settings-title">
      <div class="sheet-head">
        <h2 id="settings-title">${icon("accessibility")}Display settings</h2>
        <button type="button" class="theme-btn" data-close aria-label="Close display settings">${icon("x")}</button>
      </div>
      <div class="sheet-body">
        <p class="sheet-note">Changes apply straight away and are saved in this browser only.</p>
        <form class="settings-form">${groups}</form>
      </div>
      <div class="sheet-foot">
        <button type="button" class="btn ghost" data-reset>Reset to defaults</button>
        <button type="button" class="btn cta" data-close>Done</button>
      </div>
    </dialog>`);
  return document.getElementById("display-settings");
}

const settingsOpeners = document.querySelectorAll("[data-settings-open]");
if (settingsOpeners.length && typeof HTMLDialogElement === "function") {
  const dialog = buildSettings();
  let opener = null;
  const sync = () => {
    const prefs = loadPrefs();
    for (const key of Object.keys(OPTIONS)) {
      const value = prefs[key] ?? OPTIONS[key][0];
      const input = dialog.querySelector(`input[name="${key}"][value="${value}"]`);
      if (input) input.checked = true;
    }
  };
  settingsOpeners.forEach((button) => button.addEventListener("click", () => {
    opener = button;
    sync();
    dialog.showModal();
  }));
  dialog.addEventListener("change", (event) => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.checked) setPref(input.name, input.value);
  });
  dialog.querySelector("[data-reset]").addEventListener("click", () => {
    savePrefs({});
    applyPrefs({});
    sync();
  });
  dialog.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => dialog.close()));
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => opener?.focus());
}

/* ---------- Read aloud ---------- */

const listenOpeners = document.querySelectorAll("[data-listen-open]");
const BLOCKS = "h1, h2, h3, p, li, dt, dd, figcaption";
const SKIP = "nav, dialog, .chips, .flow, .player, .needs-js, [aria-hidden='true'], [hidden], [data-no-read]";

if (!speech) {
  listenOpeners.forEach((b) => b.remove());
  document.querySelectorAll("[data-needs-speech]").forEach((el) => el.remove());
} else {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="player" data-player hidden>
      <div class="wrap player-inner" role="region" aria-label="Read aloud">
        <button type="button" class="btn cta small" data-play>${icon("volume-2")}<span>Listen to this page</span></button>
        <button type="button" class="btn ghost small" data-stop hidden>Stop</button>
        <label class="rate">Speed
          <select data-rate>
            <option value="0.75">0.75×</option><option value="1">1×</option>
            <option value="1.25">1.25×</option><option value="1.5">1.5×</option>
          </select>
        </label>
        <p class="player-status" role="status" aria-live="polite" data-status></p>
      </div>
    </div>`);
  const player = document.querySelector("[data-player]");
  const playButton = player.querySelector("[data-play]");
  const playLabel = playButton.querySelector("span");
  const stopButton = player.querySelector("[data-stop]");
  const rateSelect = player.querySelector("[data-rate]");
  const status = player.querySelector("[data-status]");

  let state = "idle"; // idle | reading | paused
  let blocks = [];
  let position = 0;
  let generation = 0; // ignores callbacks from a cancelled queue

  const readable = () => {
    const scope = document.querySelector("main");
    if (!scope) return [];
    return [...scope.querySelectorAll(BLOCKS)].filter((el) =>
      !el.closest(SKIP) &&
      !el.querySelector(BLOCKS) &&
      (el.checkVisibility ? el.checkVisibility() : el.getClientRects().length > 0) &&
      el.textContent.trim());
  };
  const textOf = (el) => {
    const copy = el.cloneNode(true);
    copy.querySelectorAll(".visually-hidden, [aria-hidden='true']").forEach((n) => n.remove());
    return copy.textContent.replace(/\s+/g, " ").trim();
  };
  const highlight = (el) => {
    document.querySelectorAll("[data-reading]").forEach((n) => n.removeAttribute("data-reading"));
    if (!el) return;
    el.setAttribute("data-reading", "");
    const box = el.getBoundingClientRect();
    if (box.top < 80 || box.bottom > innerHeight - 100) el.scrollIntoView({ block: "center", inline: "nearest" });
  };
  const rate = () => Number(loadPrefs().rate ?? "1");

  const render = () => {
    const show = state !== "idle" || root.dataset.aloud === "on";
    player.hidden = !show;
    document.body.classList.toggle("has-player", show);
    playLabel.textContent = state === "reading" ? "Pause" : state === "paused" ? "Resume" : "Listen to this page";
    stopButton.hidden = state === "idle";
    listenOpeners.forEach((b) => b.setAttribute("aria-pressed", String(state !== "idle")));
  };

  const stop = (message) => {
    generation += 1;
    speech.cancel();
    state = "idle";
    position = 0;
    highlight(null);
    if (message) status.textContent = message;
    render();
  };

  const speakFrom = (start) => {
    generation += 1;
    speech.cancel();
    const mine = generation;
    const queue = blocks.slice(start).map((el, i) => ({ el, at: start + i, text: textOf(el) })).filter((q) => q.text);
    if (!queue.length) { stop("Finished."); return; }
    state = "reading";
    queue.forEach((item, i) => {
      const u = new SpeechSynthesisUtterance(item.text);
      u.lang = "en-NZ";
      u.rate = rate();
      u.onstart = () => { if (mine === generation) { position = item.at; highlight(item.el); } };
      if (i === queue.length - 1) u.onend = () => { if (mine === generation) stop("Finished."); };
      u.onerror = () => { if (mine === generation) stop(); };
      speech.speak(u);
    });
    render();
  };

  const start = () => {
    blocks = readable();
    status.textContent = "Reading started.";
    speakFrom(0);
  };
  const pause = () => {
    generation += 1;
    speech.cancel();
    state = "paused";
    status.textContent = "Paused.";
    render();
  };

  playButton.addEventListener("click", () => {
    if (state === "idle") start();
    else if (state === "reading") pause();
    else { status.textContent = "Reading resumed."; speakFrom(position); }
  });
  stopButton.addEventListener("click", () => stop("Stopped."));
  rateSelect.value = String(rate());
  rateSelect.addEventListener("change", () => {
    setPref("rate", rateSelect.value);
    if (state === "reading") speakFrom(position);
  });
  listenOpeners.forEach((button) => button.addEventListener("click", () => {
    if (state === "idle") start();
    else stop("Stopped.");
    playButton.focus();
  }));
  document.addEventListener("listen:start", () => { if (state === "idle") { start(); playButton.focus(); } });
  onPrefsChange.add(render);
  addEventListener("pagehide", () => speech.cancel());
  render();
}

/* ---------- First-visit welcome ---------- */

const CHOICES = [
  { id: "comfort", label: "Larger text and stronger contrast", prefs: { text: "150", theme: "contrast" } },
  { id: "easyread", label: "Simpler words (Easy Read)", prefs: {} },
  { id: "calm", label: "Less movement and animation", prefs: { motion: "reduce" } },
  { id: "targets", label: "Bigger buttons and links", prefs: { targets: "large" } },
  { id: "aloud", label: "Read the page aloud to me", prefs: { aloud: "on" }, needsSpeech: true, hint: "Uses your browser's voice. If you already use a screen reader, you won't need it." },
];

function welcomed() {
  try { return localStorage.getItem(WELCOMED_KEY) === "1"; } catch { return true; }
}

if (document.body.hasAttribute("data-welcome") && !welcomed() && typeof HTMLDialogElement === "function") {
  const choices = CHOICES.filter((c) => !c.needsSpeech || speech);
  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="sheet welcome" id="welcome" aria-labelledby="welcome-title">
      <form method="dialog">
        <div class="sheet-head"><h2 id="welcome-title">Welcome! This site can adapt to you.</h2></div>
        <div class="sheet-body">
          <p>Choose anything that would make it easier for you. You can pick more than one, and change your mind later in Display settings.</p>
          <p class="muted">Using a screen reader or only the keyboard? You don't need to change anything. The whole site works that way.</p>
          <ul class="choice-list">${choices.map((c) => `
            <li><label><input type="checkbox" name="${c.id}"><span>${c.label}${c.hint ? `<small>${c.hint}</small>` : ""}</span></label></li>`).join("")}
          </ul>
        </div>
        <div class="sheet-foot">
          <button class="btn ghost" value="skip">Continue without changes</button>
          <button class="btn cta" value="apply">Use my choices</button>
        </div>
        <p class="sheet-note">Saved only in this browser.</p>
      </form>
    </dialog>`);
  const dialog = document.getElementById("welcome");
  const form = dialog.querySelector("form");
  const before = loadPrefs();
  const chosen = () => Object.assign({}, before, ...choices.filter((c) => form.elements[c.id]?.checked).map((c) => c.prefs));

  form.addEventListener("change", () => applyPrefs(chosen())); // live preview
  dialog.addEventListener("close", () => {
    try { localStorage.setItem(WELCOMED_KEY, "1"); } catch { /* ignore */ }
    if (dialog.returnValue === "apply") {
      const prefs = cleanPrefs(chosen());
      savePrefs(prefs);
      applyPrefs(prefs);
      if (form.elements.easyread?.checked && !location.pathname.startsWith("/easy-read")) {
        location.assign("/easy-read/");
        return;
      }
      if (form.elements.aloud?.checked) document.dispatchEvent(new CustomEvent("listen:start"));
    } else {
      applyPrefs(before);
    }
  });
  dialog.showModal();
}

/* ---------- Words on this page ---------- */

const WORDS = [
  ["AI-900", "", "A Microsoft exam covering the basics of artificial intelligence on Azure."],
  ["Ansible", "", "A tool that runs the same set of steps on many computers at once, written down as a playbook."],
  ["AWS", "Amazon Web Services", "Amazon's cloud: computers, storage and networks you rent by the hour."],
  ["AZ-900", "", "A Microsoft exam covering the basics of the Azure cloud."],
  ["Azure", "", "Microsoft's cloud platform."],
  ["CAB", "change advisory board", "A regular meeting that reviews planned changes to live systems before they go ahead."],
  ["CI/CD", "continuous integration and continuous delivery", "Checking every change automatically and shipping it as soon as it passes."],
  ["Cloudflare", "", "A network that sits in front of this site to make it fast and block abusive traffic."],
  ["CRB", "change review board", "A meeting that reviews how changes went after they were made."],
  ["DevOps", "", "Building and running software as one job, with as much of the work automated as possible."],
  ["DNS", "Domain Name System", "The internet's phone book. It turns a name like liangxiao.de into the address of a computer."],
  ["Docker", "", "A way to package an application with everything it needs, so it runs the same everywhere."],
  ["Entra ID", "", "Microsoft's sign-in and identity service, formerly called Azure AD."],
  ["Exchange Online", "", "Microsoft's hosted email service, part of Microsoft 365."],
  ["GitHub Actions", "", "GitHub's service that runs checks and deployments automatically when code changes."],
  ["Grafana", "", "A tool for drawing dashboards and graphs from monitoring data."],
  ["HPSM", "HP Service Manager", "Software for logging and tracking IT support tickets."],
  ["Intune", "", "Microsoft's service for managing company laptops and phones."],
  ["ITIL", "", "A widely used set of good practices for running IT services."],
  ["Microsoft 365", "", "Microsoft's online Office apps, email and file storage."],
  ["MTTR", "mean time to recovery", "How long, on average, it takes to get a service working again after it breaks."],
  ["Prometheus", "", "Monitoring software that collects measurements from systems and raises alerts."],
  ["RAG", "retrieval-augmented generation", "An AI assistant that looks up your own documents before it answers."],
  ["RBAC", "role-based access control", "Giving people permissions according to their job role."],
  ["RCA", "root-cause analysis", "Working out why something really broke, so it doesn't happen again."],
  ["ServiceNow", "", "A widely used system for logging and managing IT tickets and changes."],
  ["SLA", "service level agreement", "An agreed promise about how quickly problems will be handled."],
  ["Terraform", "", "A tool that describes servers, networks and DNS as code, so they can be rebuilt the same way every time."],
  ["UEM", "unified endpoint management", "Managing all of a company's laptops, phones and tablets from one place."],
  ["VDI", "virtual desktop infrastructure", "Desktops that run on central servers, so people can work from any device."],
  ["Workspace ONE", "", "VMware's product for managing devices and apps, formerly called AirWatch."],
  ["Zabbix", "", "Open-source software that monitors servers and networks and alerts people when something goes wrong."],
];

const wordsSection = document.querySelector("[data-words]");
if (wordsSection) {
  const list = wordsSection.querySelector("[data-words-list]");
  const main = document.querySelector("main");
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  const parts = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.parentElement.closest("[data-words], [aria-hidden='true'], .visually-hidden")) parts.push(node.textContent);
  }
  const text = parts.join(" ");
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const found = WORDS.filter(([term]) => {
    const caseSensitive = !/[a-z]/.test(term);
    return new RegExp(`(^|[^A-Za-z0-9-])${escape(term)}s?(?![A-Za-z0-9-])`, caseSensitive ? "" : "i").test(text);
  }).sort((a, b) => a[0].localeCompare(b[0], "en-NZ"));
  for (const [term, expansion, meaning] of found) {
    const dt = document.createElement("dt");
    dt.textContent = term;
    if (expansion) {
      const span = document.createElement("span");
      span.className = "expansion";
      span.textContent = ` (${expansion})`;
      dt.append(span);
    }
    const dd = document.createElement("dd");
    dd.textContent = meaning;
    const row = document.createElement("div");
    row.append(dt, dd);
    list.append(row);
  }
  wordsSection.hidden = found.length === 0;
}

/* ---------- Copy buttons ---------- */

document.querySelectorAll("[data-copy]").forEach((button) => {
  const label = button.querySelector("[data-copy-label]");
  const original = label ? label.textContent : "";
  const status = button.parentElement.querySelector("[data-copy-status]");
  const say = (text) => { if (label) label.textContent = text; if (status) status.textContent = text; };
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      say("Copied");
    } catch {
      say("Copy failed");
    }
    setTimeout(() => { if (label) label.textContent = original; if (status) status.textContent = ""; }, 2500);
  });
});
