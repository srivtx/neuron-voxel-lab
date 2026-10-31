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

/* Murphy ch. 17 / D2L ch. 18 / Murphy 2 ch. 18: Kernel SVM & support vectors in 3D */
lab("m17svm", {
  title: "Kernels & SVMs: bend the boundary without building features", tab: "Kernel SVM", cam: [[0, 14, 19], [0, 1.8, 0]],
  how: "Orange (+1) and blue (−1) points sit on the floor; on the 'Ring' or 'XOR' datasets no straight line can separate them. Switch the kernel from Linear to Polynomial or RBF and watch the floating 3D sheet f(x) = Σₙ αₙ yₙ k(xₙ, x) + b lift the centre and carve a curved boundary. Points ringed in yellow are the support vectors (αₙ > 0): delete every other point and the boundary wouldn't move at all.",
  legend: () => `<b>Decision sheet σ(f(x)) & support vectors</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>class +1</span><span><i class="sw" style="background:var(--c2)"></i>class −1</span><span><i class="sw" style="background:var(--c4)"></i>support vector (αₙ > 0)</span></div>`,
  ctl: [
    { seg: "data", label: "Dataset", opts: [["ring", "Inner disc vs outer ring"], ["xor", "XOR quadrants"], ["lin", "Two blobs"]], v: "ring" },
    { seg: "kern", label: "Kernel", opts: [["rbf", "RBF exp(−‖x−x′‖²/2ℓ²)"], ["poly", "Polynomial (1 + x·x′)²"], ["lin", "Linear x·x′"]], v: "rbf" },
    { s: "ell", label: "RBF lengthscale ℓ", min: 0.25, max: 2.5, step: 0.05, v: 0.85, fmt: f2 },
    { s: "C", label: "Margin penalty C", min: 0.2, max: 10, step: 0.2, v: 3, fmt: f2 },
    { btns: [["new", "New sample", true]] }
  ],
  stats: [["acc", "Accuracy"], ["sv", "Support vectors"], ["kname", "Feature space"]],
  init() { this.seed = 7; this.make(); },
  act() { this.seed = (R0() * 1e9) | 0; this.make(); },
  change(k) { if (k === "data") this.make(); else this.fit(); },
  kfn(a, b) {
    if (this.p.kern === "lin") return a[0] * b[0] + a[1] * b[1];
    if (this.p.kern === "poly") { const d = 1 + a[0] * b[0] + a[1] * b[1]; return d * d; }
    const dx = a[0] - b[0], dy = a[1] - b[1], s2 = 2 * this.p.ell * this.p.ell;
    return Math.exp(-(dx * dx + dy * dy) / s2);
  },
  make() {
    const r = rng(this.seed), d = this.p.data, pts = [];
    for (let i = 0; i < 44; i++) {
      if (d === "ring") {
        const inner = i < 20, rad = inner ? r() * 0.95 : 1.55 + r() * 0.85, th = r() * Math.PI * 2;
        pts.push([rad * Math.cos(th), rad * Math.sin(th), inner ? 1 : -1]);
      } else if (d === "xor") {
        const sx = (i & 1) ? 1.15 : -1.15, sy = (i & 2) ? 1.15 : -1.15;
        pts.push([sx + randn(r) * 0.42, sy + randn(r) * 0.42, sx * sy > 0 ? 1 : -1]);
      } else {
        const c = i < 22 ? 1 : -1;
        pts.push([c * 1.1 + randn(r) * 0.65, c * 0.6 + randn(r) * 0.65, c]);
      }
    }
    this.pts = pts.map(([x, y, c]) => [clamp(x, -2.7, 2.7), clamp(y, -2.7, 2.7), c]);
    this.fit();
  },
  fit() {
    const P = this.pts, N = P.length, C = this.p.C, K = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => this.kfn(P[i], P[j])));
    const al = new Float64Array(N); let b = 0;
    for (let it = 0; it < 90; it++) {
      for (let i = 0; i < N; i++) {
        let f = b; for (let j = 0; j < N; j++) if (al[j] > 0) f += al[j] * P[j][2] * K[i][j];
        const g = 1 - P[i][2] * f, old = al[i];
        al[i] = clamp(old + g / (K[i][i] + 0.15), 0, C);
        b += 0.08 * P[i][2] * (al[i] - old);
      }
    }
    this.al = al; this.b = b;
    let ok = 0, sv = 0;
    for (let i = 0; i < N; i++) { if (al[i] > 0.04 * C) sv++; if ((this.score(P[i][0], P[i][1]) >= 0) === (P[i][2] === 1)) ok++; }
    this.acc = ok / N; this.svCount = sv; this.refresh();
  },
  score(x, y) { let s = this.b; for (let i = 0; i < this.pts.length; i++) if (this.al[i] > 1e-4) s += this.al[i] * this.pts[i][2] * this.kfn(this.pts[i], [x, y]); return s; },
  refresh() {
    if (!this.pts) return;
    setS("acc", pct(this.acc)); setS("sv", `${this.svCount} of ${this.pts.length}`);
    setS("kname", this.p.kern === "rbf" ? "∞-dim bumps" : this.p.kern === "poly" ? "6-dim quadratics" : "2-dim plane");
    labExtra(`<p style="margin:8px 0 0">The prediction at x only uses dot products via k(xₙ, x) and only sums over the <b>${this.svCount} support vectors</b> with αₙ > 0 (yellow rings). ${this.p.kern === "rbf" ? `With ℓ = ${f2(this.p.ell)}, each support vector places a Gaussian bump of width ℓ; shrink ℓ and the sheet turns into isolated spikes around each point (overfitting), widen ℓ and it flattens toward a plane (Murphy §17.1–17.3).` : this.p.kern === "poly" ? "The degree-2 kernel (1 + x·x′)² implicitly lifts (x₁, x₂) into (1, √2x₁, √2x₂, x₁², √2x₁x₂, x₂²) where rings and XOR become linearly separable!" : "A linear kernel can only tilt a flat plane, so it fails on concentric rings and XOR."}</p>`);
  },
  draw() {
    const G = 24, cs = 11.5 / G, Cmax = this.p.C;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
      const x = -2.8 + (i + 0.5) * 5.6 / G, y = -2.8 + (j + 0.5) * 5.6 / G, p = sig(this.score(x, y) * 1.6);
      V.box(x * 2, p * 3.8, -y * 2, cs * 0.58, 0.14, cs * 0.58, mix3(C.c2, C.card, C.c1, p), null);
      V.box(x * 2, -0.08, -y * 2, cs * 0.95, 0.06, cs * 0.95, (i + j) & 1 ? C.panel : C.line, null);
    }
    this.pts.forEach(([x, y, c], i) => {
      const isSV = this.al[i] > 0.04 * Cmax, yy = (c > 0 ? 3.8 : 0) + 0.12;
      if (isSV) V.box(x * 2, yy - 0.08, -y * 2, 0.52, 0.1, 0.52, C.c4, null);
      V.box(x * 2, yy, -y * 2, 0.28, 0.28, 0.28, c > 0 ? C.c1 : C.c2, null);
    });
  },
  state() { return `Kernel SVM (${this.p.kern} kernel, dataset ${this.p.data}, ℓ=${this.p.ell}, C=${this.p.C}): ${this.svCount}/${this.pts.length} support vectors, accuracy ${pct(this.acc)}.`; }
});

