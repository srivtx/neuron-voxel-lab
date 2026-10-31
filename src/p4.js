/* ================= lab framework: sims whose controls are generated into the chapter panel ================= */
const LAB = {};
function lab(id, def) {
  def.id = id; def.isLab = true; def.p = def.p || {};
  for (const c of def.ctl || []) { if (c.s && def.p[c.s] == null) def.p[c.s] = c.v; if (c.seg && def.p[c.seg] == null) def.p[c.seg] = c.v; }
  ST[id] = def; LAB[id] = def;
}
function renderLab(sim) {
  const host = $("#lab"); host.hidden = false;
  let h = `<div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline;flex-wrap:wrap"><div><p class="eyebrow">Lab · in the 3D view</p><h3 style="font:700 18px var(--f-display);margin:2px 0 6px">${esc(sim.title)}</h3></div></div><p class="note" style="margin:0 0 10px;color:var(--ink)">${sim.how}</p>`;
  for (const c of sim.ctl || []) {
    if (c.s) h += `<div class="ctl"><label for="L-${c.s}">${c.label}</label><input id="L-${c.s}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${sim.p[c.s]}"><output id="LO-${c.s}"></output></div>`;
    else if (c.seg) h += `<div class="btns" style="margin:4px 0 8px"><span class="seg" role="group" aria-label="${esc(c.label || "")}">${c.opts.map(([v, l]) => `<button type="button" data-seg="${c.seg}" data-v="${v}" aria-pressed="${String(sim.p[c.seg]) === String(v)}">${l}</button>`).join("")}</span></div>`;
    else if (c.btns) h += `<div class="btns" style="margin:4px 0 8px">${c.btns.map(([id, l, pr]) => `<button type="button" class="btn${pr ? " primary" : ""}" data-act="${id}" id="LB-${id}">${l}</button>`).join("")}</div>`;
  }
  if (sim.stats) h += `<div class="stats" style="margin-top:8px">${sim.stats.map(([id, l]) => `<div><span>${l}</span><b id="LS-${id}">–</b></div>`).join("")}</div>`;
  if (sim.chart) h += `<div style="margin-top:12px"><h3 style="margin:0 0 4px">${sim.chart}</h3><canvas class="chart" id="lab-chart"></canvas>${sim.chartLegend ? `<div class="chartlegend">${sim.chartLegend}</div>` : ""}</div>`;
  h += `<div id="lab-extra" class="note" style="color:var(--ink)"></div>`;
  host.innerHTML = h;
  for (const c of sim.ctl || []) if (c.s) {
    const el = $("#L-" + c.s), o = $("#LO-" + c.s), show = () => o.textContent = c.fmt ? c.fmt(sim.p[c.s]) : sim.p[c.s];
    el.oninput = () => { sim.p[c.s] = +el.value; show(); sim.change && sim.change(c.s); }; show();
  }
  host.querySelectorAll("[data-seg]").forEach(b => b.onclick = () => { sim.p[b.dataset.seg] = b.dataset.v; host.querySelectorAll(`[data-seg="${b.dataset.seg}"]`).forEach(x => x.setAttribute("aria-pressed", x === b)); sim.change && sim.change(b.dataset.seg); });
  host.querySelectorAll("[data-act]").forEach(b => b.onclick = () => sim.act && sim.act(b.dataset.act));
  sim.refresh && sim.refresh();
}
const setS = (id, v) => { const e = document.getElementById("LS-" + id); if (e) e.textContent = v; };
const labExtra = h => { const e = $("#lab-extra"); if (e) e.innerHTML = h; };
const pct = v => (v * 100).toFixed(v < 0.01 ? 2 : 1) + "%";
function solve(A, b) { const n = b.length, M = A.map((r, i) => [...r, b[i]]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; const d = M[c][c] || 1e-12; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } } return M.map((r, i) => r[n] / (r[i] || 1e-12)); }
function lgamma(x) { const g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x); x -= 1; let a = 0.99999999999980993; const t = x + 7.5; for (let i = 0; i < 8; i++) a += g[i] / (x + i + 1); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); }
function gammaS(r, k) { if (k < 1) return gammaS(r, k + 1) * Math.pow(r(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = randn(r); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = r(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const R0 = Math.random;
function xyChart(cv, curve, pt, labels) {
  if (!cv) return; const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  cv.width = w * dpr; cv.height = h * dpr; const g = cv.getContext("2d"); g.scale(dpr, dpr);
  const L = 34, B = 22, T = 8, Rr = 10, X = v => L + (w - L - Rr) * v, Y = v => T + (h - T - B) * (1 - v);
  g.strokeStyle = tok("--line"); g.fillStyle = tok("--muted"); g.font = "10.5px " + tok("--f-mono");
  for (let k = 0; k <= 4; k++) { const v = k / 4; g.beginPath(); g.moveTo(X(0), Y(v)); g.lineTo(X(1), Y(v)); g.stroke(); g.fillText(v.toFixed(2), 2, Y(v) + 3); }
  g.fillText(labels[0], L, h - 6); g.save(); g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(1), Y(1)); g.stroke(); g.restore();
  g.strokeStyle = tok("--c2"); g.lineWidth = 2; g.beginPath(); curve.forEach(([a, b], i) => i ? g.lineTo(X(a), Y(b)) : g.moveTo(X(a), Y(b))); g.stroke();
  if (pt) { g.fillStyle = tok("--c4"); g.beginPath(); g.arc(X(pt[0]), Y(pt[1]), 5, 0, 7); g.fill(); }
}

/* ---------- M1 · overfitting with polynomials ---------- */
function polyfit(pts, d, lam) {
  const n = d + 1, A = Array.from({ length: n }, () => new Array(n).fill(0)), b = new Array(n).fill(0);
  for (const [x, y] of pts) { const u = 2 * x - 1, ph = []; let v = 1; for (let j = 0; j < n; j++) { ph.push(v); v *= u; } for (let i = 0; i < n; i++) { b[i] += ph[i] * y; for (let j = 0; j < n; j++) A[i][j] += ph[i] * ph[j]; } }
  for (let i = 1; i < n; i++) A[i][i] += lam * pts.length;
  return solve(A, b);
}
const pEval = (w, x) => { const u = 2 * x - 1; let s = 0, v = 1; for (const c of w) { s += c * v; v *= u; } return s; };
const mse = (w, pts) => pts.reduce((s, [x, y]) => s + (pEval(w, x) - y) ** 2, 0) / pts.length;
lab("m1fit", {
  title: "Fit a curve, then test it on new points", tab: "Overfitting", cam: [[0, 7, 22], [0, 3.2, 0]],
  how: "The hidden truth is the faint curve y = sin(2πx). Orange blocks are noisy training points; grey blocks are fresh test points from the same truth. The yellow chain is a polynomial of the chosen degree, fitted to the orange points only. Raise the degree: training error keeps falling, but test error falls and then explodes. Then add ridge λ and watch it calm down.",
  legend: () => `<b>Train vs test</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>train</span><span><i class="sw" style="background:var(--c5)"></i>test</span><span><i class="sw" style="background:var(--c4)"></i>fitted polynomial</span></div>`,
  ctl: [{ s: "deg", label: "Degree", min: 0, max: 14, step: 1, v: 3 }, { s: "lam", label: "Ridge λ", min: -8, max: 0, step: 0.1, v: -8, fmt: v => v <= -8 ? "0" : "10^" + v.toFixed(1) }, { s: "n", label: "Training points", min: 5, max: 40, step: 1, v: 12 }, { s: "noise", label: "Noise σ", min: 0, max: 0.6, step: 0.01, v: 0.2, fmt: f2 }, { btns: [["new", "New random data", true]] }],
  stats: [["tr", "Train error"], ["te", "Test error"], ["w", "Largest |weight|"]], chart: "Error vs degree (this data, this λ)",
  chartLegend: `<span><i style="background:var(--c1)"></i>train</span><span><i style="background:var(--c2)"></i>test</span>`,
  init() { this.make(); },
  make() { const r = rng(R0() * 1e9 | 0), f = x => Math.sin(2 * Math.PI * x), p = this.p; this.trp = Array.from({ length: p.n }, () => { const x = r(); return [x, f(x) + randn(r) * p.noise]; }); this.tep = Array.from({ length: 60 }, () => { const x = r(); return [x, f(x) + randn(r) * p.noise]; }); this.fit(); },
  fit() { const lam = this.p.lam <= -8 ? 0 : Math.pow(10, this.p.lam); this.w = polyfit(this.trp, this.p.deg, lam); this.curve = []; for (let d = 0; d <= 14; d++) { const w = polyfit(this.trp, d, lam); this.curve.push([mse(w, this.trp), mse(w, this.tep)]); } this.refresh(); },
  refresh() { if (!this.w) return; const a = mse(this.w, this.trp), b = mse(this.w, this.tep); setS("tr", f3(a)); setS("te", f3(b)); setS("w", Math.max(...this.w.map(Math.abs)).toPrecision(3)); if (cur === this) lineChart($("#lab-chart"), [{ data: this.curve.map(c => Math.min(c[0], 1)), color: tok("--c1") }, { data: this.curve.map(c => Math.min(c[1], 1)), color: tok("--c2") }], { ymin: 0, ymax: 1, xlabel: "degree 0 → 14 (capped at 1)" }); labExtra(`With ${this.p.n} points, a degree-${this.p.n - 1} polynomial can pass through every one exactly. That's "memorising", not learning. Murphy §1.2.3 calls the gap between train and test error the <b>generalization gap</b>.`); },
  change(k) { if (k === "n" || k === "noise") this.make(); else this.fit(); }, act() { this.make(); },
  draw() {
    const X = x => (x - 0.5) * 16, Y = y => clamp((y + 1.7) * 2, 0, 7.2);
    for (let i = 0; i < 40; i++) V.box(-8 + (i + 0.5) * 0.4, -0.12, 0, 0.38, 0.1, 2.4, i & 1 ? C.panel : C.line, null);
    for (let i = 0; i < 60; i++) { const x = i / 59, x2 = (i + 1) / 59; Ln.seg(X(x), Y(Math.sin(2 * Math.PI * x)), 0, X(x2), Y(Math.sin(2 * Math.PI * x2)), 0, C.muted); }
    for (const [x, y] of this.tep) V.box(X(x), Y(y) - 0.11, 0.6, 0.22, 0.22, 0.22, C.c5, null);
    for (const [x, y] of this.trp) V.box(X(x), Y(y) - 0.2, 0, 0.4, 0.4, 0.4, C.c1, null);
    for (let i = 0; i <= 160; i++) { const x = i / 160, y = pEval(this.w, x); if (y < -1.7 || y > 1.9) continue; V.box(X(x), Y(y) - 0.07, -0.3, 0.14, 0.14, 0.14, C.c4, null); }
  },
  state() { return `degree=${this.p.deg}, ridge λ=${this.p.lam <= -8 ? 0 : Math.pow(10, this.p.lam).toExponential(1)}, ${this.p.n} training points, noise σ=${this.p.noise}; train error=${f3(mse(this.w, this.trp))}, test error=${f3(mse(this.w, this.tep))}.`; }
});

/* ---------- M2 · Bayes rule on 2,000 people ---------- */
lab("m2bayes", {
  title: "Bayes' rule: 2,000 people take a test", tab: "Bayes rule", cam: [[0, 22, 11], [0, 0, 0.5]],
  how: "Each block is one person. Orange = actually sick. Tall blocks tested positive. Set how common the disease is, how good the test is, and count: of all the tall blocks, what fraction are orange? That fraction is P(sick | positive). With a rare disease, most positives are healthy people, even with a good test.",
  legend: () => `<b>2,000 people</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>sick</span><span><i class="sw" style="background:var(--c5)"></i>healthy</span><span>tall = tested positive</span></div>`,
  ctl: [{ s: "prev", label: "Prevalence P(sick)", min: 0.1, max: 30, step: 0.1, v: 1, fmt: v => v.toFixed(1) + "%" }, { s: "sens", label: "Sensitivity P(+ | sick)", min: 50, max: 100, step: 0.5, v: 87.5, fmt: v => v + "%" }, { s: "spec", label: "Specificity P(− | healthy)", min: 50, max: 100, step: 0.5, v: 97.5, fmt: v => v + "%" }, { seg: "view", opts: [["all", "Everyone"], ["pos", "Only positive tests"]], v: "all" }],
  stats: [["tp", "Sick and positive"], ["fp", "Healthy but positive"], ["post", "P(sick | +)"]],
  init() { const r = rng(4); this.perm = Array.from({ length: 2000 }, (_, i) => i); for (let i = 1999; i > 0; i--) { const j = (r() * (i + 1)) | 0;[this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]]; } this.calc(); },
  calc() {
    const N = 2000, p = this.p, sick = Math.round(N * p.prev / 100), tp = Math.round(sick * p.sens / 100), healthy = N - sick, fp = Math.round(healthy * (1 - p.spec / 100));
    this.cat = new Uint8Array(N); this.perm.forEach((cell, k) => { this.cat[cell] = k < tp ? 1 : k < sick ? 2 : k < sick + fp ? 3 : 4; });
    Object.assign(this, { sick, tp, fp, healthy });
  },
  refresh() {
    const { tp, fp, sick, healthy } = this, p = this.p, post = tp / Math.max(1, tp + fp), pr = p.prev / 100, se = p.sens / 100, sp = p.spec / 100, exact = se * pr / (se * pr + (1 - sp) * (1 - pr));
    setS("tp", tp); setS("fp", fp); setS("post", pct(post));
    labExtra(`<div class="flow" style="margin-top:10px"><span class="nd"><b>P(+|sick)·P(sick)</b>${se.toFixed(3)} × ${pr.toFixed(3)}</span><span class="ar">÷</span><span class="nd"><b>P(+) = all positives</b>${se.toFixed(3)}·${pr.toFixed(3)} + ${(1 - sp).toFixed(3)}·${(1 - pr).toFixed(3)}</span><span class="ar">=</span><span class="nd"><b>P(sick|+)</b>${pct(exact)}</span></div>
      <p style="margin:8px 0 0">Counting blocks gives ${tp} / (${tp} + ${fp}) = ${pct(post)}. The formula gives the same number, because Bayes' rule <i>is</i> this count, written with fractions instead of people. ${fp > tp ? `Here the healthy-but-positive blocks outnumber the truly sick ones: there are ${healthy.toLocaleString()} healthy people and only ${sick} sick, so even a small false-positive rate produces a crowd.` : ""}</p>`);
  },
  change() { this.calc(); this.refresh(); },
  draw() {
    const v = this.p.view, cs = 0.42;
    for (let i = 0; i < 2000; i++) {
      const c = this.cat[i], x = (i % 50 - 24.5) * cs, z = ((i / 50 | 0) - 19.5) * cs, pos = c === 1 || c === 3, sick = c <= 2;
      if (v === "pos" && !pos) { V.box(x, 0, z, cs * 0.9, 0.04, cs * 0.9, C.line, null); continue; }
      V.box(x, 0, z, cs * 0.86, pos ? 1.3 : 0.22, cs * 0.86, sick ? C.c1 : pos ? mix(C.c5, C.ink, 0.25) : C.c5, { who: c });
    }
  },
  onHover(t) { if (t && t.who) return ["", "sick, tested positive (true positive)", "sick, tested negative (missed)", "healthy, tested positive (false alarm)", "healthy, tested negative"][t.who]; },
  state() { return `prevalence ${this.p.prev}%, sensitivity ${this.p.sens}%, specificity ${this.p.spec}%; of 2000 people ${this.sick} sick; true positives ${this.tp}, false positives ${this.fp}; P(sick|+)=${pct(this.tp / Math.max(1, this.tp + this.fp))}.`; }
});

/* ---------- M2 · Monty Hall ---------- */
lab("m2monty", {
  title: "Monty Hall: stay or switch?", tab: "Monty Hall", cam: [[0, 10, 16], [0, 1.5, 1]],
  how: "A car is behind one door. You pick one. The host, who knows where the car is, opens every other door except one, never revealing the car. Every game below is scored both ways: once if you stay, once if you switch. Play a few hundred and look at the two towers. Then raise the number of doors to see why switching wins.",
  legend: () => `<b>This game</b><div class="row"><span><i class="sw" style="background:var(--c4)"></i>your pick</span><span><i class="sw" style="background:var(--c3)"></i>car</span><span><i class="sw" style="background:var(--line)"></i>opened by host</span></div>`,
  ctl: [{ s: "doors", label: "Doors", min: 3, max: 10, step: 1, v: 3 }, { btns: [["one", "Play 1 game", true], ["many", "Play 100"], ["auto", "Auto-play"], ["reset", "Reset tallies"]] }],
  stats: [["g", "Games"], ["st", "Stay wins"], ["sw", "Switch wins"]],
  init() { this.reset(); },
  reset() { this.g = 0; this.stay = 0; this.sw = 0; this.cur = null; this.auto = false; },
  play() { const n = this.p.doors, car = R0() * n | 0, pick = R0() * n | 0; let keep = pick === car ? (pick + 1 + (R0() * (n - 1) | 0)) % n : car; this.cur = { n, car, pick, keep }; this.g++; if (pick === car) this.stay++; if (keep === car) this.sw++; },
  act(a) { if (a === "one") this.play(); if (a === "many") for (let i = 0; i < 100; i++) this.play(); if (a === "reset") this.reset(); if (a === "auto") { this.auto = !this.auto; } const b = $("#LB-auto"); if (b) b.textContent = this.auto ? "Stop" : "Auto-play"; this.refresh(); },
  change() { this.reset(); this.refresh(); },
  tick() { if (this.auto) { for (let i = 0; i < 3; i++) this.play(); if (this.g % 15 < 3) this.refresh(); } },
  exit() { this.auto = false; },
  refresh() { setS("g", this.g); setS("st", this.g ? pct(this.stay / this.g) : "–"); setS("sw", this.g ? pct(this.sw / this.g) : "–"); const n = this.p.doors; labExtra(`<p style="margin:8px 0 0">Theory: staying wins only if your first pick was right, 1/${n} = ${pct(1 / n)}. Switching wins whenever your first pick was wrong, (${n}−1)/${n} = ${pct((n - 1) / n)}, because the host's choice of which door to leave closed carries the information. Murphy §2.3.2 works this out with Bayes' rule.</p>`); },
  draw() {
    const n = this.p.doors, c = this.cur, gap = 1.7;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * gap, opened = c && i !== c.pick && i !== c.keep;
      V.box(x, 0, 0, 1.3, opened ? 0.25 : 3, 0.3, opened ? C.line : C.c2, null);
      if (c && i === c.pick) V.box(x, 0, 0.6, 1.4, 0.15, 0.6, C.c4, null);
      if (c && i === c.car) V.box(x, 0, 0.9, 0.8, 0.6, 0.6, C.c3, null);
    }
    const hS = this.g ? this.stay / this.g * 6 : 0, hW = this.g ? this.sw / this.g * 6 : 0;
    V.box(-1.6, 0, 5, 1.6, hS + 0.05, 1.6, C.c5, null); V.box(1.6, 0, 5, 1.6, hW + 0.05, 1.6, C.c1, null);
    pin(-1.6, hS + 0.4, 5, `stay ${this.g ? pct(this.stay / this.g) : ""}`, ""); pin(1.6, hW + 0.4, 5, `switch ${this.g ? pct(this.sw / this.g) : ""}`, "hot");
  },
  state() { return `${this.p.doors} doors, ${this.g} games played; stay won ${this.stay}, switch won ${this.sw}.`; }
});

/* ---------- M2 · distribution zoo ---------- */
const DIST = {
  bern: { name: "Bernoulli", disc: true, ps: [["θ", 0, 1, 0.01, 0.3]], sup: () => [0, 1], pmf: (k, [t]) => k ? t : 1 - t, samp: (r, [t]) => r() < t ? 1 : 0, mv: ([t]) => [t, t * (1 - t)], say: "One coin flip: 1 with probability θ, else 0. Station 2's cross-entropy is −log of this." },
  binom: { name: "Binomial", disc: true, ps: [["n", 1, 40, 1, 10], ["θ", 0, 1, 0.01, 0.3]], sup: ([n]) => Array.from({ length: n + 1 }, (_, k) => k), pmf: (k, [n, t]) => Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * Math.log(t + 1e-300) + (n - k) * Math.log(1 - t + 1e-300)), samp: (r, [n, t]) => { let s = 0; for (let i = 0; i < n; i++) s += r() < t; return s; }, mv: ([n, t]) => [n * t, n * t * (1 - t)], say: "Number of heads in n flips. (n choose k) counts the orders the k heads can come in." },
  cat: { name: "Categorical (softmax)", disc: true, ps: [["temperature T", 0.1, 5, 0.05, 1]], sup: () => [0, 1, 2, 3, 4, 5], pmf: (k, [T]) => { const z = [2, 1, 0.5, 0, -1, -2].map(v => Math.exp(v / T)), s = z.reduce((a, b) => a + b); return z[k] / s; }, samp(r, ps) { let u = r(); for (let k = 0; k < 6; k++) { u -= this.pmf(k, ps); if (u <= 0) return k; } return 5; }, mv(ps) { let m = 0, m2 = 0; for (let k = 0; k < 6; k++) { const p = this.pmf(k, ps); m += k * p; m2 += k * k * p; } return [m, m2 - m * m]; }, say: "One roll of a 6-sided die with probabilities softmax(scores / T). Scores are fixed at [2, 1, 0.5, 0, −1, −2]. Low T makes it nearly certain (argmax); high T makes it nearly uniform." },
  gauss: { name: "Gaussian", ps: [["μ", -3, 3, 0.05, 0], ["σ", 0.2, 3, 0.05, 1]], rng: () => [-8, 8], pdf: (x, [m, s]) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI)), samp: (r, [m, s]) => m + s * randn(r), mv: ([m, s]) => [m, s * s], say: "The bell. Its −log is (x−μ)²/2σ² + constant, which is why squared error and Gaussians go together." },
  t: { name: "Student t", ps: [["ν (degrees of freedom)", 1, 30, 1, 2]], rng: () => [-8, 8], pdf: (x, [v]) => Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2) - 0.5 * Math.log(v * Math.PI) - (v + 1) / 2 * Math.log(1 + x * x / v)), samp: (r, [v]) => randn(r) / Math.sqrt(gammaS(r, v / 2) * 2 / v), mv: ([v]) => [v > 1 ? 0 : NaN, v > 2 ? v / (v - 2) : Infinity], say: "A bell with heavy tails: outliers are far less surprising. At ν = 1 it's the Cauchy, whose mean doesn't exist. As ν grows it becomes the Gaussian." },
  laplace: { name: "Laplace", ps: [["μ", -3, 3, 0.05, 0], ["b", 0.2, 3, 0.05, 1]], rng: () => [-8, 8], pdf: (x, [m, b]) => Math.exp(-Math.abs(x - m) / b) / (2 * b), samp: (r, [m, b]) => { const u = r() - 0.5; return m - b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u)); }, mv: ([m, b]) => [m, 2 * b * b], say: "−log is |x − μ|/b: absolute error instead of squared. As a prior on weights, this is lasso (Murphy §11.4)." },
  beta: { name: "Beta", ps: [["a", 0.2, 10, 0.1, 2], ["b", 0.2, 10, 0.1, 5]], rng: () => [0, 1], pdf: (x, [a, b]) => x <= 0 || x >= 1 ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) + lgamma(a + b) - lgamma(a) - lgamma(b)), samp: (r, [a, b]) => { const x = gammaS(r, a), y = gammaS(r, b); return x / (x + y); }, mv: ([a, b]) => [a / (a + b), a * b / ((a + b) ** 2 * (a + b + 1))], say: "A distribution over probabilities themselves (numbers in 0–1). It's the prior for a coin's bias in chapter 4's coin lab." },
  gamma: { name: "Gamma", ps: [["shape a", 0.5, 10, 0.1, 2], ["rate b", 0.2, 5, 0.05, 1]], rng: () => [0, 15], pdf: (x, [a, b]) => x <= 0 ? 0 : Math.exp(a * Math.log(b) + (a - 1) * Math.log(x) - b * x - lgamma(a)), samp: (r, [a, b]) => gammaS(r, a) / b, mv: ([a, b]) => [a / b, a / (b * b)], say: "Positive numbers such as waiting times or rates. With a = 1 it's the exponential distribution." }
};
lab("m2dist", {
  title: "The distribution zoo", tab: "Distributions", cam: [[0, 9, 20], [0, 2.5, 0]],
  how: "Blue towers: the exact probability of each value (for continuous ones, the density × bin width). Orange towers: what you actually get from random draws. Change parameters and watch the shape; draw samples and watch the orange catch up with the blue as the count grows.",
  legend: () => `<b>${DIST[LAB.m2dist.p.dist].name}</b><div class="row"><span><i class="sw" style="background:var(--c2)"></i>exact</span><span><i class="sw" style="background:var(--c1)"></i>from samples</span></div>`,
  p: { dist: "gauss" }, init() { this.build(); this.hist = null; },
  build() {
    const d = DIST[this.p.dist]; this.vals = this.vals || {}; this.vals[this.p.dist] = this.vals[this.p.dist] || d.ps.map(q => q[4]);
    this.ctl = [{ seg: "dist", label: "Distribution", opts: Object.entries(DIST).map(([k, v]) => [k, v.name.split(" ")[0]]), v: this.p.dist }, ...d.ps.map((q, i) => ({ s: "a" + i, label: q[0], min: q[1], max: q[2], step: q[3], v: this.vals[this.p.dist][i], fmt: v => q[3] >= 1 ? v : f2(v) })), { btns: [["s100", "Draw 100", true], ["s2k", "Draw 2,000"], ["clr", "Clear samples"]] }];
    d.ps.forEach((q, i) => this.p["a" + i] = this.vals[this.p.dist][i]);
    this.stats = [["m", "Mean (exact)"], ["v", "Variance (exact)"], ["sm", "Sample mean"]];
  },
  params() { return DIST[this.p.dist].ps.map((q, i) => this.p["a" + i]); },
  bins() {
    const d = DIST[this.p.dist], ps = this.params();
    if (d.disc) return d.sup(ps).map(k => ({ x: k, p: d.pmf(k, ps), lo: k - 0.5, hi: k + 0.5 }));
    const [a, b] = d.rng(ps), n = 48, w = (b - a) / n; return Array.from({ length: n }, (_, i) => { const x = a + (i + 0.5) * w; return { x, p: d.pdf(x, ps) * w, lo: a + i * w, hi: a + (i + 1) * w }; });
  },
  sample(k) { const d = DIST[this.p.dist], ps = this.params(), r = rng(R0() * 1e9 | 0); this.samples = this.samples || []; for (let i = 0; i < k; i++) this.samples.push(d.samp(r, ps)); this.refresh(); },
  act(a) { if (a === "s100") this.sample(100); if (a === "s2k") this.sample(2000); if (a === "clr") { this.samples = []; this.refresh(); } },
  change(k) { if (k === "dist") { this.samples = []; this.build(); renderLab(this); $("#legend").innerHTML = this.legend(); return; } const i = +k.slice(1); this.vals[this.p.dist][i] = this.p[k]; this.samples = []; this.refresh(); },
  refresh() {
    const d = DIST[this.p.dist], [m, v] = d.mv(this.params()), s = this.samples || [];
    setS("m", isFinite(m) ? f3(m) : "undefined"); setS("v", isFinite(v) ? f3(v) : "infinite"); setS("sm", s.length ? f3(s.reduce((a, b) => a + b, 0) / s.length) + ` (n=${s.length})` : "–");
    labExtra(`<p style="margin:8px 0 0">${d.say}</p>`);
  },
  draw() {
    const B = this.bins(), s = this.samples || [], mx = Math.max(...B.map(b => b.p), 1e-9), n = B.length, W = Math.min(16 / n, 1.6);
    const cnt = B.map(b => s.filter(v => v >= b.lo && v < b.hi).length / Math.max(1, s.length));
    B.forEach((b, i) => { const x = (i - (n - 1) / 2) * W; V.box(x - W * 0.22, 0, 0, W * 0.42, b.p / mx * 6 + 0.03, 0.9, C.c2, { bin: i }); if (s.length) V.box(x + W * 0.22, 0, 0, W * 0.42, cnt[i] / mx * 6 + 0.03, 0.9, C.c1, { bin: i }); });
    if (DIST[this.p.dist].disc && n <= 12) B.forEach((b, i) => pin((i - (n - 1) / 2) * W, -0.1, 1.2, String(b.x), "flat"));
    this._B = B; this._cnt = cnt;
  },
  onHover(t) { if (t && t.bin != null && this._B) { const b = this._B[t.bin]; return `${DIST[this.p.dist].disc ? "value " + b.x : "x in [" + f2(b.lo) + ", " + f2(b.hi) + ")"}\nexact P = ${b.p.toFixed(4)}\nsamples: ${this._cnt[t.bin].toFixed(4)}`; } },
  state() { return `${DIST[this.p.dist].name} with ${DIST[this.p.dist].ps.map((q, i) => q[0] + "=" + this.p["a" + i]).join(", ")}; ${(this.samples || []).length} samples drawn.`; }
});

