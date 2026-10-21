// ===== SETTINGS (teacher edits these) =====
const CONFIG = {
  // Paste your Google Apps Script web app URL between the quotes to collect check results in a sheet.
  // Leave it empty and students will see their result on screen instead.
  SHEET_URL: "https://script.google.com/macros/s/AKfycbyTZ-egJnzXmiSJ_GyI5M0NvbeUK8S8fRj0LdV8au4HEcC4ocph4v41P88RRKlR8kBUBQ/exec",
  // How many clean runs (all right on the first check) open the next level.
  CLEAN_RUNS_TO_UNLOCK: 2,
  // Students can reach levels up to this number. Higher levels show "Coming soon" even if earned.
  // Raise it when you're ready to start the next level. Check links work regardless.
  OPEN_UP_TO: 2,
  // Opens every level for everyone. Only for trying out levels; keep false for students.
  PREVIEW_OPEN_ALL: false,
  // Level 3: how many decoy years join the 10 real boundary years each round.
  DECOYS_PER_ROUND: 6,
  // Teachers and their hours. Students pick a teacher first, then one of that teacher's hours.
  // Each code must match a code in TEACHERS in apps-script/Code.gs. Update this list each school year.
  TEACHERS: [
    { code: "STR", hours: ["1st Hour"] },
    { code: "LAF", hours: ["1st Hour", "7th Hour"] },
    { code: "LYS", hours: ["1st Hour", "2nd Hour", "3rd Hour"] }
  ]
};

// ===== THE LADDER =====
const LEVELS = [
  { n: 1, title: "Pair", task: "Match each era's name to its description.", built: true },
  { n: 2, title: "Place", task: "Put the eras in order on the timeline, years given.", built: true },
  { n: 3, title: "Boundaries", task: "Put the years back on the lines between eras. Watch for decoys.", built: true },
  { n: 4, title: "Events", task: "Sort anchor events into their eras, dates shown.", built: false },
  { n: 5, title: "Events, no dates", task: "Sort anchor events using only what happened.", built: false },
  { n: 6, title: "Rebuild", task: "Rebuild the whole timeline from blank.", built: false }
];
const FIRST = ERAS[0].start, LAST = ERAS[ERAS.length - 1].end, SPAN = LAST - FIRST;
const eraOf = n => ERAS[n - 1];
// The 10 lines between eras: line 0 is where Era 1 starts, line k is where Era k ends.
const BOUNDARIES = [ERAS[0].start, ...ERAS.map(e => e.end)];
// Level 3 decoys: the starting year of every anchor event that falls inside an era (not on a line).
// Built from data.js, so new anchor events become decoys automatically. One entry per year;
// a year with several events (2020) keeps all of them and one is picked at random for the note.
const DECOY_POOL = (() => {
  const byYear = {};
  ERAS.forEach(e => e.events.forEach(ev => {
    if (/\d{4}s/.test(ev.date)) return; // decades like "1920s" aren't a single year
    const m = ev.date.match(/\d{4}/); if (!m) return;
    const y = +m[0];
    if (y <= FIRST || y >= LAST || BOUNDARIES.includes(y)) return;
    (byYear[y] = byYear[y] || []).push({ ev, era: e });
  }));
  return Object.keys(byYear).map(y => ({ year: +y, items: byYear[y] }));
})();
function decoyNote(t) {
  const { ev, era } = t.decoy;
  const range = ev.date === String(t.year) ? "" : ` (${esc(ev.date)})`;
  return `<b>${t.year}</b> ${esc(ev.event)}${range} happened during Era ${era.n}, not on a line between eras.`;
}