/* Murphy ch. 18: Decision trees, random forests & gradient boosting in 3D */
lab("m18tree", {
  title: "Trees, random forests & boosting: axis-aligned steps in 3D", tab: "Trees & ensembles", cam: [[0, 15, 19], [0, 1.8, 0]],
  how: "A decision tree cuts space parallel to the axes and predicts the average in each box—so its 3D surface is a staircase of flat rectangles. A deep single tree memorises noisy points (spiky towers). Switch to Random Forest to average M bootstrapped trees (smoothing out the spikes and cutting variance), or to Gradient Boosting where each shallow tree fits the residual errors left by the previous ones.",
  legend: () => `<b>Predicted surface in 3D</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>high target</span><span><i class="sw" style="background:var(--c2)"></i>low target</span><span>cubes = training points</span></div>`,
  ctl: [
    { seg: "mode", label: "Method", opts: [["tree", "Single tree"], ["rf", "Random forest (bagging)"], ["boost", "Gradient boosting (residuals)"]], v: "tree" },
    { s: "depth", label: "Max tree depth", min: 1, max: 6, step: 1, v: 3 },
    { s: "M", label: "Number of trees M", min: 1, max: 20, step: 1, v: 10 },
    { s: "noise", label: "Data noise σ", min: 0, max: 0.45, step: 0.05, v: 0.18, fmt: f2 },
    { btns: [["new", "New random sample", true]] }
  ],
  stats: [["tr", "Train MSE"], ["te", "Test MSE"], ["leaves", "Leaves per tree"]],
  chart: "Train (orange) vs test (teal) MSE as trees are added",
  chartLegend: `<span><i style="background:var(--c1)"></i>train MSE</span><span><i style="background:var(--c2)"></i>test MSE</span>`,
  init() { this.seed = 11; this.make(); },
  act() { this.seed = (R0() * 1e9) | 0; this.make(); },
  change(k) { if (k === "noise") this.make(); else this.fit(); },
  tfn(x, y) { return 0.5 + 0.35 * Math.sin(x * 1.1) * Math.cos(y * 1.1) + (x + y > 0 ? 0.22 : -0.22); },
  make() {
    const r = rng(this.seed);
    this.tr = Array.from({ length: 55 }, () => { const x = (r() - 0.5) * 5.2, y = (r() - 0.5) * 5.2; return [x, y, clamp(this.tfn(x, y) + randn(r) * this.p.noise, 0.02, 0.98)]; });
    this.te = Array.from({ length: 80 }, () => { const x = (r() - 0.5) * 5.2, y = (r() - 0.5) * 5.2; return [x, y, clamp(this.tfn(x, y) + randn(r) * this.p.noise, 0.02, 0.98)]; });
    this.fit();
  },
  buildTree(pts, depth) {
    const mean = pts.reduce((s, p) => s + p[2], 0) / (pts.length || 1);
    if (depth <= 0 || pts.length < 4) return { leaf: true, v: mean, n: 1 };
    let best = null, bv = Infinity;
    for (let dim = 0; dim < 2; dim++) {
      for (let t = -2.2; t <= 2.2; t += 0.4) {
        const L = pts.filter(p => p[dim] <= t), R = pts.filter(p => p[dim] > t);
        if (L.length < 2 || R.length < 2) continue;
        const mL = L.reduce((s, p) => s + p[2], 0) / L.length, mR = R.reduce((s, p) => s + p[2], 0) / R.length;
        const sse = L.reduce((s, p) => s + (p[2] - mL) ** 2, 0) + R.reduce((s, p) => s + (p[2] - mR) ** 2, 0);
        if (sse < bv) { bv = sse; best = { dim, t, L, R }; }
      }
    }
    if (!best) return { leaf: true, v: mean, n: 1 };
    const l = this.buildTree(best.L, depth - 1), r = this.buildTree(best.R, depth - 1);
    return { dim: best.dim, t: best.t, l, r, n: l.n + r.n };
  },
  evalTree(node, x, y) { while (!node.leaf) node = (node.dim === 0 ? x : y) <= node.t ? node.l : node.r; return node.v; },
  fit() {
    const m = this.p.mode, d = this.p.depth, M = m === "tree" ? 1 : this.p.M, r = rng(this.seed + 99);
    this.trees = []; this.weights = []; this.base = 0; this.curve = [];
    if (m === "tree") {
      const T = this.buildTree(this.tr, d); this.trees = [T]; this.weights = [1];
    } else if (m === "rf") {
      for (let k = 0; k < M; k++) {
        const boot = Array.from({ length: this.tr.length }, () => this.tr[(r() * this.tr.length) | 0]);
        this.trees.push(this.buildTree(boot, d)); this.weights.push(1 / M);
      }
    } else {
      this.base = this.tr.reduce((s, p) => s + p[2], 0) / this.tr.length;
      const res = this.tr.map(p => [p[0], p[1], p[2] - this.base]);
      const lr = 0.35;
      for (let k = 0; k < M; k++) {
        const T = this.buildTree(res, d); this.trees.push(T); this.weights.push(lr);
        for (const p of res) p[2] -= lr * this.evalTree(T, p[0], p[1]);
      }
    }
    for (let k = 1; k <= this.trees.length; k++) {
      const pr = (x, y) => { let s = this.base; for (let i = 0; i < k; i++) s += (m === "rf" ? 1 / k : this.weights[i]) * this.evalTree(this.trees[i], x, y); return s; };
      this.curve.push([this.tr.reduce((s, p) => s + (pr(p[0], p[1]) - p[2]) ** 2, 0) / this.tr.length, this.te.reduce((s, p) => s + (pr(p[0], p[1]) - p[2]) ** 2, 0) / this.te.length]);
    }
    this.refresh();
  },
  pred(x, y) { let s = this.base; for (let i = 0; i < this.trees.length; i++) s += this.weights[i] * this.evalTree(this.trees[i], x, y); return clamp(s, 0, 1); },
  refresh() {
    if (!this.trees || !this.trees.length) return;
    const last = this.curve[this.curve.length - 1];
    setS("tr", f3(last[0])); setS("te", f3(last[1])); setS("leaves", this.trees[0].n);
    if (cur === this) lineChart($("#lab-chart"), [{ data: this.curve.map(c => c[0]), color: tok("--c1") }, { data: this.curve.map(c => c[1]), color: tok("--c2") }], { ymin: 0, xlabel: this.p.mode === "tree" ? "single tree" : `trees 1 → ${this.trees.length}` });
    labExtra(`<p style="margin:8px 0 0">${this.p.mode === "tree" ? "A single tree partitions the plane into up to 2^depth axis-aligned rectangles. Raise depth to 6: training MSE drops near 0, but test MSE jumps as tiny rectangles fit noise (Murphy §18.1)." : this.p.mode === "rf" ? `Random forest averages ${this.trees.length} trees trained on bootstrap resamples. Because each tree's staircase jumps in slightly different places, their average is smoother and has lower test MSE (Murphy §18.2–18.3).` : `Gradient boosting starts from the constant mean ${f2(this.base)} and adds ${this.trees.length} trees with step size ν = 0.35, each fitted to the remaining residuals y − F_{m−1}(x) (Murphy §18.4).`}</p>`);
  },
  draw() {
    const G = 24, cs = 11.2 / G;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
      const x = -2.6 + (i + 0.5) * 5.2 / G, y = -2.6 + (j + 0.5) * 5.2 / G, v = this.pred(x, y);
      V.box(x * 2, 0, -y * 2, cs * 0.92, 0.1 + v * 3.6, cs * 0.92, mix3(C.c2, C.card, C.c1, v), null);
    }
    for (const [x, y, v] of this.tr) V.box(x * 2, v * 3.6 + 0.12, -y * 2, 0.25, 0.25, 0.25, C.ink, null);
  },
  state() { const last = this.curve ? this.curve[this.curve.length - 1] : [0, 0]; return `Trees lab (${this.p.mode}, depth=${this.p.depth}, M=${this.trees ? this.trees.length : 1}): train MSE ${f3(last[0])}, test MSE ${f3(last[1])}.`; }
});