/* ---------- M2 · central limit theorem ---------- */
const BASE = { uni: { n: "uniform 0–1", s: r => r(), m: 0.5, v: 1 / 12 }, exp: { n: "exponential (skewed)", s: r => -Math.log(1 - r()), m: 1, v: 1 }, coin: { n: "coin, P(1) = 0.2", s: r => r() < 0.2 ? 1 : 0, m: 0.2, v: 0.16 } };
lab("m2clt", {
  title: "Central limit theorem: average enough of anything", tab: "CLT", cam: [[0, 9, 20], [0, 2.5, 0]],
  how: "Pick a lopsided starting distribution. Each experiment draws N values and averages them; this is repeated 4,000 times. Orange towers are the histogram of those averages; the yellow chain is the bell curve the theorem predicts. Slide N up from 1 and watch the shape turn into a bell, whatever you started from.",
  legend: () => `<b>Histogram of 4,000 averages</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>simulated</span><span><i class="sw" style="background:var(--c4)"></i>Gaussian prediction</span></div>`,
  ctl: [{ seg: "base", label: "Start from", opts: [["uni", "Uniform"], ["exp", "Exponential"], ["coin", "Coin 0.2"]], v: "exp" }, { s: "N", label: "Values averaged N", min: 1, max: 60, step: 1, v: 1 }, { btns: [["go", "Run again", true]] }],
  stats: [["ps", "Predicted spread σ/√N"], ["ms", "Measured spread"], ["sk", "Skew (0 = symmetric)"]],
  init() { this.run(); }, act() { this.run(); }, change() { this.run(); },
  run() { const b = BASE[this.p.base], N = this.p.N, r = rng(R0() * 1e9 | 0); this.m = Array.from({ length: 4000 }, () => { let s = 0; for (let i = 0; i < N; i++) s += b.s(r); return s / N; }); this.refresh(); },
  refresh() { if (!this.m) return; const b = BASE[this.p.base], n = this.m.length, mu = this.m.reduce((a, c) => a + c, 0) / n, sd = Math.sqrt(this.m.reduce((a, c) => a + (c - mu) ** 2, 0) / n), sk = this.m.reduce((a, c) => a + ((c - mu) / sd) ** 3, 0) / n; setS("ps", f3(Math.sqrt(b.v / this.p.N))); setS("ms", f3(sd)); setS("sk", f2(sk)); labExtra(`<p style="margin:8px 0 0">The spread shrinks like 1/√N: averaging 4× more values halves the noise. This one fact is why minibatches work (Murphy §8.4) and why error bars shrink with more data (§4.7).</p>`); },
  draw() {
    if (!this.m) return; const b = BASE[this.p.base], sd = Math.sqrt(b.v / this.p.N), lo = b.m - 4 * sd, hi = b.m + 4 * sd, nb = 40, w = (hi - lo) / nb, cnt = new Array(nb).fill(0);
    for (const v of this.m) { const k = Math.floor((v - lo) / w); if (k >= 0 && k < nb) cnt[k]++; }
    const pdf = x => Math.exp(-((x - b.m) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI)) * w * this.m.length, mx = Math.max(...cnt, pdf(b.m));
    for (let k = 0; k < nb; k++) { const x = (k - (nb - 1) / 2) * 0.4; V.box(x, 0, 0, 0.36, cnt[k] / mx * 6 + 0.03, 1, C.c1, null); V.box(x, pdf(lo + (k + 0.5) * w) / mx * 6, -0.7, 0.2, 0.2, 0.2, C.c4, null); }
    pin(-8.2, 0.1, 0.9, f2(lo), "flat"); pin(8.2, 0.1, 0.9, f2(hi), "flat");
  },
  state() { return `start distribution ${BASE[this.p.base].n}, averaging N=${this.p.N} values, 4000 repeats; predicted spread ${$("#LS-ps")?.textContent}, measured ${$("#LS-ms")?.textContent}, skew ${$("#LS-sk")?.textContent}.`; }
});

