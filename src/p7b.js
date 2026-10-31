/* ================= progress (saved in this browser) ================= */
const PROG = { load(k) { try { return new Set(JSON.parse(localStorage.getItem(k) || "[]")); } catch (e) { return new Set(); } }, save(k, s) { try { localStorage.setItem(k, JSON.stringify([...s])); } catch (e) { } } };
let DONE = PROG.load("nvl-done"), EXDONE = PROG.load("nvl-exdone");
const cState = id => DONE.has(id) ? "done" : CI[id].pre.every(p => DONE.has(p)) ? "ready" : "locked";
function markDone(id, on = true) { on ? DONE.add(id) : DONE.delete(id); PROG.save("nvl-done", DONE); updateProgressBadge(); }
function frontier() { return CONCEPTS.filter(c => cState(c.id) === "ready"); }
function updateProgressBadge() { const b = $("#prog-badge"); if (b) b.textContent = `${DONE.size}/${CONCEPTS.length}`; }

/* ================= skill tree layout: floors are rows, prerequisites sit below ================= */
function layoutConcepts() {
  const byF = {}; CONCEPTS.forEach(c => (byF[c.floor] = byF[c.floor] || []).push(c));
  const GAP = 2.7, ROW = 2.9;
  for (let f = 0; f < FLOORS.length; f++) {
    const arr = byF[f] || [];
    if (f > 0) arr.forEach(c => { const xs = c.pre.map(p => CI[p].pos ? CI[p].pos[0] : 0); c._bx = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; });
    else arr.forEach((c, i) => c._bx = i);
    arr.sort((a, b) => a._bx - b._bx);
    arr.forEach((c, i) => { c.pos = [(i - (arr.length - 1) / 2) * GAP, f * ROW, 0]; });
  }
}
ST.cmap = {
  tab: "Concept map", cam: [[0, 16, 46], [0, 13, 0]],
  legend() { return `<b>Skill tree · ${DONE.size} of ${CONCEPTS.length} done</b><div class="row"><span><i class="sw" style="background:var(--c3)"></i>done</span><span><i class="sw" style="background:var(--c4)"></i>ready to learn</span><span><i class="sw" style="background:var(--c5)"></i>locked</span><span>ring = selected</span></div>`; },
  draw() {
    if (!CONCEPTS[0].pos || CONCEPTS[0].pos[2] !== 0) layoutConcepts();
    const anc = ancestors(selC), des = descendants(selC), s = CI[selC];
    for (let f = 0; f < FLOORS.length; f++) { const row = CONCEPTS.filter(c => c.floor === f), w = row.length * 2.7; V.box(0, f * 2.9 - 0.25, 0, w + 1, 0.08, 1.6, (f & 1) ? C.panel : C.line, null); pin(-w / 2 - 1.2, f * 2.9 + 0.2, 0, `${f} · ${FLOORS[f].split(":")[0].split(" (")[0]}`, "flat left"); }
    for (const c of CONCEPTS) {
      for (const p of c.pre) { const q = CI[p].pos, below = (c.id === selC || anc.has(c.id)) && anc.has(p), up = p === selC; if (below || up) Ln.seg(q[0], q[1] + 0.35, 0, c.pos[0], c.pos[1] + 0.35, 0, up ? C.c1 : C.c3); else if (DONE.has(p) && DONE.has(c.id)) Ln.seg(q[0], q[1] + 0.35, 0, c.pos[0], c.pos[1] + 0.35, 0, mix(C.c3, C.bg, 0.5)); }
      const st = cState(c.id), sel = c.id === selC, col = st === "done" ? C.c3 : st === "ready" ? C.c4 : mix(C.c5, C.bg, 0.35), sz = sel ? 1.05 : 0.72;
      V.box(c.pos[0], c.pos[1], 0, sz, sz, sz, col, { cid: c.id });
      if (st === "ready") V.box(c.pos[0], c.pos[1] - 0.08, 0, 1.15, 0.08, 1.15, C.c4, { cid: c.id });
      if (sel) V.box(c.pos[0], c.pos[1] - 0.12, 0, 1.6, 0.1, 1.6, C.ink, { cid: c.id });
    }
    pin(s.pos[0], s.pos[1] + 1.4, 0, s.name, "soft");
    s.pre.forEach(p => pin(CI[p].pos[0], CI[p].pos[1] + 1, 0, CI[p].name, "ok"));
    s.next.forEach(p => pin(CI[p].pos[0], CI[p].pos[1] + 1, 0, CI[p].name, "hot"));
  },
  onPick(t) { if (t && t.cid) goConcept(t.cid, false); },
  onHover(t) { if (t && t.cid) { const c = CI[t.cid], st = cState(t.cid); return `${c.name}\n${st === "done" ? "done ✓" : st === "ready" ? "ready to learn" : "locked: needs " + c.pre.filter(p => !DONE.has(p)).map(p => CI[p].name).join(", ")}`; } },
  state() { return `skill tree, selected concept "${CI[selC].name}", ${DONE.size} of ${CONCEPTS.length} concepts done`; }
};
function conceptCam(c) { flyTo([c.pos[0] * 0.5, c.pos[1] + 7, 40], [c.pos[0] * 0.5, c.pos[1] + 2, 0]); }