/* Murphy 2 ch. 8 & 29: Kalman filter tracking & sensor fusion in 3D */
lab("a8kalman", {
  title: "Kalman filter: predict, measure, and fuse uncertainties", tab: "Kalman filter", cam: [[0, 16, 17], [0, 0.8, 0]],
  how: "A target moves along a curved 2D path (green), but your sensor only sees noisy GPS pings (blue cubes). At each step the Kalman filter predicts where the target moved (widening its 3D Gaussian belief bell by process noise Q), then blends that prediction with the new GPS ping using the Kalman gain K = P_pred / (P_pred + R). Watch the orange filtered track stay far closer to the truth than the raw sensor.",
  legend: () => `<b>2D trajectory + 3D posterior belief bell</b><div class="row"><span><i class="sw" style="background:var(--c3)"></i>true path</span><span><i class="sw" style="background:var(--c2)"></i>noisy GPS</span><span><i class="sw" style="background:var(--c1)"></i>Kalman estimate + belief bell</span></div>`,
  ctl: [
    { s: "Q", label: "Motion model noise Q", min: 0.02, max: 0.8, step: 0.02, v: 0.12, fmt: f2 },
    { s: "R", label: "Sensor GPS noise R", min: 0.05, max: 1.5, step: 0.05, v: 0.65, fmt: f2 },
    { btns: [["step", "1 step (predict + update)", true], ["run", "Run all 24 steps"], ["reset", "New trajectory"]] }
  ],
  stats: [["K", "Kalman gain K"], ["rawE", "Raw GPS RMSE"], ["kfE", "Kalman RMSE"]],
  chart: "Distance from truth: raw GPS (blue) vs Kalman filter (orange)",
  chartLegend: `<span><i style="background:var(--c2)"></i>raw sensor error</span><span><i style="background:var(--c1)"></i>Kalman error</span>`,
  init() { this.seed = 21; this.reset(); },
  reset() {
    const r = rng(this.seed);
    this.truth = []; this.obs = []; this.est = []; this.P = 0.4; this.K = 0.5;
    let x = -2.6, y = -1.6;
    for (let t = 0; t < 24; t++) {
      const th = t * 0.22;
      x += 0.22 * Math.cos(th * 0.7) + randn(r) * Math.sqrt(this.p.Q) * 0.35;
      y += 0.22 * Math.sin(th) + randn(r) * Math.sqrt(this.p.Q) * 0.35;
      x = clamp(x, -3.2, 3.2); y = clamp(y, -3.2, 3.2);
      this.truth.push([x, y]);
      this.obs.push([x + randn(r) * Math.sqrt(this.p.R), y + randn(r) * Math.sqrt(this.p.R)]);
    }
    this.est = [[this.obs[0][0], this.obs[0][1]]];
    this.P = this.p.R;
    for (let t = 1; t < 10; t++) this.stepOne();
    this.refresh();
  },
  stepOne() {
    const t = this.est.length; if (t >= this.truth.length) return;
    const prev = this.est[t - 1], th = t * 0.22;
    const xp = [prev[0] + 0.22 * Math.cos(th * 0.7), prev[1] + 0.22 * Math.sin(th)];
    const Ppred = this.P + this.p.Q;
    const K = Ppred / (Ppred + this.p.R);
    const y = this.obs[t];
    this.est.push([xp[0] + K * (y[0] - xp[0]), xp[1] + K * (y[1] - xp[1])]);
    this.P = (1 - K) * Ppred; this.K = K;
  },
  act(a) { if (a === "step") this.stepOne(); else if (a === "run") while (this.est.length < this.truth.length) this.stepOne(); else { this.seed = (R0() * 1e9) | 0; this.reset(); return; } this.refresh(); },
  change() { const n = this.est.length; this.reset(); while (this.est.length < n) this.stepOne(); this.refresh(); },
  refresh() {
    const n = this.est.length, rErr = [], kErr = [];
    for (let i = 0; i < n; i++) {
      rErr.push(Math.hypot(this.obs[i][0] - this.truth[i][0], this.obs[i][1] - this.truth[i][1]));
      kErr.push(Math.hypot(this.est[i][0] - this.truth[i][0], this.est[i][1] - this.truth[i][1]));
    }
    const rmse = arr => Math.sqrt(arr.reduce((s, v) => s + v * v, 0) / (arr.length || 1));
    setS("K", f2(this.K)); setS("rawE", f2(rmse(rErr))); setS("kfE", f2(rmse(kErr)));
    if (cur === this) lineChart($("#lab-chart"), [{ data: rErr, color: tok("--c2") }, { data: kErr, color: tok("--c1") }], { ymin: 0, xlabel: `step 1 → ${n}` });
    labExtra(`<p style="margin:8px 0 0">At step ${n}, Kalman gain K = P_pred / (P_pred + R) = <b>${f2(this.K)}</b>: the filter puts ${pct(this.K)} weight on the new GPS measurement and ${pct(1 - this.K)} on its motion prediction. Raise sensor noise R and K shrinks toward 0 (smooth track, trusts physics); raise Q and K approaches 1 (trusts the sensor, Murphy 2 §8.2).</p>`);
  },
  draw() {
    const S = 1.85, n = this.est.length, curEst = this.est[n - 1], sig2 = Math.max(0.08, this.P * 2.2);
    for (let i = 0; i < 18; i++) for (let j = 0; j < 18; j++) {
      const gx = -3.2 + (i + 0.5) * 6.4 / 18, gy = -3.2 + (j + 0.5) * 6.4 / 18;
      const d2 = (gx - curEst[0]) ** 2 + (gy - curEst[1]) ** 2, bh = Math.exp(-d2 / (2 * sig2)) * 2.4;
      V.box(gx * S, -0.08, -gy * S, 0.62, 0.06 + bh, 0.62, bh > 0.18 ? mix(C.c1, C.panel, 0.45) : ((i + j) & 1 ? C.panel : C.line), null);
    }
    for (let i = 0; i < n; i++) {
      const [tx, ty] = this.truth[i], [ox, oy] = this.obs[i], [ex, ey] = this.est[i];
      V.box(tx * S, 0.15, -ty * S, 0.24, 0.24, 0.24, C.c3, null);
      V.box(ox * S, 0.15, -oy * S, 0.22, 0.22, 0.22, C.c2, null);
      V.box(ex * S, 0.28, -ey * S, 0.3, 0.3, 0.3, C.c1, null);
      if (i > 0) {
        Ln.seg(this.truth[i - 1][0] * S, 0.22, -this.truth[i - 1][1] * S, tx * S, 0.22, -ty * S, C.c3);
        Ln.seg(this.est[i - 1][0] * S, 0.38, -this.est[i - 1][1] * S, ex * S, 0.38, -ey * S, C.c1);
      }
    }
    pin(curEst[0] * S, 2.8, -curEst[1] * S, `x̂_${n} (K=${f2(this.K)})`, "hot");
  },
  state() { return `Kalman filter lab (Q=${this.p.Q}, R=${this.p.R}, step ${this.est.length}/${this.truth.length}): Kalman gain K=${f2(this.K)}, posterior var P=${f3(this.P)}.`; }
});

