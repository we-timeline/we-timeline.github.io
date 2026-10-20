// ===== SETTINGS (teacher edits these) =====
const CONFIG = {
  // Paste your Google Apps Script web app URL between the quotes to collect check results in a sheet.
  // Leave it empty and students will see their result on screen instead.
  SHEET_URL: "",
  // How many clean runs (all right on the first check) open the next level.
  CLEAN_RUNS_TO_UNLOCK: 2,
  // Choices for the "Hour" menu on check screens.
  HOURS: ["1st Hour", "2nd Hour", "3rd Hour", "4th Hour", "5th Hour", "6th Hour", "7th Hour"]
};

// ===== THE LADDER =====
const LEVELS = [
  { n: 1, title: "Pair", task: "Match each era's name to its description.", built: true },
  { n: 2, title: "Place", task: "Put the eras in order on the timeline, years given.", built: true },
  { n: 3, title: "Boundaries", task: "Put each era's start and end years back.", built: false },
  { n: 4, title: "Events", task: "Sort anchor events into their eras, dates shown.", built: false },
  { n: 5, title: "Events, no dates", task: "Sort anchor events using only what happened.", built: false },
  { n: 6, title: "Rebuild", task: "Rebuild the whole timeline from blank.", built: false }
];
const FIRST = ERAS[0].start, LAST = ERAS[ERAS.length - 1].end, SPAN = LAST - FIRST;
const eraOf = n => ERAS[n - 1];

// ===== SAVED PROGRESS (this computer only) =====
const STORE_KEY = "we-timeline-progress-v1";
function loadProgress() {
  try { const p = JSON.parse(localStorage.getItem(STORE_KEY)); if (p && p.clean) return p; } catch (e) {}
  return { clean: {}, unlockAll: false };
}
function saveProgress() { try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) {} }
let progress = loadProgress();
const cleanRuns = n => progress.clean[n] || 0;
const isOpen = n => n === 1 || progress.unlockAll || cleanRuns(n - 1) >= CONFIG.CLEAN_RUNS_TO_UNLOCK;

// ===== HELPERS =====
const app = document.getElementById("app");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const years = e => `${e.start}–${e.end}`;
const pips = (have, need) => `<span class="pips" aria-hidden="true">${Array.from({ length: need }, (_, i) => `<i class="${i < have ? "on" : ""}"></i>`).join("")}</span>`;

function stripHTML() {
  const segs = ERAS.map(e => `<div class="strip-seg" style="flex:${e.end - e.start} 1 0;background:var(--e${e.n})" title="Era ${e.n}: ${years(e)}">${e.n}</div>`).join("");
  const marks = [FIRST, ...ERAS.map(e => e.end)];
  const ys = marks.map(y => `<span style="left:${((y - FIRST) / SPAN) * 100}%">${y}</span>`).join("");
  return `<div class="strip-scroll"><div class="strip" role="img" aria-label="The nine eras drawn to scale, ${FIRST} to ${LAST}"><div class="strip-bar">${segs}</div><div class="strip-years">${ys}</div></div></div>`;
}

// ===== ROUTER =====
// #practice-1, #check-2, #teacher ... anything else shows the home page.
function route() {
  const h = location.hash.replace("#", "");
  let m;
  if ((m = h.match(/^practice-(\d)$/)) && built(+m[1]) && isOpen(+m[1])) return startGame(+m[1], "practice");
  if ((m = h.match(/^check-(\d)$/)) && built(+m[1])) return checkIntro(+m[1]);
  if (h === "teacher") return renderTeacher();
  renderHome();
}
const built = n => LEVELS.some(l => l.n === n && l.built);
window.addEventListener("hashchange", route);
function go(hash) { if (location.hash === "#" + hash) route(); else location.hash = hash; window.scrollTo(0, 0); }