// ===== SAVED PROGRESS (this computer only) =====
const STORE_KEY = "we-timeline-progress-v1";
function loadProgress() {
  try { const p = JSON.parse(localStorage.getItem(STORE_KEY)); if (p && p.clean) return Object.assign({ misses: {}, refresh: {} }, p); } catch (e) {}
  return { clean: {}, unlockAll: false, misses: {}, refresh: {} };
}
function saveProgress() { try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) {} }
let progress = loadProgress();
const cleanRuns = n => progress.clean[n] || 0;
const capped = n => !CONFIG.PREVIEW_OPEN_ALL && n > CONFIG.OPEN_UP_TO;
const earned = n => n === 1 || progress.unlockAll || CONFIG.PREVIEW_OPEN_ALL || cleanRuns(n - 1) >= CONFIG.CLEAN_RUNS_TO_UNLOCK;
// A level closed by two missed warm-ups stays closed until one new clean run of the level named.
const refreshFor = n => { const r = progress.refresh[n]; return r && cleanRuns(r.level) <= r.base ? r : null; };
const isOpen = n => !capped(n) && earned(n) && !refreshFor(n);

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
  if ((m = h.match(/^practice-(\d)$/)) && built(+m[1]) && isOpen(+m[1])) {
    const n = +m[1];
    return n > 1 && !warmedUp[n] ? startWarmup(n) : startGame(n, "practice");
  }
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
    const r = l.built && refreshFor(l.n);
    if (!l.built) status = "Coming later in the year.";
    else if (capped(l.n)) status = "Coming soon. Your teacher will open this level.";
    else if (r) { status = `Closed for a refresh. One clean run of Level ${r.level} reopens it.`; action = `<div><a class="btn ghost" href="#practice-${r.level}">Practice Level ${r.level}</a></div>`; }
    else if (!open) status = `Opens after ${CONFIG.CLEAN_RUNS_TO_UNLOCK} clean runs of Level ${l.n - 1}. Now: ${cleanRuns(l.n - 1)} ${pips(cleanRuns(l.n - 1), CONFIG.CLEAN_RUNS_TO_UNLOCK)}`;
    else status = `Clean runs: ${cleanRuns(l.n)} ${pips(Math.min(cleanRuns(l.n), CONFIG.CLEAN_RUNS_TO_UNLOCK), CONFIG.CLEAN_RUNS_TO_UNLOCK)}`;
    if (open) action = `<div><a class="btn" href="#practice-${l.n}">Practice</a></div>`;
    return `<article class="rung ${open ? "" : "locked"}"><div class="num">${l.n}</div><h3>${l.title}</h3><p class="task">${l.task}</p><p class="status">${status}</p>${action}</article>`;
  }).join("");
  app.innerHTML = `
    <header class="mast"><h1>WE</h1><p>A timeline of American history and where you are in it</p></header>
    ${stripHTML()}
    <p class="strip-note">All 540 years, drawn to scale. Each colored block is one era, numbered in order. By the end of the year you'll be able to rebuild this whole strip: names, descriptions, years, and anchor events.</p>
    <div class="ladder-head"><h2>The ladder</h2><p>A <b>clean run</b> means every answer is right on your first check, with no hints. ${CONFIG.CLEAN_RUNS_TO_UNLOCK} clean runs open the next level. From Level 2 on, each practice session starts with a short warm-up on the earlier levels.</p></div>
    <section class="ladder">${rungs}</section>
    <footer class="foot"><span>Progress is saved on this computer.</span><a href="#teacher">Teacher tools</a></footer>`;
}