/* ---------- M3 · 2-D Gaussian and mixtures ---------- */
lab("m3gauss", {
  title: "A 2-D Gaussian you can bend", tab: "2D Gaussian", cam: [[0, 15, 17], [0, 1.5, 0]],
  how: "The height is the density p(x₁, x₂). σ₁ and σ₂ stretch it along each axis; ρ (correlation) tilts it. Green lines are the principal axes, the eigenvectors of Σ (chapter 7). The yellow row is a slice at a fixed x₁: its shape is the conditional p(x₂ | x₁), another Gaussian. Switch to Mixture to add three bells together.",
  legend: () => `<b>Density over (x₁, x₂)</b><div class="row"><span><i class="sw" style="background:var(--c4)"></i>slice at x₁</span><span><i class="sw" style="background:var(--c3)"></i>principal axes</span><span>dots = samples</span></div>`,
  ctl: [{ seg: "mode", label: "Model", opts: [["one", "One Gaussian"], ["mix", "Mixture of 3"]], v: "one" }, { s: "s1", label: "σ₁", min: 0.3, max: 2, step: 0.05, v: 1.2, fmt: f2 }, { s: "s2", label: "σ₂", min: 0.3, max: 2, step: 0.05, v: 0.7, fmt: f2 }, { s: "rho", label: "Correlation ρ", min: -0.95, max: 0.95, step: 0.01, v: 0.6, fmt: f2 }, { s: "x1", label: "Slice at x₁", min: -3, max: 3, step: 0.1, v: 1, fmt: f2 }],
  stats: [["cm", "E[x₂ | x₁]"], ["cv", "Var[x₂ | x₁]"], ["dt", "det Σ"]],
  init() { this.samp(); }, change() { this.samp(); this.refresh(); },
  comps() { const p = this.p; return p.mode === "one" ? [[0, 0, 1]] : [[-1.6, -1.2, 0.4], [1.5, 0.3, 0.35], [-0.2, 1.9, 0.25]]; },
  sig() { const p = this.p, k = p.mode === "one" ? 1 : 0.55; return [p.s1 * k, p.s2 * k, p.rho]; },
  dens(x, y) { const [a, b, r] = this.sig(); let s = 0; for (const [mx, my, w] of this.comps()) { const u = (x - mx) / a, v = (y - my) / b, q = (u * u - 2 * r * u * v + v * v) / (1 - r * r); s += w * Math.exp(-q / 2) / (2 * Math.PI * a * b * Math.sqrt(1 - r * r)); } return s; },
  samp() { const r = rng(9), [a, b, rho] = this.sig(), cs = this.comps(); this.pts = Array.from({ length: 300 }, () => { let u = r(), c = cs[0]; for (const q of cs) { u -= q[2]; if (u <= 0) { c = q; break; } } const z1 = randn(r), z2 = randn(r); return [c[0] + a * z1, c[1] + b * (rho * z1 + Math.sqrt(1 - rho * rho) * z2)]; }); },
  refresh() { const [a, b, r] = this.sig(); if (this.p.mode === "one") { setS("cm", f2(r * b / a * this.p.x1)); setS("cv", f3(b * b * (1 - r * r))); } else { setS("cm", "see slice"); setS("cv", "—"); } setS("dt", f3(a * a * b * b * (1 - r * r))); labExtra(`<p style="margin:8px 0 0">Σ = [[σ₁², ρσ₁σ₂], [ρσ₁σ₂, σ₂²]] = [[${f2(a * a)}, ${f2(r * a * b)}], [${f2(r * a * b)}, ${f2(b * b)}]]. Conditioning on x₁ shifts the mean of x₂ by ρ·(σ₂/σ₁)·x₁ and shrinks its variance by (1 − ρ²): knowing a correlated variable makes you less unsure. Murphy §3.2.3.</p>`); },
  draw() {
    const G = 40, cs = 0.36, sx = this.p.x1; let mx = 0; const D = []; for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const v = this.dens(-4 + (i + 0.5) * 0.2, -4 + (j + 0.5) * 0.2); D.push(v); mx = Math.max(mx, v); }
    const si = Math.round((sx + 4) / 0.2 - 0.5);
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const v = D[i * G + j] / mx; V.box((i - 19.5) * cs, 0, (19.5 - j) * cs, cs * 0.92, v * 5 + 0.04, cs * 0.92, i === si ? C.c4 : mix3(C.panel, C.c2, C.c1, v), null); }
    for (const [x, y] of this.pts) V.box(x * 1.8, 0, -y * 1.8, 0.12, 0.12, 0.12, C.ink, null);
    if (this.p.mode === "one") { const [a, b, r] = this.sig(), c = r * a * b, A = a * a, B = b * b, tr = A + B, dt = A * B - c * c, l1 = tr / 2 + Math.sqrt(tr * tr / 4 - dt), l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - dt)); for (const l of [l1, l2]) { let vx = c, vy = l - A; if (Math.abs(c) < 1e-9) { vx = l === A ? 1 : 0; vy = l === A ? 0 : 1; } const n = Math.hypot(vx, vy) || 1, s = 2 * Math.sqrt(l) * 1.8; Ln.seg(-vx / n * s, 0.15, vy / n * s, vx / n * s, 0.15, -vy / n * s, C.c3); } }
    pin(7.6, 0.2, 0, "x₁ →", "flat"); pin(0, 0.2, -7.6, "x₂ →", "flat");
  },
  state() { const p = this.p; return `${p.mode === "one" ? "single Gaussian" : "mixture of 3 Gaussians"}, σ1=${p.s1}, σ2=${p.s2}, ρ=${p.rho}, slice at x1=${p.x1}; E[x2|x1]=${$("#LS-cm")?.textContent}, Var=${$("#LS-cv")?.textContent}.`; }
});