/* Murphy 2 ch. 10, 11, 12: MCMC (Metropolis-Hastings) on a two-mode 3D posterior */
lab("a12mcmc", {
  title: "MCMC: sample a two-peak posterior knowing only ratios", tab: "MCMC sampler", cam: [[0, 16, 17], [0, 1.2, 0]],
  how: "The teal terrain is an unnormalised target p̃(x) with two peaks (30% left, 70% right). Metropolis–Hastings proposes a Gaussian step of size σ and accepts with probability min(1, p̃(x′)/p̃(x)). Try σ = 0.15 (high acceptance, but trapped in one peak) vs σ = 2.8 (almost every jump lands in the flat desert and is rejected) vs σ ≈ 0.9 (crosses between peaks in the right 30/70 ratio).",
  legend: () => `<b>Target density p̃(x) & Markov chain visits</b><div class="row"><span><i class="sw" style="background:var(--c2)"></i>target p̃(x)</span><span><i class="sw" style="background:var(--c1)"></i>visited samples</span><span><i class="sw" style="background:var(--c4)"></i>current state</span></div>`,
  ctl: [
    { s: "sig", label: "Proposal step size σ", min: 0.1, max: 3, step: 0.05, v: 0.85, fmt: f2 },
    { s: "sep", label: "Peak separation", min: 0.8, max: 2.4, step: 0.1, v: 1.5, fmt: f2 },
    { btns: [["one", "1 step", true], ["h100", "100 steps"], ["h500", "500 steps"], ["reset", "Reset chain"]] }
  ],
  stats: [["n", "Samples"], ["acc", "Accept rate"], ["right", "In right peak (true ≈ 70%)"]],
  chart: "Trace plot of coordinate x₁ over time (crossing 0 = mode jump)",
  chartLegend: `<span><i style="background:var(--c1)"></i>x₁(t) trace</span>`,
  init() { this.r = rng(33); this.reset(); },
  target(x, y) {
    const d = this.p.sep;
    const g1 = 0.3 * Math.exp(-((x + d) ** 2 + (y + 0.4) ** 2) / 0.55);
    const g2 = 0.7 * Math.exp(-((x - d) ** 2 + (y - 0.4) ** 2) / 0.65);
    return g1 + g2 + 1e-12;
  },
  reset() {
    this.cur = [-this.p.sep, -0.4]; this.samples = [this.cur.slice()]; this.acc = 0; this.tries = 0;
    for (let i = 0; i < 60; i++) this.stepOne();
    this.refresh();
  },
  stepOne() {
    const [x, y] = this.cur, s = this.p.sig, xp = x + randn(this.r) * s, yp = y + randn(this.r) * s;
    const a = Math.min(1, this.target(xp, yp) / this.target(x, y));
    this.tries++;
    if (this.r() < a) { this.cur = [clamp(xp, -3.4, 3.4), clamp(yp, -3.4, 3.4)]; this.acc++; }
    this.samples.push(this.cur.slice());
  },
  act(a) {
    if (a === "one") this.stepOne();
    else if (a === "h100") for (let i = 0; i < 100; i++) this.stepOne();
    else if (a === "h500") for (let i = 0; i < 500; i++) this.stepOne();
    else { this.reset(); return; }
    this.refresh();
  },
  change(k) { if (k === "sep") this.reset(); else this.refresh(); },
  refresh() {
    const n = this.samples.length, ar = this.tries ? this.acc / this.tries : 1;
    const right = this.samples.filter(p => p[0] > 0).length / n;
    setS("n", n); setS("acc", pct(ar)); setS("right", pct(right));
    if (cur === this) lineChart($("#lab-chart"), [{ data: this.samples.slice(-240).map(p => p[0]), color: tok("--c1") }], { ymin: -3, ymax: 3, xlabel: `last ${Math.min(240, n)} steps (x₁)` });
    labExtra(`<p style="margin:8px 0 0">Notice that target(x) is never normalised—yet the chain spends ${pct(right)} of its time in the right peak (true mass ≈ 70%). ${this.p.sig < 0.35 ? "With a tiny step size σ, almost every proposal is accepted, but the chain takes forever to cross the valley between peaks (high autocorrelation, Murphy 2 §12.2.3)." : this.p.sig > 2 ? "With a huge σ, proposals jump far out into zero-density space and get rejected, so the chain freezes in place." : "A balanced σ (~25–50% acceptance) mixes smoothly across both peaks."}</p>`);
  },
  draw() {
    const G = 20, S = 1.75, cs = (6.4 * S) / G;
    const counts = new Uint16Array(G * G);
    for (const [x, y] of this.samples) {
      const i = clamp(((x + 3.2) / 6.4 * G) | 0, 0, G - 1), j = clamp(((y + 3.2) / 6.4 * G) | 0, 0, G - 1);
      counts[i * G + j]++;
    }
    const maxC = Math.max(1, ...counts);
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
      const x = -3.2 + (i + 0.5) * 6.4 / G, y = -3.2 + (j + 0.5) * 6.4 / G;
      const p = this.target(x, y), hT = p * 3.8, c = counts[i * G + j], hC = (c / maxC) * 3.2;
      V.box(x * S, 0, -y * S, cs * 0.9, 0.06 + hT, cs * 0.9, p > 0.08 ? mix(C.c2, C.panel, 0.35) : ((i + j) & 1 ? C.panel : C.line), null);
      if (c > 0) V.box(x * S, hT + 0.08, -y * S, cs * 0.52, Math.max(0.14, hC), cs * 0.52, C.c1, null);
    }
    const tail = this.samples.slice(-18);
    for (let k = 1; k < tail.length; k++) {
      const [x0, y0] = tail[k - 1], [x1, y1] = tail[k];
      Ln.seg(x0 * S, this.target(x0, y0) * 3.8 + 0.5, -y0 * S, x1 * S, this.target(x1, y1) * 3.8 + 0.5, -y1 * S, C.ink);
    }
    const [cx, cy] = this.cur, ch = this.target(cx, cy) * 3.8 + 0.6;
    V.box(cx * S, ch, -cy * S, 0.44, 0.44, 0.44, C.c4, null);
    pin(cx * S, ch + 0.8, -cy * S, "xₜ", "hot");
  },
  state() { const n = this.samples.length; return `MCMC lab (σ=${this.p.sig}, separation=${this.p.sep}, ${n} samples): accept rate ${pct(this.acc / Math.max(1, this.tries))}.`; }
});