// ===== GAME STATE =====
// tokens: things students move. zones: places they go. place[tokenId] = zoneId or null (the pile).
let G = null;
function startGame(level, mode, who) {
  W = null;
  let tokens, zones;
  if (level === 3) {
    const decoys = shuffle(DECOY_POOL).slice(0, CONFIG.DECOYS_PER_ROUND);
    tokens = [...BOUNDARIES.map((y, i) => ({ id: "y" + y, year: y, answer: "b" + i })),
              ...decoys.map(d => ({ id: "y" + d.year, year: d.year, answer: null, decoy: shuffle(d.items)[0] }))]
      .sort((a, b) => a.year - b.year);
    zones = BOUNDARIES.map((y, i) => "b" + i);
  } else {
    tokens = shuffle(ERAS).map(e => ({ id: (level === 1 ? "n" : "c") + e.n, era: e, answer: (level === 1 ? "d" : "s") + e.n }));
    zones = level === 1 ? shuffle(ERAS).map(e => "d" + e.n) : ERAS.map(e => "s" + e.n);
  }
  G = { level, mode, tokens, zones, place: {}, locked: {}, missed: {}, selected: null, checks: 0, done: false,
        who: who || null, startedAt: Date.now(), result: null, msg: "",
        hints: {}, openHint: null, hinted: false };
  tokens.forEach(t => (G.place[t.id] = null));
  renderGame();
}
const tok = id => G.tokens.find(t => t.id === id);
const inZone = z => G.tokens.find(t => G.place[t.id] === z);
const placedCount = () => G.zones.filter(z => inZone(z)).length;

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
  if (G.level === 3) return `<button type="button" class="chip year ${cls}" ${attrs}>${t.year}</button>`;
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
  if (G.mode !== "practice" || G.done || G.level === 3) return tokenHTML(t);
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
  if (G.level === 3) {
    const t = inZone(z), why = t && t.decoy ? ` ${t.year} was a decoy: ${esc(t.decoy.ev.event)}, during Era ${t.decoy.era.n}.` : "";
    return `<div class="mark wrong">Not this one. Answer: ${BOUNDARIES[+z.slice(1)]}.${why}</div>`;
  }
  const right = eraOf(+z.slice(1));
  return `<div class="mark wrong">Not this one. Answer: ${esc(right.name)}</div>`;
}