// ===== HOME =====
function renderHome() {
  G = null;
  const rungs = LEVELS.map(l => {
    const open = l.built && isOpen(l.n);
    let status, action = "";
    if (!l.built) status = "Coming later in the year.";
    else if (!open) status = `Opens after ${CONFIG.CLEAN_RUNS_TO_UNLOCK} clean runs of Level ${l.n - 1}. Now: ${cleanRuns(l.n - 1)} ${pips(cleanRuns(l.n - 1), CONFIG.CLEAN_RUNS_TO_UNLOCK)}`;
    else status = `Clean runs: ${cleanRuns(l.n)} ${pips(Math.min(cleanRuns(l.n), CONFIG.CLEAN_RUNS_TO_UNLOCK), CONFIG.CLEAN_RUNS_TO_UNLOCK)}`;
    if (open) action = `<div><a class="btn" href="#practice-${l.n}">Practice</a></div>`;
    return `<article class="rung ${open ? "" : "locked"}"><div class="num">${l.n}</div><h3>${l.title}</h3><p class="task">${l.task}</p><p class="status">${status}</p>${action}</article>`;
  }).join("");
  app.innerHTML = `
    <header class="mast"><h1>WE</h1><p>A timeline of American history and where you are in it</p></header>
    ${stripHTML()}
    <p class="strip-note">All 540 years, drawn to scale. Each colored block is one era, numbered in order. By the end of the year you'll be able to rebuild this whole strip: names, descriptions, years, and anchor events.</p>
    <div class="ladder-head"><h2>The ladder</h2><p>A <b>clean run</b> means every answer is right on your first check, with no hints. ${CONFIG.CLEAN_RUNS_TO_UNLOCK} clean runs open the next level.</p></div>
    <section class="ladder">${rungs}</section>
    <footer class="foot"><span>Progress is saved on this computer.</span><a href="#teacher">Teacher tools</a></footer>`;
}

// ===== GAME STATE =====
// tokens: things students move. zones: places they go. place[tokenId] = zoneId or null (the pile).
let G = null;
function startGame(level, mode, who) {
  const tokens = shuffle(ERAS).map(e => ({ id: (level === 1 ? "n" : "c") + e.n, era: e, answer: (level === 1 ? "d" : "s") + e.n }));
  const zones = level === 1 ? shuffle(ERAS).map(e => "d" + e.n) : ERAS.map(e => "s" + e.n);
  G = { level, mode, tokens, zones, place: {}, locked: {}, missed: {}, selected: null, checks: 0, done: false,
        who: who || null, startedAt: Date.now(), result: null, msg: "",
        hints: {}, openHint: null, hinted: false };
  tokens.forEach(t => (G.place[t.id] = null));
  renderGame();
}
const tok = id => G.tokens.find(t => t.id === id);
const inZone = z => G.tokens.find(t => G.place[t.id] === z);
const placedCount = () => G.tokens.filter(t => G.place[t.id]).length;

function move(id, zone) {
  if (G.done || G.locked[id]) return;
  if (zone) {
    const occ = inZone(zone);
    if (occ && G.locked[occ.id]) return;
    if (occ && occ.id !== id) G.place[occ.id] = G.place[id]; // swap, or back to the pile
  }
  G.place[id] = zone;
  delete G.missed[id];
  G.selected = null;
  G.msg = "";
  renderGame();
}