/* Murphy 2 ch. 20, 21, 25: Diffusion forward noising & reverse score denoising in 3D */
lab("a25diff", {
  title: "Diffusion models: melt data into noise, then follow the score back", tab: "Diffusion & score", cam: [[0, 16, 17], [0, 0.8, 0]],
  how: "120 points start on a clean S-curve manifold (t = 0). Slide t toward 50 to apply the closed-form forward jump xₜ = √ᾱₜ x₀ + √(1 − ᾱₜ) ε: the curve dissolves into a featureless N(0, I) cloud. The green arrows show the score field ∇ₓ log pₜ(xₜ) (which equals −ε / √(1 − ᾱₜ)): each arrow points straight back toward the data manifold. Click 'Reverse denoise step' to walk from noise back to structure.",
  legend: () => `<b>Particles xₜ & score arrows ∇ₓ log pₜ(x)</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>current particles xₜ</span><span><i class="sw" style="background:var(--c3)"></i>score vector (−predicted ε)</span><span><i class="sw" style="background:var(--muted)"></i>clean manifold x₀</span></div>`,
  ctl: [
    { s: "t", label: "Diffusion step t (0 = clean, 50 = pure noise)", min: 0, max: 50, step: 1, v: 18 },
    { seg: "arrows", label: "Score arrows", opts: [["on", "Show score ∇ log pₜ(x)"], ["off", "Hide arrows"]], v: "on" },
    { btns: [["denoise1", "← 1 reverse denoise step", true], ["denoiseAll", "Denoise to t = 0"], ["toNoise", "Jump to pure noise (t = 50)"], ["resample", "New noise ε"]] }
  ],
  stats: [["ab", "Signal weight ᾱₜ"], ["snr", "SNR = ᾱₜ/(1−ᾱₜ)"], ["mse", "Distance from manifold"]],
  init() { this.seed = 42; this.make(); },
  abar(t) { const u = t / 50; return Math.cos(u * Math.PI * 0.49) ** 2; },
  make() {
    const r = rng(this.seed);
    this.x0 = []; this.eps = [];
    for (let i = 0; i < 110; i++) {
      const s = (i / 109) * 2 - 1, x = s * 2.4, y = Math.sin(s * Math.PI * 1.15) * 1.65;
      this.x0.push([x, y]);
      this.eps.push([randn(r), randn(r)]);
    }
    this.refresh();
  },
  setT(t) {
    this.p.t = clamp(t, 0, 50);
    const el = $("#L-t"), o = $("#LO-t"); if (el) { el.value = this.p.t; o.textContent = this.p.t; }
    this.refresh();
  },
  act(a) {
    if (a === "denoise1") this.setT(Math.max(0, this.p.t - 5));
    else if (a === "denoiseAll") this.setT(0);
    else if (a === "toNoise") this.setT(50);
    else { this.seed = (R0() * 1e9) | 0; this.make(); }
  },
  change() { this.refresh(); },
  ptsAt(t) {
    const ab = this.abar(t), sa = Math.sqrt(ab), sn = Math.sqrt(1 - ab);
    return this.x0.map(([x, y], i) => [sa * x + sn * this.eps[i][0], sa * y + sn * this.eps[i][1]]);
  },
  refresh() {
    if (!this.x0) return;
    const t = this.p.t, ab = this.abar(t), snr = ab / Math.max(1e-4, 1 - ab), pts = this.ptsAt(t);
    const d2 = pts.reduce((s, [x, y], i) => s + (x - this.x0[i][0]) ** 2 + (y - this.x0[i][1]) ** 2, 0) / pts.length;
    setS("ab", f3(ab)); setS("snr", t === 0 ? "∞" : f2(snr)); setS("mse", f3(d2));
    labExtra(`<p style="margin:8px 0 0">At step t = ${t}, <b>√ᾱₜ = ${f2(Math.sqrt(ab))}</b> of the clean signal x₀ remains and <b>√(1−ᾱₜ) = ${f2(Math.sqrt(1 - ab))}</b> is Gaussian noise ε. Training a neural network ε_θ(xₜ, t) to predict the noise ε that was added is mathematically identical to learning the score ∇ₓ log pₜ(xₜ) = −ε / √(1 − ᾱₜ) (Tweedie's identity, Murphy 2 §25.2–25.3).</p>`);
  },
  draw() {
    const S = 1.9, t = this.p.t, ab = this.abar(t), sn = Math.sqrt(1 - ab), pts = this.ptsAt(t);
    for (let i = 0; i < 18; i++) for (let j = 0; j < 18; j++) V.box((i - 8.5) * 0.72, -0.08, (j - 8.5) * 0.72, 0.7, 0.06, 0.7, (i + j) & 1 ? C.panel : C.line, null);
    for (let i = 1; i < this.x0.length; i++) {
      const [a0, b0] = this.x0[i - 1], [a1, b1] = this.x0[i];
      Ln.seg(a0 * S, 0.05, -b0 * S, a1 * S, 0.05, -b1 * S, C.muted);
    }
    pts.forEach(([x, y], i) => {
      const xc = clamp(x, -3.3, 3.3) * S, zc = -clamp(y, -3.3, 3.3) * S;
      V.box(xc, 0.1, zc, 0.25, 0.35 + (1 - t / 50) * 0.5, 0.25, mix3(C.c2, C.c4, C.c1, i / pts.length), null);
      if (this.p.arrows === "on" && t > 0 && (i % 3 === 0)) {
        const dx = (this.x0[i][0] - x) * 0.45 * S, dz = -(this.x0[i][1] - y) * 0.45 * S;
        Ln.seg(xc, 0.45, zc, xc + dx, 0.45, zc + dz, C.c3);
      }
    });
  },
  state() { const ab = this.abar(this.p.t); return `Diffusion lab at step t=${this.p.t}/50, ᾱ_t=${f3(ab)}, SNR=${f2(ab / Math.max(1e-4, 1 - ab))}.`; }
});