/* hook: called at the end of goConcept */
function afterConcept(c, v, fly) {
  if (!CONCEPTS[0].pos || CONCEPTS[0].pos[2] !== 0) layoutConcepts();
  if (fly) conceptCam(c);
  $("#legend").innerHTML = ST.cmap.legend();
  const st = cState(c.id), next = frontier().slice(0, 8);
  const top = document.createElement("div"); top.className = "block progblock";
  top.innerHTML = `<div class="progline"><span class="pill ${st === "done" ? "ok" : st === "ready" ? "warn" : ""}">${st === "done" ? "Done ✓" : st === "ready" ? "Ready to learn" : "Locked"}</span><span class="note" style="margin:0">${st === "locked" ? "Finish first: " + c.pre.filter(p => !DONE.has(p)).map(p => `<button type="button" class="linkbtn" data-c="${p}">${esc(CI[p].name)}</button>`).join(", ") : `${DONE.size} of ${CONCEPTS.length} concepts done`}</span></div>
    <div class="bar"><i style="width:${DONE.size / CONCEPTS.length * 100}%"></i></div>
    ${next.length ? `<p class="eyebrow" style="margin-top:10px">Next up (all prerequisites done)</p><div class="chips">${next.map(n => `<button type="button" class="chip ${n.id === c.id ? "on" : ""}" data-c="${n.id}">${esc(n.name)}</button>`).join("")}</div>` : `<p class="note">Everything is done. Impressive.</p>`}`;
  v.insertBefore(top, v.children[1]);
  const chk = document.createElement("div"); chk.className = "block checkblock";
  const Q = CHECKS[c.id];
  if (Q) {
    chk.innerHTML = `<h3>Check yourself</h3><p class="qz">${esc(Q[0])}</p><div class="opts">${Q[1].map((o, i) => `<button type="button" class="opt" data-i="${i}">${esc(o)}</button>`).join("")}</div><p class="note qfb"></p>`;
    chk.querySelectorAll(".opt").forEach(b => b.onclick = () => {
      const i = +b.dataset.i, ok = i === Q[2]; chk.querySelectorAll(".opt").forEach((x, j) => x.classList.toggle(j === Q[2] ? "right" : "wrong", j === i || j === Q[2] && ok));
      chk.querySelector(".qfb").innerHTML = ok ? `<b>Right.</b> ${esc(Q[3])} <b>${esc(c.name)}</b> is marked done.` : `<b>Not quite.</b> Re-read the easy explanation and try again.`;
      if (ok && !DONE.has(c.id)) { markDone(c.id); setTimeout(() => goConcept(c.id, false), 1400); }
    });
  } else {
    chk.innerHTML = `<h3>Check yourself</h3><p class="note" style="margin:0 0 8px">Ask the AI for a question about ${esc(c.name)}, answer it in your head or on paper, then mark it done.</p><div class="ai-slot"></div>`;
    explainButton(chk.querySelector(".ai-slot"), "q-" + c.id, () => `Write ONE short check question (multiple choice, 4 options labelled A–D) that tests real understanding of "${c.name}" (${c.easy}). Then on a new line write "Answer:" with the letter and a two-sentence explanation. Keep the answer at the end so the learner can cover it.`, "Quiz me (AI)");
  }
  const mk = document.createElement("div"); mk.className = "btns"; mk.innerHTML = DONE.has(c.id) ? `<button type="button" class="btn" data-undo>Mark as not done</button>` : Q ? "" : `<button type="button" class="btn primary" data-mark>I can explain it: mark done</button>`;
  chk.append(mk);
  mk.querySelector("[data-mark]")?.addEventListener("click", () => { markDone(c.id); goConcept(c.id, false); });
  mk.querySelector("[data-undo]")?.addEventListener("click", () => { markDone(c.id, false); goConcept(c.id, false); });
  const eqBlock = v.querySelector(".block"); v.insertBefore(chk, v.querySelector("#c-ai"));
  v.querySelectorAll("[data-c]").forEach(b => b.onclick = () => goConcept(b.dataset.c));
}