// ===== GAME SCREEN =====
function tokenHTML(t) {
  const cls = [G.selected === t.id && "selected", G.locked[t.id] && "locked", G.missed[t.id] && "missed"].filter(Boolean).join(" ");
  const attrs = `data-token="${t.id}" ${G.locked[t.id] || G.done ? 'aria-disabled="true"' : ""}`;
  if (G.level === 1) return `<button type="button" class="chip ${cls}" ${attrs}>${esc(t.era.name)}</button>`;
  return `<button type="button" class="card ${cls}" ${attrs}><span class="card-name">${esc(t.era.name)}</span><span class="card-desc">${esc(t.era.desc)}</span></button>`;
}
// ===== HINTS =====
// Opening any hint makes the round a practice run (not a clean run).
const hintFor = n => (G.level === 1 ? HINTS[n].pair : HINTS[n].place);
const hintStep = n => G.hints[n] || 0;
function listWords(ws) {
  const q = ws.map(w => `“${esc(w)}”`);
  return q.length < 3 ? q.join(" and ") : q.slice(0, -1).join(", ") + ", and " + q[q.length - 1];
}
function pileItemHTML(t) {
  if (G.mode !== "practice" || G.done) return tokenHTML(t);
  const n = t.era.n, open = G.openHint === n, step = hintStep(n), h = hintFor(n);
  let box = "";
  if (open) {
    const lines = [`<p><b>Think about it:</b> ${esc(h.ask)}</p>`];
    if (step >= 2) lines.push(G.level === 1
      ? `<p><b>Word clue:</b> Look for ${listWords(h.words)}.</p>`
      : `<p><b>Event clue:</b> ${esc(h.event)} (${esc(h.date)}) happened in this era.</p>`);
    if (step >= 3) lines.push(`<p><b>Shown:</b> ${G.level === 1 ? "The matching words are highlighted." : "The right spot is outlined."}</p>`);
    let next = "";
    if (step === 1) next = `<button class="hint-next" data-hint-next="${n}">${G.level === 1 ? "Word clue" : "Event clue"}</button>`;
    else if (step === 2) next = `<button class="hint-next" data-hint-next="${n}">Show me where</button>`;
    box = `<div class="hint-box" data-hint-box>${lines.join("")}${next ? `<div class="hint-actions">${next}</div>` : ""}</div>`;
  }
  return `<div class="pile-item">${tokenHTML(t)}<button type="button" class="hint-btn ${open ? "open" : ""}" data-hint="${n}" aria-expanded="${open}" aria-label="Hint for ${esc(t.era.name)}">Hint</button>${box}</div>`;
}
function highlight(text, words) {
  let out = esc(text);
  words.forEach(w => { out = out.split(esc(w)).join(`<mark>${esc(w)}</mark>`); });
  return out;
}

function slotHTML(z, hint) {
  const t = inZone(z);
  const hinted = G.level === 2 && !t && hintStep(+z.slice(1)) >= 3;
  return `<div class="slot ${t ? "filled" : ""} ${hinted ? "hinted" : ""}" data-zone="${z}" role="button" tabindex="${G.done ? -1 : 0}" aria-label="${hint}">${t ? tokenHTML(t) : `<span class="slot-hint">${hint}</span>`}</div>`;
}
function markHTML(z) {
  if (!G.result) return "";
  const r = G.result.byZone[z];
  if (r.ok) return `<div class="mark right">Correct</div>`;
  const right = eraOf(+z.slice(1));
  return `<div class="mark wrong">Not this one. Answer: ${esc(right.name)}</div>`;
}