/* D2L ch. 17 / Murphy 2 ch. 34 & 35: MDP Gridworld Value Iteration & Policy Arrows in 3D */
lab("a35rl", {
  title: "Bellman backups in 3D: watch value flow back from the goal", tab: "MDP & Bellman", cam: [[0, 16, 15], [0, 1, 0]],
  how: "The green corner is the Goal (+10); the red tile next to it is a Pit (−10); dark blocks are walls. Every non-terminal tile's tower height is its value V(s), and the black line shows its best action π*(s). Click '1 Bellman backup' repeatedly to watch reward propagate one square per step backwards from the goal. Then raise 'Slip probability' and watch the optimal policy detour around the pit instead of walking along its cliff!",
  legend: () => `<b>State values V(s) & greedy policy π*(s)</b><div class="row"><span><i class="sw" style="background:var(--c3)"></i>goal (+10)</span><span><i class="sw" style="background:var(--c1)"></i>pit (−10)</span><span><i class="sw" style="background:var(--c4)"></i>positive V(s)</span></div>`,
  ctl: [
    { s: "gam", label: "Discount factor γ", min: 0.2, max: 0.99, step: 0.01, v: 0.9, fmt: f2 },
    { s: "stepR", label: "Step cost r_step", min: -1.5, max: 0, step: 0.05, v: -0.2, fmt: f2 },
    { s: "slip", label: "Slip probability", min: 0, max: 0.5, step: 0.05, v: 0.1, fmt: f2 },
    { btns: [["one", "1 Bellman step", true], ["conv", "Run to convergence"], ["zero", "Reset V(s) = 0"]] }
  ],
  stats: [["it", "Backups"], ["v0", "Start value V(0,0)"], ["dmax", "Max |ΔV|"]],
  init() { this.zero(); for (let i = 0; i < 12; i++) this.backup(); this.refresh(); },
  isWall(r, c) { return (r === 1 && c === 2) || (r === 2 && c === 2); },
  isTerm(r, c) { return (r === 4 && c === 4) || (r === 3 && c === 3); },
  zero() {
    this.V = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => (r === 4 && c === 4) ? 10 : (r === 3 && c === 3) ? -10 : 0));
    this.pi = Array.from({ length: 5 }, () => new Array(5).fill(0));
    this.it = 0; this.dmax = 0;
  },
  stepDest(r, c, a) {
    const dr = [0, 1, 0, -1][a], dc = [1, 0, -1, 0][a], nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5 || this.isWall(nr, nc)) return [r, c];
    return [nr, nc];
  },
  qVal(r, c, a) {
    const ps = this.p.slip, main = 1 - ps, side = ps / 2, gam = this.p.gam, sr = this.p.stepR;
    let q = 0;
    for (const [act, prob] of [[a, main], [(a + 1) % 4, side], [(a + 3) % 4, side]]) {
      const [nr, nc] = this.stepDest(r, c, act);
      q += prob * (sr + gam * this.V[nr][nc]);
    }
    return q;
  },
  backup() {
    const nextV = this.V.map(row => row.slice()); let dm = 0;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      if (this.isWall(r, c) || this.isTerm(r, c)) continue;
      let bestQ = -Infinity, bestA = 0;
      for (let a = 0; a < 4; a++) { const q = this.qVal(r, c, a); if (q > bestQ) { bestQ = q; bestA = a; } }
      dm = Math.max(dm, Math.abs(bestQ - this.V[r][c]));
      nextV[r][c] = bestQ; this.pi[r][c] = bestA;
    }
    this.V = nextV; this.it++; this.dmax = dm;
  },
  act(a) {
    if (a === "one") this.backup();
    else if (a === "conv") for (let i = 0; i < 60; i++) { this.backup(); if (this.dmax < 1e-5) break; }
    else this.zero();
    this.refresh();
  },
  change() { const k = Math.max(1, this.it); this.zero(); for (let i = 0; i < k; i++) this.backup(); this.refresh(); },
  onHover(t) { if (t && t.r != null) return `state (${t.r}, ${t.c})\nV(s) = ${f2(this.V[t.r][t.c])}`; },
  refresh() {
    if (!this.V) return;
    setS("it", this.it); setS("v0", f2(this.V[0][0])); setS("dmax", f3(this.dmax));
    labExtra(`<p style="margin:8px 0 0">Each Bellman backup sets V(s) ← maxₐ E[r + γ V(s′)]. After k backups from zero, states k steps from the goal learn their value. ${this.p.slip >= 0.25 ? "With high slip noise, walking past (4,3) risks slipping into the −10 pit at (3,3), so the optimal policy takes the longer safe route around the left side of the wall!" : "With low slip noise, the agent takes the shortest path right past the pit (D2L §17.2, Murphy 2 §34.5)."}</p>`);
  },
  draw() {
    const S = 1.9;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const x = (c - 2) * S, z = (2 - r) * S;
      V.box(x, -0.08, z, S * 0.92, 0.06, S * 0.92, (r + c) & 1 ? C.panel : C.line, { r, c });
      if (this.isWall(r, c)) { V.box(x, 0, z, S * 0.82, 1.5, S * 0.82, C.ink, { r, c }); continue; }
      const v = this.V[r][c], isGoal = r === 4 && c === 4, isPit = r === 3 && c === 3;
      const h = Math.max(0.14, (clamp(v, -10, 10) + 10) * 0.22);
      const col = isGoal ? C.c3 : isPit ? C.c1 : mix3(C.c2, C.card, C.c4, clamp((v + 6) / 16, 0, 1));
      V.box(x, 0, z, S * 0.72, h, S * 0.72, col, { r, c });
      if (isGoal) pin(x, h + 0.5, z, "+10 Goal", "ok");
      else if (isPit) pin(x, h + 0.5, z, "−10 Pit", "hot");
      else if (this.it > 0) {
        const a = this.pi[r][c], dx = [1, 0, -1, 0][a] * 0.55, dz = [0, -1, 0, 1][a] * 0.55;
        Ln.seg(x, h + 0.12, z, x + dx, h + 0.12, z + dz, C.ink);
        V.box(x + dx, h + 0.08, z + dz, 0.18, 0.18, 0.18, C.ink, { r, c });
      }
    }
  },
  state() { return `MDP Gridworld (γ=${this.p.gam}, stepR=${this.p.stepR}, slip=${this.p.slip}, ${this.it} backups): V(0,0)=${f2(this.V[0][0])}.`; }
});