/* ================= practice inside chapters ================= */
const EX_OF = ch => (typeof PRACTICE !== "undefined" ? PRACTICE.exercises.filter(e => e.ch === ch) : []);
const PROJ_OF = ch => (typeof PRACTICE !== "undefined" ? PRACTICE.projects.filter(p => p.chapters.includes(ch)) : []);
function codeBlock(code, label) { return `<div class="codewrap"><div class="code-head"><span class="eyebrow">${label}</span><button type="button" class="btn small" data-copy>Copy</button></div><pre class="code">${hl(code)}</pre></div>`; }
function bindCopy(root) { root.querySelectorAll("[data-copy]").forEach(b => { if (b.dataset.bound) return; b.dataset.bound = 1; b.onclick = () => { const t = b.closest(".codewrap").querySelector("pre").innerText; navigator.clipboard.writeText(t).then(() => { b.textContent = "Copied"; setTimeout(() => b.textContent = "Copy", 1300); }).catch(() => { const r = document.createRange(); r.selectNodeContents(b.closest(".codewrap").querySelector("pre")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }); }; }); }
function exCard(e) {
  const kind = { think: "Think", derive: "Derive by hand", code: "Code" }[e.kind], done = EXDONE.has(e.id);
  return `<details class="sec ex${done ? " isdone" : ""}" data-ex="${e.id}"><summary><span class="sn">${e.id}</span><span class="st">${esc(e.title)}</span><span class="sp"><span class="kind k-${e.kind}">${kind}</span> §${e.sec}</span><i class="dot ${done ? "ok" : ""}"></i></summary>
    <div class="sec-body"><p class="qz">${esc(e.q)}</p>
    <details class="reveal"><summary>Hint</summary><p>${esc(e.hint)}</p></details>
    ${e.kind === "code" ? codeBlock(e.starter, "Starter: fill in the … lines") + `<details class="reveal"><summary>Solution code and its real output</summary>${codeBlock(e.solution, "Solution")}<pre class="out">${esc(e.output)}</pre></details>` : `<p class="note" style="margin:0">Work it out on paper first.</p>`}
    <details class="reveal"><summary>${e.kind === "code" ? "Explanation" : "Worked answer"}</summary><p>${esc(e.answer)}</p></details>
    <div class="btns"><button type="button" class="btn ${done ? "" : "primary"}" data-exdone="${e.id}">${done ? "Done ✓ (undo)" : "Mark done"}</button>${e.kind === "code" ? `<a class="btn" href="${PRACTICE.colab + e.notebook}" target="_blank" rel="noopener">Open chapter notebook in Colab ↗</a>` : ""}</div></div></details>`;
}
function bindExercises(root) {
  bindCopy(root);
  root.querySelectorAll("[data-exdone]").forEach(b => b.onclick = () => { const id = b.dataset.exdone; EXDONE.has(id) ? EXDONE.delete(id) : EXDONE.add(id); PROG.save("nvl-exdone", EXDONE); const d = b.closest("details.ex"); d.outerHTML = exCard(PRACTICE.exercises.find(x => x.id === id)); const nd = root.querySelector(`details.ex[data-ex="${id}"]`); nd.open = true; bindExercises(root); updateChapterPractice(); });
}
function updateChapterPractice() { const h = $("#practice-count"); if (!h || !curChap) return; const ex = EX_OF(curChap); h.textContent = `${ex.filter(e => EXDONE.has(e.id)).length} of ${ex.length} done`; }
function afterChapter(b, n, v) {
  const key = b + n, ex = EX_OF(key), pj = PROJ_OF(key);
  if (!ex.length && !pj.length) return;
  const box = document.createElement("div"); box.className = "practice";
  box.innerHTML = `<div class="practice-head"><div><p class="eyebrow">Do it</p><h3 style="font:800 20px var(--f-display);margin:2px 0 0">Practice${ex.length ? ` · <span id="practice-count" class="note"></span>` : ""}</h3></div>${ex.length ? `<a class="btn primary" href="${PRACTICE.colab + ex[0].notebook}" target="_blank" rel="noopener">Open all in Colab ↗</a>` : ""}</div>
    <p class="note" style="margin:0">Try each one before opening anything. Code exercises have a starter with … to fill in; the solution and its real output are hidden until you ask. Every solution was run to produce the output shown.</p>
    <div class="secs">${ex.map(exCard).join("")}</div>
    ${pj.map(p => `<div class="projcard"><p class="eyebrow">Build project · ${p.steps.length} milestones</p><h4>${esc(p.title)}</h4><p class="note" style="color:var(--ink)">${esc(p.blurb)}</p><div class="btns"><button type="button" class="btn primary" data-proj="${p.id}">Open the project</button><a class="btn" href="${PRACTICE.colab + p.notebook}" target="_blank" rel="noopener">Colab notebook ↗</a></div></div>`).join("")}`;
  const anchor = v.querySelector("#chap-ask"); v.insertBefore(box, anchor);
  bindExercises(box); updateChapterPractice();
  box.querySelectorAll("[data-proj]").forEach(x => x.onclick = () => openProject(x.dataset.proj));
}
function openProjects() {
  const d = drawer("projects", "Build projects", "Questions, milestones and full solutions"); d.hidden = false;
  d.querySelector(".drawer-body").innerHTML = PRACTICE.projects.map(p => `<div class="projcard"><p class="eyebrow">${p.steps.length} milestones · uses ${p.chapters.map(c => "ch. " + c.slice(1)).join(", ")}</p><h4>${esc(p.title)}</h4><p class="note" style="color:var(--ink)">${esc(p.blurb)}</p><div class="btns"><button type="button" class="btn primary" data-proj="${p.id}">Open</button><a class="btn" href="${PRACTICE.colab + p.notebook}" target="_blank" rel="noopener">Colab notebook ↗</a></div></div>`).join("") + `<p class="note">More projects arrive with each new batch of chapters.</p>`;
  d.querySelectorAll("[data-proj]").forEach(x => x.onclick = () => openProject(x.dataset.proj));
}
function openProject(id) {
  const p = PRACTICE.projects.find(x => x.id === id), d = drawer("projects", "Build projects", "Questions, milestones and full solutions"); d.hidden = false;
  const body = d.querySelector(".drawer-body");
  body.innerHTML = `<button type="button" class="btn" data-back>← All projects</button><div><p class="eyebrow">Project</p><h2 style="margin:2px 0 6px">${esc(p.title)}</h2><p class="lede">${esc(p.blurb)}</p></div>
    <div class="btns" style="margin:0"><a class="btn primary" href="${PRACTICE.colab + p.notebook}" target="_blank" rel="noopener">Open in Colab ↗</a><span class="note">Milestones run in order in one notebook; later ones use earlier variables.</span></div>
    <ol class="milestones">${p.steps.map((s, i) => { const k = p.id + "." + (i + 1), done = EXDONE.has(k); return `<li class="${done ? "isdone" : ""}"><h4>${i + 1}. ${esc(s.title)}</h4><p class="qz">${esc(s.q)}</p>${s.starter ? codeBlock(s.starter, "Starter") + `<details class="reveal"><summary>Solution and real output</summary>${codeBlock(s.solution, "Solution")}<pre class="out">${esc(s.output)}</pre></details>` : ""}<details class="reveal"><summary>${s.starter ? "Explanation" : "Model answer"}</summary><p>${esc(s.answer)}</p></details><div class="btns"><button type="button" class="btn ${done ? "" : "primary"}" data-ms="${k}">${done ? "Done ✓ (undo)" : "Mark milestone done"}</button></div></li>`; }).join("")}</ol>`;
  body.querySelector("[data-back]").onclick = openProjects; bindCopy(body);
  body.querySelectorAll("[data-ms]").forEach(b => b.onclick = () => { const k = b.dataset.ms; EXDONE.has(k) ? EXDONE.delete(k) : EXDONE.add(k); PROG.save("nvl-exdone", EXDONE); const top = body.scrollTop; openProject(id); d.querySelector(".drawer-card").scrollTop = top; });
}

/* ================= three more labs ================= */
/* Murphy ch. 9: generative classifiers */
lab("m9gda", {
  title: "Classify by modelling each class: LDA vs QDA", tab: "Gaussian classifiers", cam: [[0, 13, 19], [0, 1.6, 0]],
  how: "Instead of drawing a boundary directly, model what each class looks like: fit one Gaussian to the orange points and one to the blue. Then Bayes' rule gives P(orange | x) everywhere (the floating sheet). If both classes share one covariance (LDA) the boundary is a straight line; if each has its own (QDA) it curves. Make the blue class much wider than the orange and compare.",
  legend: () => `<b>P(orange | x) from two fitted Gaussians</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>class 1</span><span><i class="sw" style="background:var(--c2)"></i>class 0</span></div>`,
  ctl: [{ seg: "model", label: "Model", opts: [["lda", "LDA: shared covariance"], ["qda", "QDA: one per class"]], v: "qda" }, { s: "s0", label: "Blue spread", min: 0.3, max: 2.5, step: 0.05, v: 1.8, fmt: f2 }, { s: "s1", label: "Orange spread", min: 0.3, max: 2.5, step: 0.05, v: 0.5, fmt: f2 }, { s: "rho", label: "Orange tilt ρ", min: -0.9, max: 0.9, step: 0.05, v: 0.5, fmt: f2 }, { s: "n", label: "Points per class", min: 10, max: 200, step: 5, v: 80 }, { btns: [["new", "New sample", true]] }],
  stats: [["acc", "Training accuracy"], ["m1", "Fitted orange mean"], ["shape", "Boundary"]],
  init() { this.make(); }, act() { this.make(); }, change(k) { if (k === "model") this.fit(); else this.make(); },
  make() { const r = rng(R0() * 1e9 | 0), p = this.p, pts = []; for (let i = 0; i < p.n; i++) { const a = randn(r), b = randn(r); pts.push([-0.8 + p.s0 * a, -0.6 + p.s0 * b, 0]); } for (let i = 0; i < p.n; i++) { const a = randn(r), b = randn(r); pts.push([1 + p.s1 * a, 0.7 + p.s1 * (p.rho * a + Math.sqrt(1 - p.rho * p.rho) * b), 1]); } this.pts = pts.map(([x, y, c]) => [clamp(x, -2.95, 2.95), clamp(y, -2.95, 2.95), c]); this.fit(); },
  fit() {
    const st = c => { const P = this.pts.filter(q => q[2] === c), n = P.length, m = [P.reduce((s, q) => s + q[0], 0) / n, P.reduce((s, q) => s + q[1], 0) / n]; let a = 0, b = 0, d = 0; for (const q of P) { const u = q[0] - m[0], v = q[1] - m[1]; a += u * u; b += u * v; d += v * v; } return { n, m, S: [a / n, b / n, d / n] }; };
    const A = st(0), B = st(1); if (this.p.model === "lda") { const N = A.n + B.n, S = A.S.map((v, i) => (A.n * v + B.n * B.S[i]) / N); A.S = S; B.S = S; } this.g = [A, B];
    let ok = 0; for (const q of this.pts) if ((this.post(q[0], q[1]) > 0.5) === (q[2] === 1)) ok++; this.acc = ok / this.pts.length; this.refresh();
  },
  ld(x, y, g) { const [a, b, d] = g.S, det = a * d - b * b, u = x - g.m[0], v = y - g.m[1]; return -0.5 * (d * u * u - 2 * b * u * v + a * v * v) / det - 0.5 * Math.log(det) + Math.log(g.n); },
  post(x, y) { const l0 = this.ld(x, y, this.g[0]), l1 = this.ld(x, y, this.g[1]); return 1 / (1 + Math.exp(l0 - l1)); },
  refresh() { if (!this.g) return; setS("acc", pct(this.acc)); setS("m1", `(${f2(this.g[1].m[0])}, ${f2(this.g[1].m[1])})`); setS("shape", this.p.model === "lda" ? "straight line" : "curve (quadratic)"); labExtra(`<p style="margin:8px 0 0">The log-odds is log p(x|orange) − log p(x|blue) + log(prior ratio). Each log-Gaussian is a quadratic in x. With a shared Σ the x-squared terms cancel and only a linear function is left; that's why LDA's boundary is a line (Murphy §9.2.2). Logistic regression (ch. 10) learns that line directly without modelling the classes: discriminative vs generative (§9.4).</p>`); },
  draw() { const G = 26, cs = 12 / G; for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const x = -3 + (i + 0.5) * 6 / G, y = -3 + (j + 0.5) * 6 / G, a = this.post(x, y); V.box(x * 2, a * 4, -y * 2, cs * 0.6, 0.14, cs * 0.6, mix3(C.c2, C.card, C.c1, a), null); V.box(x * 2, -0.08, -y * 2, cs * 0.96, 0.06, cs * 0.96, (i + j) & 1 ? C.panel : C.line, null); } for (const [x, y, c] of this.pts) V.box(x * 2, c * 4 + 0.1, -y * 2, 0.28, 0.28, 0.28, mix(c ? C.c1 : C.c2, C.ink, 0.25), null); },
  state() { return `${this.p.model.toUpperCase()}, blue spread ${this.p.s0}, orange spread ${this.p.s1}, orange tilt ${this.p.rho}, ${this.p.n} points per class, training accuracy ${pct(this.acc)}.`; }
});
/* Murphy ch. 11: why lasso gives zeros */
lab("m11l1", {
  title: "Ridge vs lasso: why ℓ₁ makes weights exactly zero", tab: "Ridge vs lasso", cam: [[0, 21, 12], [0, 0, 0]],
  how: "The terrain is the squared-error loss over two weights (w₁, w₂); its lowest point (green) is the unpenalised answer. A penalty is equivalent to a budget: the weights must stay inside the yellow region. Ridge's region is a circle, lasso's is a diamond. The best allowed point is where the lowest contour first touches the region. A diamond is usually touched at a corner, where one weight is exactly 0.",
  legend: () => `<b>Loss over (w₁, w₂) and the allowed region</b><div class="row"><span><i class="sw" style="background:var(--c4)"></i>allowed weights</span><span><i class="sw" style="background:var(--c3)"></i>unpenalised optimum</span><span><i class="sw" style="background:var(--c1)"></i>penalised answer</span></div>`,
  ctl: [{ seg: "norm", label: "Penalty", opts: [["l2", "Ridge (circle)"], ["l1", "Lasso (diamond)"]], v: "l1" }, { s: "t", label: "Budget t", min: 0.2, max: 3, step: 0.05, v: 1, fmt: f2 }, { s: "a", label: "Unpenalised w₁", min: -3, max: 3, step: 0.05, v: 2, fmt: f2 }, { s: "b", label: "Unpenalised w₂", min: -3, max: 3, step: 0.05, v: 0.8, fmt: f2 }, { s: "tilt", label: "Loss tilt (correlated features)", min: -0.8, max: 0.8, step: 0.05, v: 0.3, fmt: f2 }],
  stats: [["w", "Penalised weights"], ["z", "Weights exactly 0"], ["shrink", "Loss increase"]],
  change() { this.refresh(); },
  loss(x, y) { const u = x - this.p.a, v = y - this.p.b, r = this.p.tilt; return u * u + 2 * r * u * v + 1.6 * v * v; },
  inside(x, y) { return this.p.norm === "l1" ? Math.abs(x) + Math.abs(y) <= this.p.t : x * x + y * y <= this.p.t * this.p.t; },
  solve() { const p = this.p; if (this.inside(p.a, p.b)) return [p.a, p.b]; let best = null, bv = Infinity; for (let k = 0; k < 4000; k++) { const th = k / 4000 * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), r = p.norm === "l1" ? p.t / (Math.abs(c) + Math.abs(s)) : p.t, x = r * c, y = r * s, v = this.loss(x, y); if (v < bv) { bv = v; best = [x, y]; } } for (const q of [[p.t, 0], [-p.t, 0], [0, p.t], [0, -p.t]]) if (p.norm === "l1" && this.loss(...q) <= bv + 1e-9) { bv = this.loss(...q); best = q; } return best; },
  refresh() { const w = this.solve(); this.w = w; const z = w.filter(v => Math.abs(v) < 1e-3).length; setS("w", `(${f2(w[0])}, ${f2(w[1])})`); setS("z", z ? `${z} of 2` : "none"); setS("shrink", f3(this.loss(...w))); labExtra(`<p style="margin:8px 0 0">${this.p.norm === "l1" ? (z ? "The answer sits on a corner of the diamond, so one weight is exactly zero: lasso has selected a feature for you (Murphy §11.4.3)." : "No zero this time: the loss's lowest contour touched an edge of the diamond, not a corner. Shrink the budget and watch it snap to a corner.") : "A circle has no corners, so ridge shrinks both weights but almost never makes either exactly 0 (Murphy §11.3)."} The budget form 'min loss subject to ‖w‖ ≤ t' and the penalty form 'min loss + λ‖w‖' give the same answers for matching t and λ (Lagrange multipliers, §8.5).</p>`); },
  draw() { const G = 40, cs = 0.4; let mx = 0; const L = []; for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const x = -4 + (i + 0.5) * 0.2, y = -4 + (j + 0.5) * 0.2, v = this.loss(x, y); L.push(v); mx = Math.max(mx, v); }
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const x = -4 + (i + 0.5) * 0.2, y = -4 + (j + 0.5) * 0.2, v = L[i * G + j], h = Math.sqrt(v / mx) * 2.2, inn = this.inside(x, y); V.box((i - 19.5) * cs, 0, (19.5 - j) * cs, cs * 0.92, h + 0.05, cs * 0.92, inn ? mix(C.c4, C.bg, 0.25) : mix3(C.c3, C.c5, C.panel, Math.sqrt(v / mx)), null); }
    const P = (x, y) => [x / 0.2 * cs, -y / 0.2 * cs]; const [ax, az] = P(this.p.a, this.p.b), [wx, wz] = P(...this.w);
    V.box(ax, 0, az, 0.5, 0.8, 0.5, C.c3, null); V.box(wx, 0, wz, 0.55, 1.6, 0.55, C.c1, null); Ln.seg(ax, 0.9, az, wx, 1.7, wz, C.ink);
    pin(wx, 2, wz, "penalised answer", "hot"); pin(ax, 1.1, az, "best without penalty", "ok"); pin(8.4, 0.2, 0, "w₁ →", "flat"); pin(0, 0.2, -8.4, "w₂ →", "flat"); },
  state() { const w = this.w || [0, 0]; return `${this.p.norm === "l1" ? "lasso" : "ridge"}, budget t=${this.p.t}, unpenalised optimum (${this.p.a}, ${this.p.b}), penalised answer (${f2(w[0])}, ${f2(w[1])}).`; }
});
/* Murphy ch. 21: k-means */
lab("m21km", {
  title: "K-means, one step at a time", tab: "K-means", cam: [[0, 15, 13], [0, 0, 0]],
  how: "Tall towers are the cluster centres. Each step does two things: assign every point to its nearest centre (colours change), then move each centre to the average of its points (towers slide). The total squared distance can only go down. Try k values that don't match the real number of blobs, and use the elbow chart to choose k.",
  legend: () => `<b>Points coloured by nearest centre</b><div class="row"><span>towers = centres</span><span>trails = how centres moved</span></div>`,
  ctl: [{ s: "k", label: "Clusters k", min: 1, max: 8, step: 1, v: 4 }, { s: "blobs", label: "Real blobs in the data", min: 2, max: 7, step: 1, v: 4 }, { btns: [["step", "One step", true], ["run", "Run to the end"], ["init", "New random centres"], ["data", "New data"], ["elbow", "Elbow chart"]] }],
  stats: [["it", "Steps"], ["J", "Total squared distance"], ["moved", "Centres moved"]], chart: "Total squared distance", chartLegend: `<span><i style="background:var(--c2)"></i>per step, or per k for the elbow chart</span>`,
  init() { this.data(); },
  data() { const r = rng(R0() * 1e9 | 0), B = this.p.blobs, cs = Array.from({ length: B }, () => [r() * 6 - 3, r() * 6 - 3]); this.X = []; for (let i = 0; i < 360; i++) { const c = cs[i % B]; this.X.push([clamp(c[0] + randn(r) * 0.55, -3.9, 3.9), clamp(c[1] + randn(r) * 0.55, -3.9, 3.9)]); } this.initC(); },
  initC() { const r = rng(R0() * 1e9 | 0); this.C = Array.from({ length: this.p.k }, () => this.X[(r() * this.X.length) | 0].slice()); this.trail = this.C.map(c => [c.slice()]); this.assign(); this.it = 0; this.hist = [this.J()]; this.moved = "–"; this.refresh(); },
  assign() { this.a = this.X.map(x => { let b = 0, bd = Infinity; this.C.forEach((c, k) => { const d = (x[0] - c[0]) ** 2 + (x[1] - c[1]) ** 2; if (d < bd) { bd = d; b = k; } }); return b; }); },
  J() { return this.X.reduce((s, x, i) => s + (x[0] - this.C[this.a[i]][0]) ** 2 + (x[1] - this.C[this.a[i]][1]) ** 2, 0); },
  step() { this.assign(); let mv = 0; this.C = this.C.map((c, k) => { const P = this.X.filter((_, i) => this.a[i] === k); if (!P.length) return c; const n = [P.reduce((s, q) => s + q[0], 0) / P.length, P.reduce((s, q) => s + q[1], 0) / P.length]; mv += Math.hypot(n[0] - c[0], n[1] - c[1]); return n; }); this.C.forEach((c, k) => this.trail[k].push(c.slice())); this.assign(); this.it++; this.hist.push(this.J()); this.moved = f3(mv); return mv; },
  act(a) { if (a === "step") this.step(); if (a === "run") { for (let i = 0; i < 100 && this.step() > 1e-6; i++); } if (a === "init") this.initC(); if (a === "data") this.data(); if (a === "elbow") { const keep = [this.C, this.a, this.trail, this.it, this.hist], out = []; for (let k = 1; k <= 8; k++) { this.p.k = k; let best = Infinity; for (let rep = 0; rep < 4; rep++) { this.initC(); for (let i = 0; i < 100 && this.step() > 1e-6; i++); best = Math.min(best, this.J()); } out.push(best); } this.p.k = +$("#L-k").value;[this.C, this.a, this.trail, this.it, this.hist] = keep; this.elbow = out; } this.refresh(); },
  change(k) { if (k === "blobs") this.data(); else { this.elbow = null; this.initC(); } },
  refresh() { if (!this.C) return; setS("it", this.it); setS("J", f2(this.J())); setS("moved", this.moved); if (cur === this) lineChart($("#lab-chart"), [{ data: this.elbow || this.hist, color: tok("--c2") }], { ymin: 0, xlabel: this.elbow ? "k = 1 → 8 (best of 4 starts)" : "step →" }); labExtra(`<p style="margin:8px 0 0">${this.elbow ? `Elbow chart: the total distance always falls as k grows (more centres can only help), so look for the bend where adding a cluster stops paying off. With ${this.p.blobs} real blobs the bend should be near k = ${this.p.blobs}.` : "Each step can only lower the total: reassigning picks each point's nearest centre, and the average is the point that minimises squared distance to a group. That's EM with hard assignments (Murphy §21.3, §8.7). Different starting centres can get stuck in different answers, so in practice you run several starts."}</p>`); },
  draw() { const hue = k => [C.c1, C.c2, C.c3, C.c4, C.c5, mix(C.c1, C.c2, 0.5), mix(C.c3, C.c4, 0.5), mix(C.c2, C.c3, 0.5)][k % 8], S = 1.9;
    for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) V.box((i - 9.5) * 0.76, -0.08, (j - 9.5) * 0.76, 0.74, 0.06, 0.74, (i + j) & 1 ? C.panel : C.line, null);
    this.X.forEach((x, i) => V.box(x[0] * S, 0, -x[1] * S, 0.2, 0.2, 0.2, hue(this.a[i]), null));
    this.C.forEach((c, k) => { V.box(c[0] * S, 0, -c[1] * S, 0.45, 2.4, 0.45, hue(k), null); let pr = null; for (const q of this.trail[k]) { const pt = [q[0] * S, 0.15, -q[1] * S]; if (pr) Ln.seg(...pr, ...pt, C.ink); pr = pt; } }); },
  state() { return `k=${this.p.k}, data has ${this.p.blobs} blobs, ${this.it} steps, total squared distance ${f2(this.J())}.`; }
});
CHI.M9 = { why: "A different route to classification: instead of drawing the boundary directly, model what each class's data looks like, then use Bayes' rule to ask which class best explains a new point. Gaussian classes give LDA (straight boundaries) or QDA (curved ones); assuming features are independent gives naive Bayes. Comparing this with logistic regression (ch. 10) is the generative-vs-discriminative question.", builds: "ch. 2 (Bayes' rule), ch. 3 (multivariate Gaussian), ch. 4 (MLE)", sims: ["m9gda"] };
CHI.M11 = { why: "Predicting a number. Least squares has an exact answer (the normal equations), and it equals maximum likelihood under Gaussian noise. With many or correlated features it overfits, so you add a penalty: ridge (ℓ₂) shrinks weights smoothly; lasso (ℓ₁) sets some exactly to zero and so selects features. The chapter ends with robust and Bayesian versions.", builds: "ch. 4 (MLE, regularisation), ch. 7 (least squares), ch. 8 (optimisation)", sims: ["m11l1", "m1fit", "s3"] };
CHI.M21 = { why: "Find groups with no labels. K-means alternates 'assign each point to its nearest centre' and 'move each centre to its points' average'; Gaussian mixtures do the same softly with EM; hierarchical clustering builds a tree of merges; spectral clustering uses a graph's eigenvectors.", builds: "ch. 3 (mixtures), ch. 8 (EM), ch. 7 (eigenvectors)", sims: ["m21km", "m3gauss"] };