function renderGame() {
  const L = LEVELS[G.level - 1], total = G.zones.length, n = placedCount();
  const isCheck = G.mode === "check";
  const pile = G.tokens.filter(t => !G.place[t.id]);
  const pileHTML = `<aside class="pile" data-bank>
      <h3>${["Era names", "Eras", "Years"][G.level - 1]} <span>${pile.length} left</span></h3>
      ${G.level === 3 && !isCheck ? caughtHTML() : ""}
      <div class="pile-list ${G.level === 3 ? "years" : ""}">${pile.map(pileItemHTML).join("") || `<p class="pile-empty">${G.done ? "All placed." : "All placed. Drag one back here to take it out."}</p>`}</div>
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
  } else if (G.level === 3) {
    const line = i => {
      const z = "b" + i, solved = !isCheck && inZone(z) && G.locked[inZone(z).id];
      const wrong = G.result && !G.result.byZone[z].ok;
      const label = i === 0 ? "Era 1 begins" : i === ERAS.length ? `Era ${i} ends` : `Era ${i} ends · Era ${i + 1} begins`;
      return `<div class="line-row ${solved ? "solved" : ""} ${wrong ? "wrong" : ""}">${slotHTML(z, "Drop a year here")}<span class="line-label">${label}</span>${markHTML(z)}</div>`;
    };
    rows = BOUNDARIES.map((_, i) => line(i) + (i < ERAS.length ? (e => `<div class="era-band" style="--era:var(--e${e.n})"><b>ERA ${e.n} · ${esc(e.name)}</b><span>${esc(e.desc)}</span></div>`)(ERAS[i]) : "")).join("");
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

  const howto = [
    `Drag each <b>era name</b> onto the description it matches. You can also click a name, then click a description.`,
    `Drag each era onto its place on the timeline. The years are there to help. You can also click an era, then click a spot.`,
    `Put a year on each line between eras. Each line is where one era ends and the next begins. <b>Some years in the pile are decoys</b> and belong on no line.`
  ][G.level - 1];

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
      ${isCheck && !G.done ? `<span class="small">${esc(G.who.name)} · ${esc(G.who.teacher)} · ${esc(G.who.hour)}</span>` : `<a class="back" href="#">← All levels</a>`}
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

function caughtHTML() {
  const caught = G.tokens.filter(t => t.decoy && G.caught && G.caught[t.id]);
  if (!caught.length) return "";
  return `<div class="caught"><p class="caught-head">Decoys you found</p>${caught.map(t => `<p>${decoyNote(t)}</p>`).join("")}</div>`;
}
function tipsHTML() {
  if (G.level === 3) return `<div class="tips"><p><b>Stuck?</b> Start with the first and last lines. Then ask of each year: did an era end or begin that year, or did something happen in the middle of one?</p><p>The decoys are years of real anchor events that happened inside an era. If you know what happened that year, you can rule it out.</p></div>`;
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
    else { wrong++; G.place[t.id] = null; G.missed[t.id] = true; if (t.decoy) (G.caught = G.caught || {})[t.id] = true; }
  });
  const total = G.zones.length, right = G.tokens.filter(t => G.locked[t.id]).length;
  if (right === total) {
    G.done = true;
    G.clean = G.checks === 1 && !G.hinted;
    if (G.clean) {
      progress.clean[G.level] = cleanRuns(G.level) + 1;
      Object.keys(progress.refresh).forEach(n => { if (progress.refresh[n].level === G.level) { delete progress.refresh[n]; progress.misses[n] = 0; G.reopened = +n; } });
      saveProgress();
    }
  } else {
    G.msg = `<b>${right} of ${total} right.</b> ${wrong === 1 ? "The other one went" : `The other ${wrong} went`} back to the pile.`;
  }
  G.selected = null;
  renderGame();
}
function finishBar() {
  const need = CONFIG.CLEAN_RUNS_TO_UNLOCK, have = cleanRuns(G.level), next = LEVELS[G.level];
  let line1;
  const all = G.zones.length;
  if (G.clean) line1 = `<b>Clean run.</b> All ${all} right on the first check.`;
  else if (G.hinted) line1 = `<b>All ${all} in place.</b> You used hints, so this was a practice run. Try a round without hints for a clean run.`;
  else line1 = `<b>All ${all} in place</b> after ${G.checks} checks. A clean run needs them all right on the first check.`;
  let line2 = `Clean runs on this level: ${have} ${pips(Math.min(have, need), need)}`;
  if (G.reopened) line2 += ` Level ${G.reopened} is open again.`;
  else if (next && next.built && have >= need && !capped(next.n)) line2 += ` Level ${next.n} is open.`;
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
        <label for="student-teacher">Teacher<select id="student-teacher" required><option value="">Choose your teacher</option>${CONFIG.TEACHERS.map(t => `<option>${esc(t.code)}</option>`).join("")}</select></label>
        <label for="student-hour">Hour<select id="student-hour" required disabled><option value="">Choose your teacher first</option></select></label>
        <label for="student-name">Your first and last name<input id="student-name" autocomplete="name" required></label>
        <p class="err" id="who-err" aria-live="polite"></p>
        <div><button class="btn" type="submit">Start the check</button></div>
      </form>
    </section>`;
  const tSel = document.getElementById("student-teacher"), hSel = document.getElementById("student-hour");
  tSel.addEventListener("change", () => {
    const t = CONFIG.TEACHERS.find(x => x.code === tSel.value);
    if (!t) { hSel.innerHTML = `<option value="">Choose your teacher first</option>`; hSel.disabled = true; return; }
    hSel.innerHTML = (t.hours.length > 1 ? `<option value="">Choose your hour</option>` : "") + t.hours.map(h => `<option>${esc(h)}</option>`).join("");
    hSel.disabled = false;
  });
  document.getElementById("who-form").addEventListener("submit", ev => {
    ev.preventDefault();
    const teacher = tSel.value, hour = hSel.value, name = document.getElementById("student-name").value.trim();
    const err = !teacher ? "Choose your teacher to start." : !hour ? "Choose your hour to start." : !name ? "Type your first and last name to start." : "";
    if (err) { document.getElementById("who-err").textContent = err; return; }
    startGame(level, "check", { teacher, hour, name });
  });
}
function submitCheck() {
  const byZone = {};
  let score = 0;
  G.zones.forEach(z => {
    const t = inZone(z), ok = !!t && t.answer === z;
    if (ok) score++;
    byZone[z] = { ok, got: t ? (t.year || t.era.n) : null };
  });
  const seconds = Math.round((Date.now() - G.startedAt) / 1000);
  G.result = { byZone, score, total: G.zones.length, seconds, send: CONFIG.SHEET_URL ? "sending" : "none" };
  G.done = true; G.selected = null;
  renderGame(); window.scrollTo(0, 0);
  const detail = G.level === 3
    ? G.zones.map(z => `${BOUNDARIES[+z.slice(1)]}: ${byZone[z].ok ? "right" : "placed " + byZone[z].got}`).join("; ")
    : G.zones.slice().sort().map(z => `Era ${z.slice(1)}: ${byZone[z].ok ? "right" : "placed Era " + byZone[z].got}`).join("; ");
  sendResult({
    teacher: G.who.teacher, student: G.who.name, hour: G.who.hour, level: G.level, levelName: LEVELS[G.level - 1].title,
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
      <dl><dt>Name</dt><dd>${esc(G.who.name)}</dd><dt>Teacher</dt><dd>${esc(G.who.teacher)}</dd><dt>Hour</dt><dd>${esc(G.who.hour)}</dd><dt>Level</dt><dd>${G.level} · ${LEVELS[G.level - 1].title}</dd><dt>Time</dt><dd>${m}:${String(s).padStart(2, "0")}</dd></dl></div>
    ${note}
    <p class="small" style="margin-top:12px">Each row below is marked. The ones you missed show the right answer.</p>
  </section>`;
}

// ===== WARM-UP: before each practice session of Level 2 and up =====
// Three random eras. Each one chains together everything from the earlier levels.
// Only a warm-up with no misses opens the level. A miss means another warm-up; two misses in a row
// close the level until one clean run of the earlier level the misses came from.
const WARMUP_ERAS = 3;
let warmedUp = {}, W = null;
function warmupSteps(n, e) {
  const name = { kind: "name", from: n === 2 ? 1 : 2, answer: e.n, options: shuffle(ERAS).map(x => x.n),
                 ask: n === 2 ? "Which era is this?" : "Which era is this?" };
  const desc = { kind: "desc", from: 1, answer: e.n, options: shuffle([e, ...shuffle(ERAS.filter(x => x !== e)).slice(0, 3)]).map(x => x.n),
                 ask: `Which description goes with ${esc(e.name)}?` };
  const start = { kind: "start", from: 3, answer: e.n, options: ERAS.map(x => x.n), ask: `What year does Era ${e.n} begin?` };
  if (n === 2) return [name];
  if (n === 3) return [name, desc];
  return [start, name, desc];
}
function startWarmup(n, avoid = []) {
  G = null;
  W = { level: n, idx: 0, items: shuffle(ERAS.filter(e => !avoid.includes(e.n))).slice(0, WARMUP_ERAS).map(e => ({ era: e, steps: warmupSteps(n, e) })), done: false };
  renderWarmup();
}
function anchorHTML(n, e) {
  if (n === 2) return `<div class="wu-anchor"><span class="wu-label">Description</span><p>${esc(e.desc)}</p></div>`;
  if (n === 3) return `<div class="wu-anchor era" style="--era:var(--e${e.n})"><b>ERA ${e.n}</b><span>${years(e)}</span></div>`;
  return `<div class="wu-anchor era" style="--era:var(--e${e.n})"><b>ERA ${e.n}</b></div>`;
}
function optionLabel(step, k) {
  const x = eraOf(k);
  if (step.kind === "name") return esc(x.name);
  if (step.kind === "start") return String(x.start);
  return esc(x.desc);
}
function renderWarmup() {
  const n = W.level, item = W.items[W.idx];
  if (W.done) return renderWarmupResult();
  const active = item.steps.findIndex(s => s.picked == null);
  const steps = item.steps.map((st, i) => {
    if (i > active && active !== -1) return "";
    const opts = st.options.map(k => {
      let cls = "";
      if (st.picked != null) cls = k === st.answer ? "right" : k === st.picked ? "wrong" : "dim";
      return `<button type="button" class="wu-opt ${st.kind} ${cls}" data-wu="${i}:${k}" ${st.picked != null ? "disabled" : ""}>${optionLabel(st, k)}</button>`;
    }).join("");
    return `<div class="wu-step"><p class="wu-ask">${st.ask}</p><div class="wu-opts ${st.kind}">${opts}</div></div>`;
  }).join("");
  const last = W.idx === W.items.length - 1;
  const next = active === -1 ? `<div class="actionbar"><p class="msg">${item.steps.every(s => s.picked === s.answer) ? "All right." : "The right answers are in green."}</p><button class="btn" id="wu-next">${last ? "See how you did" : "Next era"}</button></div>` : "";
  app.innerHTML = `
    <nav class="topbar"><div class="where"><h2>Level ${n} · Warm-up</h2><span class="mode">Era ${W.idx + 1} of ${W.items.length}</span></div><a class="back" href="#">← All levels</a></nav>
    <p class="howto">Before Level ${n}, show that you still have the earlier levels down. One try at each step, no hints.</p>
    <section class="wu-card">${anchorHTML(n, item.era)}${steps}</section>
    ${next}`;
  const nb = document.getElementById("wu-next");
  if (nb) nb.onclick = () => { if (last) W.done = true; else W.idx++; renderWarmup(); window.scrollTo(0, 0); };
}
function renderWarmupResult() {
  const n = W.level, missed = W.items.flatMap(it => it.steps.filter(s => s.picked !== s.answer));
  warmedUp[n] = true;
  let body, buttons;
  if (!missed.length) {
    progress.misses[n] = 0; saveProgress();
    body = `<h2>Warm-up passed</h2><p>You still have the earlier levels down. On to Level ${n}.</p>`;
    buttons = `<button class="btn" id="wu-go">Start Level ${n}</button>`;
  } else {
    const from = Math.min(...missed.map(s => s.from));
    progress.misses[n] = (progress.misses[n] || 0) + 1;
    if (progress.misses[n] >= 2) {
      progress.refresh[n] = { level: from, base: cleanRuns(from) };
      progress.misses[n] = 0;
      warmedUp[n] = false;
      body = `<h2>Time for a refresh</h2><p>That's two warm-ups in a row with misses, so Level ${n} is closed for now. <b>One clean run of Level ${from}</b> will open it again.</p>`;
      buttons = `<a class="btn" href="#practice-${from}">Practice Level ${from}</a><a class="btn ghost" href="#">All levels</a>`;
    } else {
      warmedUp[n] = false;
      body = `<h2>Warm-up missed</h2><p>You missed ${missed.length === 1 ? "one step" : missed.length + " steps"}. To start Level ${n}, you need a warm-up with no misses. Try another one with three different eras. <b>If you miss that one too, Level ${n} will close until you do a clean run of Level ${from}.</b></p>`;
      buttons = `<button class="btn" id="wu-again">Try another warm-up</button><a class="btn ghost" href="#practice-${from}">Practice Level ${from} first</a>`;
    }
    saveProgress();
  }
  app.innerHTML = `
    <nav class="topbar"><div class="where"><h2>Level ${n} · Warm-up</h2></div><a class="back" href="#">← All levels</a></nav>
    <section class="panel">${body}<div class="btn-row" style="margin-top:16px">${buttons}</div></section>`;
  const go2 = document.getElementById("wu-go");
  if (go2) go2.onclick = () => startGame(n, "practice");
  const again = document.getElementById("wu-again");
  if (again) again.onclick = () => { startWarmup(n, W.items.map(it => it.era.n)); window.scrollTo(0, 0); };
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-wu]");
  if (!b || !W || W.done) return;
  const [i, k] = b.dataset.wu.split(":").map(Number), st = W.items[W.idx].steps[i];
  if (st.picked != null) return;
  st.picked = k;
  renderWarmup();
});

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
      <p>${CONFIG.SHEET_URL ? `Connected. Each submitted check goes to its teacher's sheet (${CONFIG.TEACHERS.map(t => esc(t.code)).join(", ")}).` : "Not connected yet. Students will see their score on screen. The README explains how to connect a Google Sheet in about five minutes."}</p></section>
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
    if (reset.dataset.armed) { progress = { clean: {}, unlockAll: false, misses: {}, refresh: {} }; saveProgress(); renderTeacher(); document.getElementById("teacher-msg").textContent = "Progress reset on this computer."; return; }
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