function renderGame() {
  const L = LEVELS[G.level - 1], total = G.tokens.length, n = placedCount();
  const isCheck = G.mode === "check";
  const pile = G.tokens.filter(t => !G.place[t.id]);
  const pileHTML = `<aside class="pile" data-bank>
      <h3>${G.level === 1 ? "Era names" : "Eras"} <span>${pile.length} left</span></h3>
      <div class="pile-list">${pile.map(pileItemHTML).join("") || `<p class="pile-empty">${G.done ? "All placed." : "All placed. Drag one back here to take it out."}</p>`}</div>
    </aside>`;

  let rows;
  if (G.level === 1) {
    rows = G.zones.map(z => {
      const e = eraOf(+z.slice(1)), solved = !isCheck && inZone(z) && G.locked[inZone(z).id];
      const wrong = G.result && !G.result.byZone[z].ok;
      return `<div class="pair-row ${solved ? "solved" : ""} ${wrong ? "wrong" : ""}" style="--era:var(--e${e.n})">
        ${slotHTML(z, "Drop a name here")}
        <p class="desc">${!isCheck && !solved && hintStep(e.n) >= 3 ? highlight(e.desc, HINTS[e.n].pair.words) : esc(e.desc)}${solved ? `<span class="meta">Era ${e.n} · ${years(e)}</span>` : ""}</p>
        ${markHTML(z)}</div>`;
    }).join("");
  } else {
    rows = G.zones.map(z => {
      const e = eraOf(+z.slice(1)), solved = !isCheck && inZone(z) && G.locked[inZone(z).id];
      const wrong = G.result && !G.result.byZone[z].ok;
      return `<div class="era-row ${solved ? "solved" : ""} ${wrong ? "wrong" : ""}" style="--era:var(--e${e.n})">
        <div class="era-tag"><b>ERA ${e.n}</b><span>${years(e)}</span></div>
        ${slotHTML(z, `Drop the era for ${years(e)} here`)}
        ${markHTML(z)}</div>`;
    }).join("");
  }

  const howto = G.level === 1
    ? `Drag each <b>era name</b> onto the description it matches. You can also click a name, then click a description.`
    : `Drag each era onto its place on the timeline. The years are there to help. You can also click an era, then click a spot.`;

  let bar;
  if (G.done && isCheck) bar = "";
  else if (G.done) bar = finishBar();
  else {
    const ready = n === total;
    const msg = G.msg || (ready ? `All ${total} placed.` : `${n} of ${total} placed.${isCheck ? "" : ` Place all ${total} to check.`}`);
    const btn = isCheck
      ? `<button class="btn" id="submit-btn" ${ready ? "" : "disabled"}>Submit</button>`
      : `<button class="btn" id="check-btn" ${ready ? "" : "disabled"}>Check my answers</button>`;
    bar = `<div class="actionbar"><p class="msg" aria-live="polite">${msg}</p>${btn}</div>`;
  }

  app.innerHTML = `
    <nav class="topbar">
      <div class="where"><h2>Level ${L.n} · ${L.title}</h2><span class="mode ${isCheck ? "check" : ""}">${isCheck ? "Check" : "Practice"}</span></div>
      ${isCheck && !G.done ? `<span class="small">${esc(G.who.name)} · ${esc(G.who.hour)}</span>` : `<a class="back" href="#">← All levels</a>`}
    </nav>
    ${G.done && isCheck ? resultPanel() : `<p class="howto">${howto}</p>`}
    ${!isCheck && !G.done ? tipsHTML() : ""}
    ${G.level === 2 ? stripHTML() : ""}
    <div class="board l${G.level} ${G.selected ? "armed" : ""}">
      ${pileHTML}
      <section class="rows">${rows}</section>
    </div>
    ${bar}`;

  const cb = document.getElementById("check-btn"); if (cb) cb.onclick = practiceCheck;
  const sb = document.getElementById("submit-btn"); if (sb) sb.onclick = submitCheck;
  document.querySelectorAll("[data-go]").forEach(b => (b.onclick = () => b.dataset.go === "again" ? startGame(G.level, "practice") : go("")));
  if (G.selected) { const s = document.querySelector(`[data-token="${G.selected}"]`); if (s) s.focus({ preventScroll: true }); }
}

function tipsHTML() {
  const start = G.level === 1
    ? "Start with the one you're surest of. Each match you make leaves fewer choices for the rest."
    : "Start with the ones you're surest of, like the first and last eras. If you know when something happened, find the spot whose years include it.";
  const hint = G.hinted
    ? `<b>Hint used.</b> This round is a practice run. Finish it for practice, then try a round without hints to earn a clean run.`
    : `<b>Hints:</b> Each ${G.level === 1 ? "name" : "era"} has a Hint button if you're stuck. Using any hint makes this round a practice run, so it won't count as a clean run.`;
  return `<div class="tips"><p><b>Stuck?</b> ${start}</p><p class="${G.hinted ? "used" : ""}">${hint}</p></div>`;
}