/* Murphy ch. 15 / D2L ch. 11: self-attention 3D matrix & multi-head routing */
lab("m15attn", {
  title: "Self-attention: the T × T lookup table in 3D", tab: "Self-attention", cam: [[0, 16, 15], [0, 0.8, 0]],
  how: "Six tokens sit along the rows (queries, asking) and columns (keys, answering): 'The trophy did not fit it'. Each tower at (row i, col j) has height αᵢⱼ = softmax(qᵢ·kⱼ / (T·√d))—how much token i reads from token j. Switch attention heads to see one head resolve what 'it' refers to ('trophy') while another tracks local neighbours or verb arguments. Turn on the causal mask (GPT style) and the upper triangle drops to zero because future tokens are hidden.",
  legend: () => `<b>Attention weights αᵢⱼ (each row sums to 1)</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>selected query row</span><span><i class="sw" style="background:var(--c4)"></i>other rows</span><span><i class="sw" style="background:var(--line)"></i>masked (future)</span></div>`,
  ctl: [
    { seg: "head", label: "Attention head", opts: [["coref", "Head 1: coreference ('it' → 'trophy')"], ["syntax", "Head 2: verb–object ('fit' ↔ 'trophy')"], ["local", "Head 3: local window"]], v: "coref" },
    { seg: "mask", label: "Mask", opts: [["bi", "Bidirectional (BERT)"], ["causal", "Causal mask j ≤ i (GPT)"]], v: "bi" },
    { s: "q", label: "Inspect query token i", min: 0, max: 5, step: 1, v: 5, fmt: i => ["0: The", "1: trophy", "2: did", "3: not", "4: fit", "5: it"][i] },
    { s: "temp", label: "Temperature T (× √d)", min: 0.2, max: 3, step: 0.05, v: 0.8, fmt: f2 }
  ],
  stats: [["top", "Top attended key"], ["ent", "Row entropy (bits)"], ["self", "Self-weight αᵢᵢ"]],
  toks: ["The", "trophy", "did", "not", "fit", "it"],
  rawScores(h) {
    if (h === "coref") return [
      [2.2, 1.4, 0.1, 0.0, 0.2, 0.1],
      [1.2, 2.5, 0.3, 0.1, 1.1, 1.8],
      [0.2, 1.5, 2.0, 1.4, 1.6, 0.3],
      [0.1, 0.4, 1.8, 2.1, 1.7, 0.2],
      [0.3, 2.4, 1.2, 1.3, 2.0, 1.9],
      [0.4, 3.4, 0.2, 0.2, 1.5, 1.2]
    ];
    if (h === "syntax") return [
      [1.8, 2.6, 0.2, 0.1, 0.3, 0.1],
      [1.9, 1.6, 0.8, 0.2, 2.7, 0.9],
      [0.2, 1.4, 1.8, 1.9, 2.5, 0.4],
      [0.1, 0.3, 2.2, 1.7, 2.4, 0.2],
      [0.3, 2.9, 1.5, 1.6, 1.8, 2.6],
      [0.2, 1.7, 0.4, 0.3, 2.8, 1.5]
    ];
    return Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => 2.5 - Math.abs(i - j) * 1.4));
  },
  matrix() {
    const S = this.rawScores(this.p.head), T = this.p.temp, causal = this.p.mask === "causal";
    return S.map((row, i) => {
      const z = row.map((v, j) => (causal && j > i) ? -1e9 : v / T);
      const m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b, 0);
      return e.map(v => v / s);
    });
  },
  change() { this.refresh(); },
  onPick(t) { if (t && t.qi != null) { this.p.q = t.qi; const el = $("#L-q"), o = $("#LO-q"); if (el) { el.value = t.qi; o.textContent = ["0: The", "1: trophy", "2: did", "3: not", "4: fit", "5: it"][t.qi]; } this.refresh(); } },
  onHover(t) { if (t && t.qi != null) { const A = this.matrix(); return `query "${this.toks[t.qi]}" → key "${this.toks[t.kj]}"\nweight α = ${pct(A[t.qi][t.kj])}`; } },
  refresh() {
    const A = this.matrix(), qi = this.p.q, row = A[qi];
    let bj = 0; row.forEach((v, j) => { if (v > row[bj]) bj = j; });
    const H = -row.reduce((s, p) => s + (p > 1e-9 ? p * Math.log2(p) : 0), 0);
    setS("top", `"${this.toks[bj]}" (${pct(row[bj])})`);
    setS("ent", f2(H) + " bits");
    setS("self", pct(row[qi]));
    labExtra(`<p style="margin:8px 0 0">Query <b>"${this.toks[qi]}"</b> sends ${row.map((w, j) => `${pct(w)} to "${this.toks[j]}"`).join(", ")}. ${this.p.mask === "causal" ? "With the causal mask on, each token can only attend to itself and earlier tokens (j ≤ i), so training all 6 next-token predictions in parallel never leaks future words (Murphy §15.5, D2L §11.5)." : "In bidirectional mode every token sees both left and right context (like BERT)."}</p>`);
  },
  draw() {
    const A = this.matrix(), qi = this.p.q, S = 1.65, causal = this.p.mask === "causal";
    for (let i = 0; i < 6; i++) {
      pin(-5.4, 0.25, (i - 2.5) * S, `q:${this.toks[i]}`, i === qi ? "hot" : "flat");
      pin((i - 2.5) * S, 0.25, -5.2, `k:${this.toks[i]}`, "flat");
      for (let j = 0; j < 6; j++) {
        const w = A[i][j], x = (j - 2.5) * S, z = (i - 2.5) * S, masked = causal && j > i;
        V.box(x, -0.08, z, S * 0.92, 0.06, S * 0.92, i === qi ? mix(C.c1, C.panel, 0.7) : ((i + j) & 1 ? C.panel : C.line), { qi: i, kj: j });
        if (masked) continue;
        const h = Math.max(0.08, w * 4.8);
        V.box(x, 0, z, S * 0.62, h, S * 0.62, i === qi ? C.c1 : C.c4, { qi: i, kj: j });
        if (i === qi && w > 0.08) Ln.seg((qi - 2.5) * S, A[qi][qi] * 4.8 + 0.3, z, x, h + 0.2, z, C.ink);
      }
    }
  },
  state() { const A = this.matrix(), qi = this.p.q; return `Self-attention (${this.p.head} head, ${this.p.mask} mask, T=${this.p.temp}), inspecting query "${this.toks[qi]}" with weights [${A[qi].map(pct).join(", ")}].`; }
});