/* ---------- M4 · coin: MLE vs Bayes ---------- */
lab("m4coin", {
  title: "Flip a coin: MLE vs Bayes", tab: "Coin MLE", cam: [[0, 11, 18], [0, 1.2, 0]],
  how: "Somewhere is a coin with true bias θ (green line). Flip it. Middle row: the likelihood, how well each possible θ explains the flips you've seen. Its peak is the MLE. Back row: your prior belief, Beta(a, b). Front row: the posterior, prior × likelihood rescaled. After few flips the prior matters a lot; after many flips the data wins and all three agree.",
  legend: () => `<b>Belief over θ (0 → 1)</b><div class="row"><span><i class="sw" style="background:var(--c5)"></i>prior</span><span><i class="sw" style="background:var(--c2)"></i>likelihood</span><span><i class="sw" style="background:var(--c1)"></i>posterior</span></div>`,
  ctl: [{ s: "th", label: "True θ (hidden)", min: 0.02, max: 0.98, step: 0.01, v: 0.7, fmt: f2 }, { s: "a", label: "Prior a (fake heads + 1)", min: 0.5, max: 30, step: 0.5, v: 2 }, { s: "b", label: "Prior b (fake tails + 1)", min: 0.5, max: 30, step: 0.5, v: 2 }, { btns: [["f1", "Flip 1", true], ["f10", "Flip 10"], ["f100", "Flip 100"], ["rs", "Start over"]] }],
  stats: [["hn", "Heads / flips"], ["mle", "MLE = heads / flips"], ["pm", "Posterior mean"]],
  init() { this.h = 0; this.n = 0; this.hist = []; },
  act(a) { if (a === "rs") { this.h = 0; this.n = 0; this.hist = []; } else { const k = a === "f1" ? 1 : a === "f10" ? 10 : 100; for (let i = 0; i < k; i++) { const x = R0() < this.p.th; this.h += x; this.n++; this.hist.push(x); } if (this.hist.length > 40) this.hist = this.hist.slice(-40); } this.refresh(); },
  change() { this.refresh(); },
  rows() { const G = 60, th = Array.from({ length: G }, (_, i) => (i + 0.5) / G), { a, b } = this.p, lg = (t, A, B) => (A - 1) * Math.log(t) + (B - 1) * Math.log(1 - t); const nz = arr => { const m = Math.max(...arr); return arr.map(v => Math.exp(v - m)); }; return { th, pr: nz(th.map(t => lg(t, a, b))), li: nz(th.map(t => lg(t, this.h + 1, this.n - this.h + 1))), po: nz(th.map(t => lg(t, a + this.h, b + this.n - this.h))) }; },
  refresh() {
    const { a, b } = this.p, A = a + this.h, B = b + this.n - this.h; setS("hn", `${this.h} / ${this.n}`); setS("mle", this.n ? f3(this.h / this.n) : "undefined"); setS("pm", f3(A / (A + B)));
    const { th, po } = this.rows(), s = po.reduce((x, y) => x + y, 0); let c = 0, lo = 0, hi = 1; for (let i = 0; i < th.length; i++) { c += po[i] / s; if (c > 0.025 && !lo) lo = th[i]; if (c > 0.975) { hi = th[i]; break; } }
    labExtra(`<p style="margin:8px 0 0">MAP (peak of posterior) = (h + a − 1)/(n + a + b − 2) = <b>${A + B - 2 > 0 ? f3((A - 1) / (A + B - 2)) : "–"}</b>. 95% credible interval ≈ [${f2(lo)}, ${f2(hi)}]. ${this.n === 0 ? "With zero flips the MLE is 0/0: undefined. The prior still gives an answer; that's its job." : this.n < 5 && (this.h === 0 || this.h === this.n) ? `All ${this.n} flips came up the same, so the MLE says θ = ${this.h ? 1 : 0}: certain it will <i>always</i> happen. That's overfitting with one parameter. The prior (Murphy §4.5.1) pulls it back.` : "Notice the posterior is just a Beta with the flips added to a and b. That shortcut is what 'conjugate prior' means (§4.6.1)."}</p>`);
  },
  draw() {
    const { th, pr, li, po } = this.rows(), W = 16 / th.length;
    th.forEach((t, i) => { const x = (t - 0.5) * 16; V.box(x, 0, -3, W * 0.85, pr[i] * 3.5 + 0.03, 1.2, C.c5, null); V.box(x, 0, 0, W * 0.85, (this.n ? li[i] : 0) * 3.5 + 0.03, 1.2, C.c2, null); V.box(x, 0, 3, W * 0.85, po[i] * 3.5 + 0.03, 1.2, C.c1, null); });
    const tx = (this.p.th - 0.5) * 16; Ln.seg(tx, 0.05, -4.2, tx, 0.05, 4.2, C.c3); V.box(tx, 0, 4.6, 0.25, 0.6, 0.25, C.c3, null);
    if (this.n) pin((this.h / this.n - 0.5) * 16, 4, 0, "MLE", "cool");
    const A = this.p.a + this.h, B = this.p.b + this.n - this.h; pin((A / (A + B) - 0.5) * 16, 4, 3, "mean", "hot");
    this.hist.forEach((x, i) => V.box(-7.8 + i * 0.4, 0, 6.2, 0.34, x ? 0.6 : 0.15, 0.34, x ? C.c4 : C.line, null));
    pin(-8.6, 0.1, 0, "θ=0", "flat"); pin(8.6, 0.1, 0, "θ=1", "flat");
  },
  state() { return `true θ=${this.p.th}, prior Beta(${this.p.a}, ${this.p.b}), ${this.h} heads in ${this.n} flips; MLE=${this.n ? f3(this.h / this.n) : "undefined"}, posterior mean=${$("#LS-pm")?.textContent}.`; }
});

/* ---------- M4 · sampling distribution and bootstrap ---------- */
lab("m4boot", {
  title: "How wrong is an average? Sampling distribution and bootstrap", tab: "Bootstrap", cam: [[0, 11, 19], [0, 1.5, 0]],
  how: "The population's true mean is 0. An 'experiment' collects n values and reports their average. Blue: the averages from 2,000 separate experiments. You can never see this in real life, since you only get one experiment. Yellow: the bootstrap's guess at the blue shape, made by resampling your one sample (the row of dots) with replacement 2,000 times.",
  legend: () => `<b>Histogram of averages</b><div class="row"><span><i class="sw" style="background:var(--c2)"></i>2,000 real experiments</span><span><i class="sw" style="background:var(--c4)"></i>bootstrap from 1 sample</span></div>`,
  ctl: [{ seg: "pop", label: "Population", opts: [["g", "Gaussian"], ["e", "Skewed (exp − 1)"]], v: "g" }, { s: "n", label: "Sample size n", min: 2, max: 200, step: 1, v: 20 }, { btns: [["go", "Run again", true]] }],
  stats: [["se", "True SE = σ/√n"], ["sd", "Spread of blue"], ["bs", "Bootstrap SE (yellow)"]],
  init() { this.run(); }, act() { this.run(); }, change() { this.run(); },
  run() {
    const r = rng(R0() * 1e9 | 0), n = this.p.n, s = this.p.pop === "g" ? () => randn(r) : () => -Math.log(1 - r()) - 1, avg = a => a.reduce((x, y) => x + y, 0) / a.length;
    this.ex = Array.from({ length: 2000 }, () => { let t = 0; for (let i = 0; i < n; i++) t += s(); return t / n; });
    this.one = Array.from({ length: n }, s); this.bs = Array.from({ length: 2000 }, () => { let t = 0; for (let i = 0; i < n; i++) t += this.one[(r() * n) | 0]; return t / n; });
    const sd = a => { const m = avg(a); return Math.sqrt(avg(a.map(v => (v - m) ** 2))); }; this.sd1 = sd(this.ex); this.sd2 = sd(this.bs); this.m1 = avg(this.one);
    const so = [...this.bs].sort((a, b) => a - b); this.ci = [so[50], so[1949]]; this.refresh();
  },
  refresh() { if (!this.ex) return; setS("se", f3(1 / Math.sqrt(this.p.n))); setS("sd", f3(this.sd1)); setS("bs", f3(this.sd2)); labExtra(`<p style="margin:8px 0 0">Your one sample's average is <b>${f3(this.m1)}</b>. Bootstrap 95% interval: [${f3(this.ci[0])}, ${f3(this.ci[1])}], which ${this.ci[0] <= 0 && this.ci[1] >= 0 ? "contains" : "misses"} the true mean 0. Run it many times: it contains 0 about 95% of the time. That's what a confidence interval promises, and nothing more (Murphy §4.7.5).</p>`); },
  draw() {
    if (!this.ex) return; const se = 1 / Math.sqrt(this.p.n), lo = -4.5 * se, hi = 4.5 * se, nb = 36, w = (hi - lo) / nb, h = a => { const c = new Array(nb).fill(0); for (const v of a) { const k = Math.floor((v - lo) / w); if (k >= 0 && k < nb) c[k]++; } return c; }, A = h(this.ex), B = h(this.bs), mx = Math.max(...A, ...B);
    for (let k = 0; k < nb; k++) { const x = (k - (nb - 1) / 2) * 0.44; V.box(x, 0, -0.7, 0.4, A[k] / mx * 5.5 + 0.03, 1, C.c2, null); V.box(x, 0, 0.7, 0.4, B[k] / mx * 5.5 + 0.03, 1, C.c4, null); }
    V.box(0, 0, 2, 0.12, 0.12, 0.12, C.c3, null); Ln.seg(0, 0.02, -1.5, 0, 0.02, 2, C.c3);
    const sx = x => clamp(x / (4.5 * se) * 7.9, -8, 8); for (const v of this.one) V.box(sx(v), 0, 3.4, 0.16, 0.16, 0.16, C.ink, null);
    V.box(sx(this.m1), 0, 3.4, 0.14, 0.8, 0.14, C.c1, null); pin(sx(this.m1), 1.1, 3.4, "your sample's average", "hot");
  },
  state() { return `population ${this.p.pop === "g" ? "Gaussian" : "skewed exponential"}, sample size n=${this.p.n}; true SE ${f3(1 / Math.sqrt(this.p.n))}, measured spread ${f3(this.sd1)}, bootstrap SE ${f3(this.sd2)}.`; }
});

/* ---------- M5 · decisions, ROC ---------- */
const Phi = x => 0.5 * (1 + Math.sign(x) * Math.sqrt(1 - Math.exp(-2 * x * x / Math.PI)));
lab("m5roc", {
  title: "Where to draw the line: thresholds, costs, ROC", tab: "ROC", cam: [[0, 10, 17], [0, 1.2, 0]],
  how: "A classifier gives each case a score. Blue towers: how scores are spread for negatives; orange: for positives (heights include how common each class is). Everything right of the yellow wall is called positive. Slide it: you trade false alarms for misses. The green wall is the threshold that minimises expected cost for your chosen costs, from Bayes decision theory.",
  legend: () => `<b>Score distributions</b><div class="row"><span><i class="sw" style="background:var(--c2)"></i>negatives</span><span><i class="sw" style="background:var(--c1)"></i>positives</span><span><i class="sw" style="background:var(--c4)"></i>your threshold</span><span><i class="sw" style="background:var(--c3)"></i>best threshold</span></div>`,
  ctl: [{ s: "d", label: "Separation d′", min: 0, max: 4, step: 0.05, v: 1.5, fmt: f2 }, { s: "t", label: "Threshold", min: -3, max: 5, step: 0.05, v: 0.75, fmt: f2 }, { s: "pi", label: "P(positive)", min: 0.05, max: 0.95, step: 0.01, v: 0.3, fmt: f2 }, { s: "cr", label: "Cost of a miss ÷ false alarm", min: -1, max: 1.3, step: 0.05, v: 0, fmt: v => Math.pow(10, v).toPrecision(2) + "×" }],
  stats: [["tpr", "Recall (TPR)"], ["fpr", "False alarm rate"], ["pr", "Precision"]], chart: "ROC curve: every threshold at once", chartLegend: `<span><i style="background:var(--c2)"></i>ROC</span><span><i style="background:var(--c4)"></i>you</span>`,
  change() { this.refresh(); },
  best() { const p = this.p, cr = Math.pow(10, p.cr); return p.d < 0.01 ? (p.pi * cr > 1 - p.pi ? -3 : 5) : p.d / 2 + Math.log((1 - p.pi) / (p.pi * cr)) / p.d; },
  refresh() {
    const p = this.p, tpr = 1 - Phi(p.t - p.d), fpr = 1 - Phi(p.t), prec = p.pi * tpr / Math.max(1e-9, p.pi * tpr + (1 - p.pi) * fpr), cr = Math.pow(10, p.cr), cost = t => (1 - p.pi) * (1 - Phi(t)) * 1 + p.pi * Phi(t - p.d) * cr, tb = this.best();
    setS("tpr", pct(tpr)); setS("fpr", pct(fpr)); setS("pr", pct(prec));
    const curve = []; for (let t = 6; t >= -4; t -= 0.1) curve.push([1 - Phi(t), 1 - Phi(t - p.d)]);
    xyChart($("#lab-chart"), curve, [fpr, tpr], ["false alarm rate →   (y: recall)"]);
    labExtra(`<p style="margin:8px 0 0">Expected cost per case: yours <b>${f3(cost(p.t))}</b>, best possible <b>${f3(cost(clamp(tb, -3, 5)))}</b> at threshold ${f2(tb)}. Rule (Murphy §5.1.2): say "positive" when P(pos | score) × cost of a miss &gt; P(neg | score) × cost of a false alarm. Area under this ROC: ${f3(Phi(p.d / Math.SQRT2))}.</p>`);
  },
  draw() {
    const p = this.p, n = 60, X = s => (s - 1) / 7 * 16 * 0.55 + 0, pdf = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
    for (let i = 0; i < n; i++) { const s = -3 + (i + 0.5) * 8 / n, x = (i - (n - 1) / 2) * 0.27, on = s >= p.t; V.box(x, 0, -0.8, 0.24, (1 - p.pi) * pdf(s) * 14 + 0.03, 1.2, on ? C.c2 : mix(C.c2, C.bg, 0.65), null); V.box(x, 0, 0.8, 0.24, p.pi * pdf(s - p.d) * 14 + 0.03, 1.2, on ? C.c1 : mix(C.c1, C.bg, 0.65), null); }
    const wx = s => ((s + 3) / 8 * n - 0.5 - (n - 1) / 2) * 0.27;
    for (let z = -2; z <= 2; z++) V.box(wx(p.t), 0, z * 0.6, 0.12, 4, 0.5, C.c4, null);
    const tb = clamp(this.best(), -3, 5); for (let z = -2; z <= 2; z++) V.box(wx(tb), 0, z * 0.6 + 3.4, 0.12, 1.5, 0.5, C.c3, null);
    pin(wx(p.t), 4.4, 0, "threshold", "soft"); pin(wx(tb), 1.9, 4.6, "best for these costs", "ok"); pin(8.4, 0.1, 0, "score →", "flat");
  },
  state() { const p = this.p; return `separation d'=${p.d}, threshold=${p.t}, P(positive)=${p.pi}, miss costs ${Math.pow(10, p.cr).toPrecision(2)}× a false alarm; recall ${$("#LS-tpr")?.textContent}, false alarm rate ${$("#LS-fpr")?.textContent}, precision ${$("#LS-pr")?.textContent}, best threshold ${f2(this.best())}.`; }
});

/* ---------- M6 · entropy, cross-entropy, KL ---------- */
lab("m6info", {
  title: "Sculpt a distribution: entropy and KL", tab: "Entropy & KL", cam: [[0, 12, 15], [0, 1.5, 0.5]],
  how: "Back row: distribution p over 8 outcomes (orange). Middle row: a model q of it (blue). Tap any block in a row to add weight to that outcome (switch to Remove to take weight away). Front row (yellow): the surprise −log₂ p of each outcome. Entropy H(p) is the average of that surprise. KL(p‖q) is how many extra bits you pay per outcome by using q's code when the truth is p.",
  legend: () => `<b>Two distributions over 8 outcomes</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>p (truth)</span><span><i class="sw" style="background:var(--c2)"></i>q (model)</span><span><i class="sw" style="background:var(--c4)"></i>surprise −log₂ p</span></div>`,
  ctl: [{ seg: "mode", label: "Tap", opts: [["add", "Tap adds"], ["rem", "Tap removes"]], v: "add" }, { btns: [["pu", "p uniform"], ["pk", "p peaked"], ["p1", "p certain"], ["qu", "q uniform"], ["qp", "q = p", true]] }],
  stats: [["h", "H(p) bits"], ["ce", "H(p, q) cross-entropy"], ["kl", "KL(p ‖ q)"]],
  init() { this.P = [8, 6, 4, 3, 2, 1, 1, 1]; this.Q = [1, 1, 1, 1, 1, 1, 1, 1]; },
  norm(a) { const s = a.reduce((x, y) => x + y, 0); return a.map(v => v / s); },
  act(a) { if (a === "pu") this.P = new Array(8).fill(3); if (a === "pk") this.P = [20, 3, 1, 1, 1, 1, 1, 1]; if (a === "p1") this.P = [1, 0, 0, 0, 0, 0, 0, 0]; if (a === "qu") this.Q = new Array(8).fill(1); if (a === "qp") this.Q = [...this.P]; this.refresh(); },
  refresh() {
    const p = this.norm(this.P), q = this.norm(this.Q), lg = Math.log2; let H = 0, CE = 0; for (let i = 0; i < 8; i++) if (p[i] > 0) { H -= p[i] * lg(p[i]); CE -= p[i] * (q[i] > 0 ? lg(q[i]) : -Infinity); }
    setS("h", f3(H)); setS("ce", isFinite(CE) ? f3(CE) : "∞"); setS("kl", isFinite(CE) ? f3(CE - H) : "∞");
    labExtra(`<p style="margin:8px 0 0">Check: H(p, q) = H(p) + KL(p‖q) → ${isFinite(CE) ? `${f3(CE)} = ${f3(H)} + ${f3(CE - H)}` : "∞, because q gives zero probability to something p says can happen"}. Uniform over 8 outcomes gives the maximum, log₂ 8 = 3 bits. A certain outcome gives 0. When you train with cross-entropy, H(p) is fixed by the data, so minimising cross-entropy <i>is</i> minimising KL: making the model's distribution match the data's (Murphy §6.2.5).</p>`);
  },
  onPick(t) { if (!t || t.row == null) return; const arr = t.row === "p" ? this.P : this.Q; if (this.p.mode === "add") arr[t.i] += 1; else if (arr[t.i] > 0 && arr.reduce((a, b) => a + b) > 1) arr[t.i] -= 1; this.refresh(); },
  onHover(t) { if (t && t.row) { const p = this.norm(this.P), q = this.norm(this.Q); return `outcome ${t.i + 1}\np = ${f3(p[t.i])}, q = ${f3(q[t.i])}\nsurprise −log₂ p = ${p[t.i] > 0 ? f2(-Math.log2(p[t.i])) : "∞"} bits\ntap to ${this.p.mode === "add" ? "add" : "remove"}`; } },
  draw() {
    const p = this.norm(this.P), q = this.norm(this.Q);
    for (let i = 0; i < 8; i++) { const x = (i - 3.5) * 1.6; V.box(x, 0, -2.4, 1.2, p[i] * 9 + 0.04, 1.2, C.c1, { row: "p", i }); V.box(x, 0, 0, 1.2, q[i] * 9 + 0.04, 1.2, C.c2, { row: "q", i }); const s = p[i] > 0 ? -Math.log2(p[i]) : 7; V.box(x, 0, 2.4, 1.2, Math.min(s, 7) * 0.6 + 0.04, 1.2, p[i] > 0 ? C.c4 : C.line, { row: "p", i }); if (p[i] === 0) pin(x, 0.6, 2.4, "∞", "flat"); }
    pin(-7.4, 0.3, -2.4, "p", "flat"); pin(-7.4, 0.3, 0, "q", "flat"); pin(-7.4, 0.3, 2.4, "−log₂ p", "flat");
  },
  state() { return `p=[${this.norm(this.P).map(f2)}], q=[${this.norm(this.Q).map(f2)}]; H(p)=${$("#LS-h")?.textContent} bits, cross-entropy=${$("#LS-ce")?.textContent}, KL=${$("#LS-kl")?.textContent}.`; }
});

/* ---------- M7 · a matrix as a transformation ---------- */
function svd2(a, b, c, d) { const E = (a + d) / 2, F = (a - d) / 2, G = (c + b) / 2, H = (c - b) / 2, Q = Math.hypot(E, H), R = Math.hypot(F, G), a1 = Math.atan2(G, F), a2 = Math.atan2(H, E); return { s1: Q + R, s2: Q - R, th: (a2 - a1) / 2, ph: (a2 + a1) / 2 }; }
const rot = (t, [x, y]) => [Math.cos(t) * x - Math.sin(t) * y, Math.sin(t) * x + Math.cos(t) * y];
lab("m7mat", {
  title: "A matrix is a way of moving space", tab: "Matrices", cam: [[0, 16, 10], [0, 0, 0]],
  how: "Faint tiles are the original points (a toy face, or a grid). Blue blocks are where the matrix A = [[a, b], [c, d]] sends them: (x, y) → (a·x + b·y, c·x + d·y). Orange lines are eigenvectors: directions A only stretches, without turning. Drag 'SVD steps' from 0 to 3 to watch A happen as rotate, then stretch, then rotate. Every matrix does exactly that.",
  legend: () => `<b>y = A x</b><div class="row"><span><i class="sw" style="background:var(--line)"></i>before</span><span><i class="sw" style="background:var(--c2)"></i>after</span><span><i class="sw" style="background:var(--c1)"></i>eigenvectors</span></div>`,
  ctl: [{ s: "a", label: "a", min: -2, max: 2, step: 0.05, v: 1.2, fmt: f2 }, { s: "b", label: "b", min: -2, max: 2, step: 0.05, v: 0.5, fmt: f2 }, { s: "c", label: "c", min: -2, max: 2, step: 0.05, v: 0.2, fmt: f2 }, { s: "d", label: "d", min: -2, max: 2, step: 0.05, v: 0.8, fmt: f2 }, { s: "t", label: "SVD steps", min: 0, max: 3, step: 0.01, v: 3, fmt: v => v < 1 ? "rotate Vᵀ" : v < 2 ? "stretch Σ" : v < 3 ? "rotate U" : "done = A" },
    { seg: "shape", label: "Shape", opts: [["face", "Face"], ["grid", "Grid"]], v: "face" }, { btns: [["rot", "Rotate 30°"], ["shear", "Shear"], ["str", "Stretch"], ["ref", "Mirror"], ["sing", "Squash flat (singular)"]] }],
  stats: [["det", "det A (area ×)"], ["ev", "Eigenvalues"], ["sv", "Singular values"]],
  pts() { if (this.p.shape === "grid") { const o = []; for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) o.push([i / 5, j / 5, (i + j) & 1]); return o; } const im = makeFace(rng(2), { smile: 0.9, gap: 2, ey: 3, bags: false, shade: 0.9 }).im, o = []; for (let k = 0; k < 144; k++) if (im[k] < 0.6 || im[k] > 0.85) o.push([(k % 12 - 5.5) / 5.5, -((k / 12 | 0) - 5.5) / 5.5, im[k] < 0.6 ? 1 : 0]); return o; },
  act(k) { const P = { rot: [Math.cos(0.52), -Math.sin(0.52), Math.sin(0.52), Math.cos(0.52)], shear: [1, 0.8, 0, 1], str: [1.8, 0, 0, 0.5], ref: [-1, 0, 0, 1], sing: [1, 0.5, 2, 1] }[k];[this.p.a, this.p.b, this.p.c, this.p.d] = P; this.p.t = 3; renderLab(this); },
  change() { this.refresh(); },
  refresh() { const { a, b, c, d } = this.p, det = a * d - b * c, tr = a + d, disc = tr * tr / 4 - det, s = svd2(a, b, c, d); setS("det", f2(det)); setS("ev", disc >= 0 ? `${f2(tr / 2 + Math.sqrt(disc))}, ${f2(tr / 2 - Math.sqrt(disc))}` : "complex (it rotates)"); setS("sv", `${f2(Math.abs(s.s1))}, ${f2(Math.abs(s.s2))}`); labExtra(`<p style="margin:8px 0 0">${Math.abs(det) < 0.02 ? "det ≈ 0: the matrix flattens the plane onto a line. Information is destroyed, so there is no inverse (Murphy §7.3). " : det < 0 ? "det &lt; 0: the face is mirrored. " : ""}Singular values are the stretch factors along the matrix's own preferred axes. The largest is how much A can stretch any vector at most. Keeping only the biggest singular values is truncated SVD, the same as PCA (§7.5.5).</p>`); },
  apply([x, y]) { const p = this.p, t = p.t; if (t >= 3) return [p.a * x + p.b * y, p.c * x + p.d * y]; const s = svd2(p.a, p.b, p.c, p.d); let v = rot(s.th * clamp(t, 0, 1), [x, y]); if (t > 1) { const u = clamp(t - 1, 0, 1); v = [v[0] * (1 + (s.s1 - 1) * u), v[1] * (1 + (s.s2 - 1) * u)]; } if (t > 2) v = rot(s.ph * clamp(t - 2, 0, 1), v); return v; },
  draw() {
    const S = 3;
    for (let i = -8; i <= 8; i++) { Ln.seg(i * S / 4, 0, -8, i * S / 4, 0, 8, C.line); Ln.seg(-8, 0, i * S / 4, 8, 0, i * S / 4, C.line); }
    for (const [x, y, k] of this.pts()) { V.box(x * S, 0, -y * S, 0.36, 0.06, 0.36, C.line, null); const [u, v] = this.apply([x, y]); V.box(u * S, 0.06, -v * S, 0.38, k ? 0.5 : 0.22, 0.38, k ? C.c2 : mix(C.c2, C.bg, 0.5), null); }
    const { a, b, c, d } = this.p, tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det;
    if (disc >= 0 && this.p.t >= 3) for (const l of [tr / 2 + Math.sqrt(disc), tr / 2 - Math.sqrt(disc)]) { let vx = b, vy = l - a; if (Math.abs(b) < 1e-9 && Math.abs(vy) < 1e-9) { vx = l - d; vy = c; } if (Math.abs(vx) < 1e-9 && Math.abs(vy) < 1e-9) { vx = 1; vy = 0; } const n = Math.hypot(vx, vy), L = Math.max(0.3, Math.abs(l)) * S * 1.2; Ln.seg(-vx / n * L, 0.2, vy / n * L, vx / n * L, 0.2, -vy / n * L, C.c1); pin(vx / n * L, 0.3, -vy / n * L, `λ=${f2(l)}`, "hot"); }
  },
  state() { const { a, b, c, d } = this.p; return `A=[[${a}, ${b}], [${c}, ${d}]], det=${$("#LS-det")?.textContent}, eigenvalues ${$("#LS-ev")?.textContent}, singular values ${$("#LS-sv")?.textContent}, animation step ${this.p.t}.`; }
});