// ===== PRACTICE: check, lock what's right, send the rest back =====
function practiceCheck() {
  G.checks++;
  let wrong = 0;
  G.tokens.forEach(t => {
    const z = G.place[t.id];
    if (!z || G.locked[t.id]) return;
    if (z === t.answer) G.locked[t.id] = true;
    else { wrong++; G.place[t.id] = null; G.missed[t.id] = true; }
  });
  const total = G.tokens.length, right = G.tokens.filter(t => G.locked[t.id]).length;
  if (right === total) {
    G.done = true;
    G.clean = G.checks === 1 && !G.hinted;
    if (G.clean) { progress.clean[G.level] = cleanRuns(G.level) + 1; saveProgress(); }
  } else {
    G.msg = `<b>${right} of ${total} right.</b> ${wrong === 1 ? "The other one went" : `The other ${wrong} went`} back to the pile.`;
  }
  G.selected = null;
  renderGame();
}
function finishBar() {
  const need = CONFIG.CLEAN_RUNS_TO_UNLOCK, have = cleanRuns(G.level), next = LEVELS[G.level];
  let line1;
  if (G.clean) line1 = `<b>Clean run.</b> All ${G.tokens.length} right on the first check.`;
  else if (G.hinted) line1 = `<b>All ${G.tokens.length} in place.</b> You used hints, so this was a practice run. Try a round without hints for a clean run.`;
  else line1 = `<b>All ${G.tokens.length} in place</b> after ${G.checks} checks. A clean run needs them all right on the first check.`;
  let line2 = `Clean runs on this level: ${have} ${pips(Math.min(have, need), need)}`;
  if (next && next.built && have >= need) line2 += ` Level ${next.n} is open.`;
  return `<div class="actionbar"><p class="msg" aria-live="polite">${line1}<br>${line2}</p>
    <div class="btn-row"><button class="btn" data-go="again">Play again</button><button class="btn ghost" data-go="home">All levels</button></div></div>`;
}