/* Murphy 2 ch. 4 & 36: Causality, confounding & do-calculus in 3D */
lab("a36causal", {
  title: "Seeing vs doing: P(Y | X) vs P(Y | do(X)) in 3D", tab: "Causality & do(X)", cam: [[0, 14, 18], [0, 1.8, 0]],
  how: "Four towers on the left show recovery rates for Mild (front) and Severe (back) patients, Untreated (blue) vs Treated (orange). Within BOTH mild and severe groups, the orange tower is taller—the drug helps everyone! Yet in Observational mode, doctors give the drug mostly to severe patients, so the overall Treated average (right) is dragged down below Untreated. Switch to Interventional do(X) to cut the Z → X confounder arrow and reveal the true causal effect.",
  legend: () => `<b>Recovery rate (height) & group share (width)</b><div class="row"><span><i class="sw" style="background:var(--c2)"></i>no drug (X=0)</span><span><i class="sw" style="background:var(--c1)"></i>drug (X=1)</span><span><i class="sw" style="background:var(--c3)"></i>true causal boost</span></div>`,
  ctl: [
    { seg: "mode", label: "Query", opts: [["obs", "Observational P(Y | X) (confounded)"], ["do", "Interventional P(Y | do(X)) (backdoor adjusted)"]], v: "obs" },
    { s: "ps", label: "P(drug | severe Z=1)", min: 0.1, max: 0.95, step: 0.05, v: 0.85, fmt: pct },
    { s: "pm", label: "P(drug | mild Z=0)", min: 0.05, max: 0.9, step: 0.05, v: 0.15, fmt: pct },
    { s: "eff", label: "True causal effect of drug", min: 0, max: 0.35, step: 0.02, v: 0.14, fmt: pct }
  ],
  stats: [["obsDiff", "Observational P(Y|1) − P(Y|0)"], ["doDiff", "Causal P(Y|do(1)) − P(Y|do(0))"], ["bias", "Confounding bias"]],
  change() { this.refresh(); },
  calc() {
    const pz = 0.5, pm = this.p.pm, ps = this.p.ps, e = this.p.eff;
    const y00 = 0.78, y10 = clamp(y00 + e, 0, 0.99), y01 = 0.26, y11 = clamp(y01 + e, 0, 0.99);
    const w10 = (1 - pz) * pm, w11 = pz * ps, w00 = (1 - pz) * (1 - pm), w01 = pz * (1 - ps);
    const obs1 = (w10 * y10 + w11 * y11) / (w10 + w11), obs0 = (w00 * y00 + w01 * y01) / (w00 + w01);
    const do1 = (1 - pz) * y10 + pz * y11, do0 = (1 - pz) * y00 + pz * y01;
    return { y00, y10, y01, y11, w00, w10, w01, w11, obs0, obs1, do0, do1 };
  },
  refresh() {
    const c = this.calc(), od = c.obs1 - c.obs0, dd = c.do1 - c.do0;
    setS("obsDiff", (od >= 0 ? "+" : "") + pct(od));
    setS("doDiff", (dd >= 0 ? "+" : "") + pct(dd));
    setS("bias", (od - dd >= 0 ? "+" : "") + pct(od - dd));
    labExtra(`<p style="margin:8px 0 0">${od < 0 && dd > 0 ? `<b>Simpson's paradox!</b> Naive conditioning gives P(Y|X=1) − P(Y|X=0) = ${pct(od)} (looks harmful!), because ${pct(c.w11 / (c.w10 + c.w11))} of treated patients are severe vs only ${pct(c.w01 / (c.w00 + c.w01))} of untreated. ` : ""}Backdoor adjustment P(Y | do(X=x)) = Σ_z P(Y | X=x, Z=z) P(Z=z) weights both strata equally (50/50) and recovers the exact causal effect <b>+${pct(dd)}</b> (Murphy 2 §36.3).</p>`);
  },
  draw() {
    const c = this.calc(), isDo = this.p.mode === "do", H = 4.6;
    const s00 = isDo ? 0.5 : c.w00 / (c.w00 + c.w01), s01 = 1 - s00;
    const s10 = isDo ? 0.5 : c.w10 / (c.w10 + c.w11), s11 = 1 - s10;
    const bars = [
      [-4.2, 1.8, c.y00, s00, C.c2, "Mild · X=0"],
      [-1.8, 1.8, c.y10, s10, C.c1, "Mild · X=1"],
      [-4.2, -1.8, c.y01, s01, C.c2, "Severe · X=0"],
      [-1.8, -1.8, c.y11, s11, C.c1, "Severe · X=1"]
    ];
    for (const [x, z, y, w, col, lbl] of bars) {
      const bw = 0.55 + w * 1.15, h = y * H;
      V.box(x, 0, z, bw, h, bw, col, null);
      pin(x, h + 0.45, z, `${lbl} (${pct(y)})`, "flat");
    }
    const a0 = isDo ? c.do0 : c.obs0, a1 = isDo ? c.do1 : c.obs1;
    V.box(2.2, 0, 0, 1.35, a0 * H, 1.35, C.c2, null);
    V.box(4.4, 0, 0, 1.35, a1 * H, 1.35, C.c1, null);
    Ln.seg(2.2, a0 * H + 0.1, 0, 4.4, a1 * H + 0.1, 0, a1 >= a0 ? C.c3 : C.c1);
    pin(2.2, a0 * H + 0.55, 0, `${isDo ? "do(X=0)" : "P(Y|X=0)"}: ${pct(a0)}`, "flat");
    pin(4.4, a1 * H + 0.55, 0, `${isDo ? "do(X=1)" : "P(Y|X=1)"}: ${pct(a1)}`, a1 >= a0 ? "ok" : "hot");
  },
  state() { const c = this.calc(); return `Causality lab (${this.p.mode}): observational diff ${pct(c.obs1 - c.obs0)}, causal do(X) diff +${pct(c.do1 - c.do0)}.`; }
});