/* ---------- M8 · optimizer race ---------- */
const TER = {
  bowl: { n: "Narrow valley", f: (x, y) => 0.5 * (x * x + 12 * y * y), s: [-1.8, 0.8] },
  rosen: { n: "Banana (Rosenbrock)", f: (x, y) => (1 - x) ** 2 + 8 * (y - x * x) ** 2, s: [-1.5, 1.6] },
  bumpy: { n: "Bumpy", f: (x, y) => x * x + y * y + 0.6 * (2 - Math.cos(4 * x) - Math.cos(4 * y)), s: [1.7, -1.6] }
};
lab("m8opt", {
  title: "Optimizer race: GD vs momentum vs Adam", tab: "Optimizers", cam: [[0, 15, 15], [0, 1, 0]],
  how: "Three balls start at the same spot on the same loss terrain. Blue is plain gradient descent, green adds momentum (it keeps some of its speed, Murphy §8.2.4), orange is Adam (a separate step size for each direction, D2L §12.10). Try the narrow valley: GD zig-zags across it while momentum and Adam run along it. Add gradient noise to see what minibatch SGD feels like. Tap the terrain to move the start.",
  legend: () => `<b>${TER[LAB.m8opt.p.ter].n}</b><div class="row"><span><i class="sw" style="background:var(--c2)"></i>GD</span><span><i class="sw" style="background:var(--c3)"></i>momentum</span><span><i class="sw" style="background:var(--c1)"></i>Adam</span></div>`,
  ctl: [{ seg: "ter", label: "Terrain", opts: Object.entries(TER).map(([k, v]) => [k, v.n]), v: "bowl" }, { s: "lr", label: "Step size (log₁₀)", min: -3, max: -0.3, step: 0.05, v: -1.3, fmt: v => Math.pow(10, v).toPrecision(2) }, { s: "noise", label: "Gradient noise", min: 0, max: 3, step: 0.05, v: 0, fmt: f2 }, { btns: [["run", "Run", true], ["rs", "Restart"]] }],
  stats: [["gd", "GD loss"], ["mo", "Momentum loss"], ["ad", "Adam loss"]], chart: "Loss per step (log scale)", chartLegend: `<span><i style="background:var(--c2)"></i>GD</span><span><i style="background:var(--c3)"></i>momentum</span><span><i style="background:var(--c1)"></i>Adam</span>`,
  init() { this.start = TER.bowl.s.slice(); this.reset(); },
  reset() { const s = this.start; this.B = { gd: { x: s.slice(), tr: [] }, mo: { x: s.slice(), v: [0, 0], tr: [] }, ad: { x: s.slice(), m: [0, 0], v: [0, 0], t: 0, tr: [] } }; this.hist = { gd: [], mo: [], ad: [] }; this.n = 0; this.cache = null; },
  act(a) { if (a === "run") { this.running = !this.running; $("#LB-run").textContent = this.running ? "Pause" : "Run"; } if (a === "rs") { this.reset(); this.refresh(); } },
  change(k) { if (k === "ter") { this.start = TER[this.p.ter].s.slice(); this.reset(); $("#legend").innerHTML = this.legend(); } this.refresh(); },
  exit() { this.running = false; },
  f(x, y) { return TER[this.p.ter].f(x, y); },
  grad([x, y]) { const h = 1e-4, f = this.f.bind(this), r = this.p.noise; return [(f(x + h, y) - f(x - h, y)) / (2 * h) + randn(R0) * r, (f(x, y + h) - f(x, y - h)) / (2 * h) + randn(R0) * r]; },
  step() {
    const lr = Math.pow(10, this.p.lr), B = this.B, cl = v => clamp(v, -2.5, 2.5);
    let g = this.grad(B.gd.x); B.gd.x = [cl(B.gd.x[0] - lr * g[0]), cl(B.gd.x[1] - lr * g[1])];
    g = this.grad(B.mo.x); B.mo.v = [0.9 * B.mo.v[0] + g[0], 0.9 * B.mo.v[1] + g[1]]; B.mo.x = [cl(B.mo.x[0] - lr * B.mo.v[0]), cl(B.mo.x[1] - lr * B.mo.v[1])];
    g = this.grad(B.ad.x); const A = B.ad; A.t++; for (let i = 0; i < 2; i++) { A.m[i] = 0.9 * A.m[i] + 0.1 * g[i]; A.v[i] = 0.999 * A.v[i] + 0.001 * g[i] * g[i]; const mh = A.m[i] / (1 - 0.9 ** A.t), vh = A.v[i] / (1 - 0.999 ** A.t); A.x[i] = cl(A.x[i] - lr * 3 * mh / (Math.sqrt(vh) + 1e-8)); }
    for (const k of ["gd", "mo", "ad"]) { B[k].tr.push(B[k].x.slice()); if (B[k].tr.length > 150) B[k].tr.shift(); this.hist[k].push(Math.log10(this.f(...B[k].x) + 1e-6)); if (this.hist[k].length > 300) this.hist[k].shift(); }
    this.n++;
  },
  tick() { if (this.running) { this.step(); if (this.n % 5 === 0) this.refresh(); } },
  refresh() { if (!this.B) return; setS("gd", f3(this.f(...this.B.gd.x))); setS("mo", f3(this.f(...this.B.mo.x))); setS("ad", f3(this.f(...this.B.ad.x))); if (cur === this) lineChart($("#lab-chart"), [{ data: this.hist.gd, color: tok("--c2") }, { data: this.hist.mo, color: tok("--c3") }, { data: this.hist.ad, color: tok("--c1") }], { xlabel: "step →  (y = log₁₀ loss)" }); labExtra(`<p style="margin:8px 0 0">Adam here uses 3× the step size, as its steps are normalised to about 1 per coordinate. Push the step size up until GD blows up: the narrow direction of the valley has curvature 12, so GD becomes unstable once η &gt; 2/12 ≈ 0.17 (Murphy §8.2.2).</p>`); },
  H(x, y) { const v = this.f(x, y), mx = this.fmax || 1; return 4.5 * Math.log1p(v) / Math.log1p(mx); },
  draw() {
    const G = 44, cs = 14 / G; if (!this.cache || this.cache.t !== this.p.ter) { let mx = 0; const T = []; for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const v = this.f(-2.5 + (i + 0.5) * 5 / G, -2.5 + (j + 0.5) * 5 / G); T.push(v); mx = Math.max(mx, v); } this.fmax = mx; this.cache = { t: this.p.ter, T }; }
    const W = x => x / 2.5 * 7;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const h = this.H(-2.5 + (i + 0.5) * 5 / G, -2.5 + (j + 0.5) * 5 / G); V.box(-7 + (i + 0.5) * cs, 0, -7 + (j + 0.5) * cs, cs * 0.95, h + 0.04, cs * 0.95, mix3(C.panel, C.c5, C.ink, h / 4.5), { ter: [-2.5 + (i + 0.5) * 5 / G, -2.5 + (j + 0.5) * 5 / G] }); }
    for (const [k, c] of [["gd", C.c2], ["mo", C.c3], ["ad", C.c1]]) { const b = this.B[k]; let prev = null; for (const p of b.tr) { const q = [W(p[0]), this.H(...p) + 0.12, W(p[1])]; if (prev) Ln.seg(...prev, ...q, c); prev = q; } V.box(W(b.x[0]), this.H(...b.x) + 0.05, W(b.x[1]), 0.45, 0.45, 0.45, c, null); }
  },
  onPick(t) { if (t && t.ter) { this.start = t.ter.slice(); this.reset(); this.refresh(); } },
  state() { return `terrain ${TER[this.p.ter].n}, step size ${Math.pow(10, this.p.lr).toPrecision(2)}, gradient noise ${this.p.noise}, ${this.n} steps; losses GD ${$("#LS-gd")?.textContent}, momentum ${$("#LS-mo")?.textContent}, Adam ${$("#LS-ad")?.textContent}.`; }
});