// ===== CHECK MODE: one try, no feedback until submit =====
function checkIntro(level) {
  G = null;
  const L = LEVELS[level - 1];
  app.innerHTML = `
    <nav class="topbar"><div class="where"><h2>Level ${L.n} · ${L.title}</h2><span class="mode check">Check</span></div></nav>
    <section class="panel">
      <h2>Before you start</h2>
      <p>${esc(L.task)} This is the same task you practiced, with two differences: you get <b>one try</b>, and you won't see which answers are right until you submit.</p>
      <form class="form" id="who-form" novalidate>
        <label for="student-name">Your first and last name<input id="student-name" autocomplete="name" required></label>
        <label for="student-hour">Hour<select id="student-hour" required><option value="">Choose your hour</option>${CONFIG.HOURS.map(h => `<option>${esc(h)}</option>`).join("")}</select></label>
        <p class="err" id="who-err" aria-live="polite"></p>
        <div><button class="btn" type="submit">Start the check</button></div>
      </form>
    </section>`;
  document.getElementById("who-form").addEventListener("submit", ev => {
    ev.preventDefault();
    const name = document.getElementById("student-name").value.trim(), hour = document.getElementById("student-hour").value;
    if (!name || !hour) { document.getElementById("who-err").textContent = !name ? "Type your name to start." : "Choose your hour to start."; return; }
    startGame(level, "check", { name, hour });
  });
}
function submitCheck() {
  const byZone = {};
  let score = 0;
  G.zones.forEach(z => {
    const t = inZone(z), ok = !!t && t.answer === z;
    if (ok) score++;
    byZone[z] = { ok, got: t ? t.era.n : null };
  });
  const seconds = Math.round((Date.now() - G.startedAt) / 1000);
  G.result = { byZone, score, total: G.zones.length, seconds, send: CONFIG.SHEET_URL ? "sending" : "none" };
  G.done = true; G.selected = null;
  renderGame(); window.scrollTo(0, 0);
  const detail = G.zones.slice().sort().map(z => `Era ${z.slice(1)}: ${byZone[z].ok ? "right" : "placed Era " + byZone[z].got}`).join("; ");
  sendResult({
    student: G.who.name, hour: G.who.hour, level: G.level, levelName: LEVELS[G.level - 1].title,
    score, total: G.zones.length, percent: Math.round((score / G.zones.length) * 100), seconds, detail,
    submittedAt: new Date().toISOString()
  }).then(s => { if (G && G.result) { G.result.send = s; renderGame(); } });
}
async function sendResult(payload) {
  if (!CONFIG.SHEET_URL) return "none";
  try {
    await fetch(CONFIG.SHEET_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    return "sent";
  } catch (e) { return "failed"; }
}
function resultPanel() {
  const r = G.result, m = Math.floor(r.seconds / 60), s = r.seconds % 60;
  const note = {
    none: `<p class="sendnote">Show this screen to your teacher.</p>`,
    sending: `<p class="sendnote">Sending your result…</p>`,
    sent: `<p class="sendnote ok">Your result was submitted to your teacher.</p>`,
    failed: `<p class="sendnote bad">Your result couldn't be sent. Show this screen to your teacher.</p>`
  }[r.send];
  return `<section class="panel">
    <div class="result-grid"><div class="score">${r.score} / ${r.total}</div>
      <dl><dt>Name</dt><dd>${esc(G.who.name)}</dd><dt>Hour</dt><dd>${esc(G.who.hour)}</dd><dt>Level</dt><dd>${G.level} · ${LEVELS[G.level - 1].title}</dd><dt>Time</dt><dd>${m}:${String(s).padStart(2, "0")}</dd></dl></div>
    ${note}
    <p class="small" style="margin-top:12px">Each row below is marked. The ones you missed show the right answer.</p>
  </section>`;
}

// ===== TEACHER TOOLS =====
function renderTeacher() {
  G = null;
  const base = location.href.split("#")[0];
  const links = LEVELS.filter(l => l.built).map(l => `
    <div class="teacher-link"><b>Level ${l.n} check</b><code id="link-${l.n}">${esc(base)}#check-${l.n}</code>
    <button class="btn ghost" data-copy="${l.n}">Copy</button></div>`).join("");
  app.innerHTML = `
    <nav class="topbar"><div class="where"><h2>Teacher tools</h2></div><a class="back" href="#">← All levels</a></nav>
    <section class="panel"><h2>Check links</h2>
      <p>Give students one of these links when it's time for a check. It skips the ladder and opens the check directly, even if the level is still locked for them.</p>
      <div class="teacher-list">${links}</div>
      <p class="small" style="margin-top:10px">On your GitHub site, a check link is your site's address with #check-1 or #check-2 on the end.</p></section>
    <section class="panel"><h2>Results sheet</h2>
      <p>${CONFIG.SHEET_URL ? "Connected. Every submitted check adds a row to your Google Sheet." : "Not connected yet. Students will see their score on screen. The README explains how to connect a Google Sheet in about five minutes."}</p></section>
    <section class="panel"><h2>This computer</h2>
      <p>Progress lives in each computer's browser. These buttons only change this one.</p>
      <div class="btn-row" style="margin-top:12px"><button class="btn ghost" id="unlock-btn">${progress.unlockAll ? "Re-lock levels" : "Open every level"}</button><button class="btn ghost" id="reset-btn">Reset progress</button></div>
      <p class="small" id="teacher-msg" aria-live="polite" style="margin-top:10px"></p></section>`;
  document.querySelectorAll("[data-copy]").forEach(b => b.onclick = () => {
    const el = document.getElementById("link-" + b.dataset.copy), text = el.textContent;
    const done = () => (b.textContent = "Copied");
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected"; };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
  });
  document.getElementById("unlock-btn").onclick = () => { progress.unlockAll = !progress.unlockAll; saveProgress(); renderTeacher(); document.getElementById("teacher-msg").textContent = progress.unlockAll ? "Every built level is open on this computer." : "Levels lock again until clean runs open them."; };
  const reset = document.getElementById("reset-btn");
  reset.onclick = () => {
    if (reset.dataset.armed) { progress = { clean: {}, unlockAll: false }; saveProgress(); renderTeacher(); document.getElementById("teacher-msg").textContent = "Progress reset on this computer."; return; }
    reset.dataset.armed = "1"; reset.textContent = "Click again to reset";
  };
}

// ===== DRAG, DROP, AND CLICK =====
let drag = null, suppressClick = false, scrollRAF = null, lastY = 0;
document.addEventListener("pointerdown", e => {
  if (!G || G.done || e.button !== 0) return;
  const el = e.target.closest("[data-token]");
  if (!el || G.locked[el.dataset.token]) return;
  drag = { id: el.dataset.token, el, x: e.clientX, y: e.clientY, started: false, ghost: null, over: null };
});
document.addEventListener("pointermove", e => {
  if (!drag) return;
  if (!drag.started) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    drag.started = true;
    const r = drag.el.getBoundingClientRect();
    drag.dx = e.clientX - r.left; drag.dy = e.clientY - r.top;
    drag.ghost = drag.el.cloneNode(true);
    drag.ghost.classList.add("drag-ghost"); drag.ghost.classList.remove("selected", "missed");
    drag.ghost.style.width = r.width + "px";
    document.body.appendChild(drag.ghost);
    drag.el.classList.add("dragging");
    scrollLoop();
  }
  e.preventDefault();
  lastY = e.clientY;
  drag.ghost.style.left = e.clientX - drag.dx + "px";
  drag.ghost.style.top = e.clientY - drag.dy + "px";
  const target = dropTarget(e);
  if (target !== drag.over) { drag.over && drag.over.classList.remove("over"); target && target.classList.add("over"); drag.over = target; }
}, { passive: false });
document.addEventListener("pointerup", e => {
  if (!drag) return;
  const d = drag; drag = null;
  cancelAnimationFrame(scrollRAF);
  if (!d.started) return;
  suppressClick = true; setTimeout(() => (suppressClick = false), 0);
  d.ghost.remove();
  const target = dropTarget(e);
  if (target) move(d.id, target.dataset.zone || null);
  else renderGame();
});
document.addEventListener("pointercancel", () => { if (drag && drag.ghost) drag.ghost.remove(); drag = null; cancelAnimationFrame(scrollRAF); if (G) renderGame(); });
function dropTarget(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const t = el && el.closest("[data-zone],[data-bank]");
  if (!t) return null;
  if (t.dataset.zone) { const occ = inZone(t.dataset.zone); if (occ && G.locked[occ.id]) return null; }
  return t;
}
function scrollLoop() {
  const edge = 70;
  if (lastY && lastY < edge) window.scrollBy(0, -14);
  else if (lastY > innerHeight - edge) window.scrollBy(0, 14);
  scrollRAF = requestAnimationFrame(scrollLoop);
}

document.addEventListener("click", e => {
  if (!G || G.done || suppressClick) return;
  const hb = e.target.closest("[data-hint]");
  if (hb) {
    const n = +hb.dataset.hint;
    G.openHint = G.openHint === n ? null : n;
    if (G.openHint && !G.hints[n]) { G.hints[n] = 1; G.hinted = true; }
    return renderGame();
  }
  const hn = e.target.closest("[data-hint-next]");
  if (hn) {
    const n = +hn.dataset.hintNext;
    G.hints[n] = Math.min(3, hintStep(n) + 1);
    G.hinted = true;
    return renderGame();
  }
  if (e.target.closest("[data-hint-box]")) return;
  const t = e.target.closest("[data-token]");
  if (t && !G.locked[t.dataset.token]) {
    const id = t.dataset.token;
    // A selected token clicked onto another token's slot: drop it there.
    const zoneEl = t.closest("[data-zone]");
    if (G.selected && G.selected !== id && zoneEl) return move(G.selected, zoneEl.dataset.zone);
    if (G.selected && G.selected !== id && t.closest("[data-bank]") && G.place[G.selected]) return move(G.selected, null);
    G.selected = G.selected === id ? null : id;
    return renderGame();
  }
  const z = e.target.closest("[data-zone]");
  if (z && G.selected) return move(G.selected, z.dataset.zone);
  const b = e.target.closest("[data-bank]");
  if (b && G.selected && G.place[G.selected]) return move(G.selected, null);
});
document.addEventListener("keydown", e => {
  if (!G || G.done) return;
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-zone]")) { e.preventDefault(); if (G.selected) move(G.selected, e.target.dataset.zone); }
  if (e.key === "Escape" && G.selected) { G.selected = null; renderGame(); }
});

route();
