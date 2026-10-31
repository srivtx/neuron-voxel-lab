"use strict";
/* ================= utilities ================= */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sig = z => 1 / (1 + Math.exp(-z));
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function randn(r) { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const f2 = v => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(2), f3 = v => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(3);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let toastT; function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }
function goal(listId, g) { const li = document.querySelector(`#${listId} li[data-g="${g}"]`); if (li && !li.classList.contains("done")) { li.classList.add("done"); toast("Goal done: " + li.textContent.trim().slice(0, 60)); } }

/* ================= theme colours ================= */
const C = {};
function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
const scratch = Array.from({ length: 8 }, () => new THREE.Color()); let si = 0;
function mix(a, b, t) { const c = scratch[si++ & 7]; return c.copy(a).lerp(b, clamp(t, 0, 1)); }
function mix3(a, b, c3, t) { t = clamp(t, 0, 1); return t < 0.5 ? mix(a, b, t * 2) : mix(b, c3, (t - 0.5) * 2); }
const FACE_INK = new THREE.Color("#1b2230"), FACE_SKIN = new THREE.Color("#f3e7d5");
function grey(v) { return mix(FACE_INK, FACE_SKIN, v); } /* pixel value 0=ink, 1=skin; fixed so faces read the same in both themes */

/* ================= three.js stage ================= */
const canvas = $("#gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 600);
const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.09; controls.maxPolarAngle = Math.PI * 0.49;
const hemi = new THREE.HemisphereLight(0xffffff, 0x7a8696, 0.78); scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.62); dir.position.set(9, 22, 14); scene.add(dir);
function readTheme() {
  for (const k of ["bg", "panel", "card", "ink", "muted", "line", "c1", "c2", "c3", "c4", "c5", "skin"]) C[k] = new THREE.Color(tok("--" + k) || "#888");
  renderer.setClearColor(C.bg);
  if (typeof cur !== "undefined" && cur && cur.onTheme) cur.onTheme();
}
const MAX = 16000;
const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), MAX);
mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
mesh.frustumCulled = false; scene.add(mesh);
const M4 = new THREE.Matrix4();
const V = {
  n: 0, tags: [],
  begin() { this.n = 0; this.tags.length = 0; },
  box(x, y, z, sx, sy, sz, col, tag) { if (this.n >= MAX) return; if (!(sy > 0.002)) sy = 0.002; M4.makeScale(sx, sy, sz); M4.setPosition(x, y + sy / 2, z); mesh.setMatrixAt(this.n, M4); mesh.setColorAt(this.n, col); this.tags[this.n] = tag; this.n++; },
  end() { mesh.count = this.n; mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; }
};
const LMAX = 12000, lpos = new Float32Array(LMAX * 6), lcol = new Float32Array(LMAX * 6);
const lgeo = new THREE.BufferGeometry();
lgeo.setAttribute("position", new THREE.BufferAttribute(lpos, 3).setUsage(THREE.DynamicDrawUsage));
lgeo.setAttribute("color", new THREE.BufferAttribute(lcol, 3).setUsage(THREE.DynamicDrawUsage));
const lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7 }));
lines.frustumCulled = false; scene.add(lines);
const Ln = {
  n: 0, begin() { this.n = 0; },
  seg(x1, y1, z1, x2, y2, z2, c) { if (this.n >= LMAX) return; const o = this.n * 6; lpos[o] = x1; lpos[o + 1] = y1; lpos[o + 2] = z1; lpos[o + 3] = x2; lpos[o + 4] = y2; lpos[o + 5] = z2; lcol[o] = lcol[o + 3] = c.r; lcol[o + 1] = lcol[o + 4] = c.g; lcol[o + 2] = lcol[o + 5] = c.b; this.n++; },
  end() { lgeo.setDrawRange(0, this.n * 2); lgeo.attributes.position.needsUpdate = true; lgeo.attributes.color.needsUpdate = true; }
};
let PINS = []; const pinPool = []; const pinsEl = $("#pins"); const pv = new THREE.Vector3();
function pin(x, y, z, text, cls = "") { PINS.push({ x, y, z, text, cls }); }
function placePins() {
  const r = canvas.getBoundingClientRect();
  while (pinPool.length < PINS.length) { const d = document.createElement("div"); pinsEl.appendChild(d); pinPool.push(d); }
  pinPool.forEach((d, i) => {
    const p = PINS[i]; if (!p) { d.hidden = true; return; }
    pv.set(p.x, p.y, p.z).project(camera);
    if (pv.z > 1) { d.hidden = true; return; }
    d.hidden = false; d.className = "pin " + p.cls; if (d.textContent !== p.text) d.textContent = p.text;
    d.style.left = ((pv.x + 1) / 2 * r.width) + "px"; d.style.top = ((1 - pv.y) / 2 * r.height) + "px";
  });
}
function resize() { const r = canvas.parentElement.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(canvas.parentElement);

/* camera moves */
let camAnim = null;
function flyTo(pos, target) { camAnim = { t: 0, p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...pos), t1: new THREE.Vector3(...target) }; }

/* picking */
const ray = new THREE.Raycaster(), mv = new THREE.Vector2();
function pick(ev) {
  const r = canvas.getBoundingClientRect(); mv.set((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(mv, camera); const hit = ray.intersectObject(mesh, false)[0];
  return hit && hit.instanceId != null ? V.tags[hit.instanceId] : null;
}
let downAt = null;
canvas.addEventListener("pointerdown", e => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener("pointerup", e => {
  if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 6) { const t = pick(e); if (t != null && cur.onPick) cur.onPick(t); }
  downAt = null;
});
const tipEl = $("#tip");
canvas.addEventListener("pointermove", e => {
  if (e.buttons) { tipEl.hidden = true; return; }
  const t = pick(e); const s = t != null && cur.onHover ? cur.onHover(t) : null;
  if (s) { const r = canvas.getBoundingClientRect(); tipEl.hidden = false; tipEl.textContent = s; tipEl.style.left = (e.clientX - r.left) + "px"; tipEl.style.top = (e.clientY - r.top) + "px"; canvas.style.cursor = "pointer"; }
  else { tipEl.hidden = true; canvas.style.cursor = ""; }
});
canvas.addEventListener("pointerleave", () => tipEl.hidden = true);

/* ================= tiny neural net library (used by stations 5, 7, 8) ================= */
class Net {
  constructor(sizes, acts, seed = 1) {
    const r = rng(seed); this.L = []; this.t = 0;
    for (let i = 0; i < sizes.length - 1; i++) {
      const I = sizes[i], O = sizes[i + 1], W = new Float32Array(I * O), s = Math.sqrt((acts[i] === "relu" ? 2 : 1) / I);
      for (let k = 0; k < W.length; k++) W[k] = randn(r) * s;
      this.L.push({ I, O, act: acts[i], W, b: new Float32Array(O), gW: new Float32Array(I * O), gb: new Float32Array(O), mW: new Float32Array(I * O), vW: new Float32Array(I * O), mb: new Float32Array(O), vb: new Float32Array(O) });
    }
  }
  forward(X, B) {
    let h = X; this.cache = [h];
    for (const l of this.L) {
      const { I, O, W, b, act } = l, out = new Float32Array(B * O);
      for (let n = 0; n < B; n++) for (let o = 0; o < O; o++) {
        let s = b[o]; const wo = o * I, xn = n * I;
        for (let i = 0; i < I; i++) s += h[xn + i] * W[wo + i];
        out[n * O + o] = act === "tanh" ? Math.tanh(s) : act === "relu" ? (s > 0 ? s : 0) : act === "sigmoid" ? sig(s) : s;
      }
      this.cache.push(out); h = out;
    }
    return h;
  }
  /* d = dLoss/d(output). If pre=true, d is already dLoss/d(pre-activation) of the last layer. */
  backward(d, B, pre = false) {
    for (let li = this.L.length - 1; li >= 0; li--) {
      const l = this.L[li], { I, O, W, act } = l, hin = this.cache[li], out = this.cache[li + 1];
      const dz = new Float32Array(B * O);
      for (let k = 0; k < B * O; k++) {
        const y = out[k];
        dz[k] = (pre && li === this.L.length - 1) ? d[k] : d[k] * (act === "tanh" ? 1 - y * y : act === "relu" ? (y > 0 ? 1 : 0) : act === "sigmoid" ? y * (1 - y) : 1);
      }
      const din = li > 0 ? new Float32Array(B * I) : null;
      for (let n = 0; n < B; n++) for (let o = 0; o < O; o++) {
        const g = dz[n * O + o]; if (g === 0) continue; l.gb[o] += g; const wo = o * I, xn = n * I;
        for (let i = 0; i < I; i++) { l.gW[wo + i] += g * hin[xn + i]; if (din) din[xn + i] += g * W[wo + i]; }
      }
      d = din;
    }
  }
  step(lr) {
    this.t++; const b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
    for (const l of this.L) for (const [p, g, m, v] of [[l.W, l.gW, l.mW, l.vW], [l.b, l.gb, l.mb, l.vb]]) {
      for (let k = 0; k < p.length; k++) { const gk = g[k]; m[k] = b1 * m[k] + (1 - b1) * gk; v[k] = b2 * v[k] + (1 - b2) * gk * gk; p[k] -= lr * (m[k] / c1) / (Math.sqrt(v[k] / c2) + 1e-8); g[k] = 0; }
    }
  }
}

/* ================= toy faces (identical recipe in the Colab notebook) ================= */
function makeFace(r, o = {}) {
  const im = new Float32Array(144), shade = o.shade ?? (0.72 + 0.28 * r());
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) im[y * 12 + x] = ((y - 5.5) ** 2 + (x - 5.5) ** 2 <= 5.3 * 5.3) ? shade : 0.3;
  const ey = o.ey ?? (3 + Math.floor(r() * 2)), gap = o.gap ?? (1 + Math.floor(r() * 3)), lx = 5 - gap, rx = 6 + gap;
  for (const x of [lx, rx]) { im[ey * 12 + x] = 0.05; im[(ey + 1) * 12 + x] = 0.05; }
  const bags = o.bags ?? (r() < 0.5);
  if (bags) for (const x of [lx, rx]) im[(ey + 2) * 12 + x] = 0.5;
  const s = o.smile ?? (r() * 2 - 1);
  for (let x = 3; x <= 8; x++) { const u = (x - 5.5) / 2.5, y = 8 - Math.round(s * u * u * 1.6); im[y * 12 + x] = 0.05; }
  return { im, smile: s > 0, s, bags };
}
function faceSet(n, seed) { const r = rng(seed), X = new Float32Array(n * 144), meta = []; for (let i = 0; i < n; i++) { const f = makeFace(r); X.set(f.im, i * 144); meta.push(f); } return { X, meta, n }; }
function drawFace2D(cv, im) {
  const g = cv.getContext("2d"), d = g.createImageData(12, 12);
  const a = [FACE_INK.r, FACE_INK.g, FACE_INK.b].map(v => v * 255), b = [FACE_SKIN.r, FACE_SKIN.g, FACE_SKIN.b].map(v => v * 255);
  for (let k = 0; k < 144; k++) { const v = clamp(im[k], 0, 1); for (let c = 0; c < 3; c++) d.data[k * 4 + c] = a[c] + (b[c] - a[c]) * v; d.data[k * 4 + 3] = 255; }
  g.putImageData(d, 0, 0);
}
function faceGrid(im, cx, cz, cell, tagFn, hScale = 2.2, base = 0) {
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const v = im[y * 12 + x], h = (1 - v) * hScale + 0.12;
    V.box(cx + (x - 5.5) * cell, base, cz + (y - 5.5) * cell, cell * 0.92, h, cell * 0.92, grey(v), tagFn ? tagFn(y * 12 + x) : null);
  }
}

/* ================= small 2-D chart helper ================= */
function lineChart(cv, series, opts = {}) {
  if (!cv) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  cv.width = w * dpr; cv.height = h * dpr; const g = cv.getContext("2d"); g.scale(dpr, dpr); g.clearRect(0, 0, w, h);
  const L = 38, R = 8, T = 8, B = 20;
  let ymin = opts.ymin ?? Infinity, ymax = opts.ymax ?? -Infinity, n = 1;
  for (const s of series) { n = Math.max(n, s.data.length); if (opts.ymin == null) for (const v of s.data) if (isFinite(v)) ymin = Math.min(ymin, v); if (opts.ymax == null) for (const v of s.data) if (isFinite(v)) ymax = Math.max(ymax, v); }
  if (!isFinite(ymin)) { ymin = 0; ymax = 1; } if (ymax - ymin < 1e-6) ymax = ymin + 1;
  const X = i => L + (w - L - R) * (n <= 1 ? 0 : i / (n - 1)), Y = v => T + (h - T - B) * (1 - (clamp(v, ymin, ymax) - ymin) / (ymax - ymin));
  g.strokeStyle = tok("--line"); g.fillStyle = tok("--muted"); g.font = "10.5px " + tok("--f-mono"); g.lineWidth = 1;
  for (let k = 0; k <= 3; k++) { const v = ymin + (ymax - ymin) * k / 3, y = Y(v); g.beginPath(); g.moveTo(L, y); g.lineTo(w - R, y); g.stroke(); g.fillText(v.toFixed(v < 1 ? 3 : 2), 2, y + 3); }
  if (opts.xlabel) g.fillText(opts.xlabel, L, h - 5);
  for (const s of series) {
    g.strokeStyle = s.color; g.lineWidth = s.width || 2; g.setLineDash(s.dash || []); g.beginPath();
    s.data.forEach((v, i) => { const x = s.flat ? (i === 0 ? L : w - R) : X(i); i ? g.lineTo(x, Y(v)) : g.moveTo(x, Y(v)); }); g.stroke(); g.setLineDash([]);
  }
}
function barChart(cv, vals, colors) {
  if (!cv) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  cv.width = w * dpr; cv.height = h * dpr; const g = cv.getContext("2d"); g.scale(dpr, dpr); g.clearRect(0, 0, w, h);
  const L = 34, B = 6, T = 6, mx = Math.max(1e-6, ...vals), bw = (w - L) / vals.length;
  g.fillStyle = tok("--muted"); g.font = "10.5px " + tok("--f-mono"); g.strokeStyle = tok("--line");
  for (let k = 0; k <= 2; k++) { const v = mx * k / 2, y = T + (h - T - B) * (1 - k / 2); g.beginPath(); g.moveTo(L, y); g.lineTo(w, y); g.stroke(); g.fillText(v.toFixed(2), 0, y + 3); }
  vals.forEach((v, i) => { const bh = (h - T - B) * v / mx; g.fillStyle = colors[i]; g.fillRect(L + i * bw + 1, h - B - bh, Math.max(1, bw - 2), bh); });
}

/* ================= shared neuron state (stations 1-4) ================= */
const W = { w1: 0.6, w2: -0.4, b: 0, hard: false };
let D1 = [];
function newData1(seed) {
  const r = rng(seed); D1 = [];
  for (let i = 0; i < 30; i++) { const y = i % 2, cx = y ? 0.9 : -0.9, cy = y ? 0.7 : -0.7; D1.push({ x1: clamp(cx + randn(r) * 0.85, -2.9, 2.9), x2: clamp(cy + randn(r) * 0.85, -2.9, 2.9), y }); }
}
newData1(7);
const neuron = (x1, x2, w = W) => { const z = w.w1 * x1 + w.w2 * x2 + w.b; return w.hard ? (z > 0 ? 1 : 0) : sig(z); };
function bceMean(w1, w2, b) { let s = 0; for (const d of D1) { const a = clamp(sig(w1 * d.x1 + w2 * d.x2 + b), 1e-7, 1 - 1e-7); s -= d.y ? Math.log(a) : Math.log(1 - a); } return s / D1.length; }
const syncers = [];
function setW(k, v) { W[k] = v; syncers.forEach(f => f()); }
function bindW(prefix) {
  for (const k of ["w1", "w2", "b"]) {
    const s = $(`#${prefix}-${k}`), o = $(`#o${prefix.slice(1)}-${k}`);
    s.addEventListener("input", () => setW(k, +s.value));
    syncers.push(() => { s.value = W[k]; o.textContent = f2(W[k]); });
  }
}

/* ================= stations ================= */
const ST = {};
let cur = null;

/* ---------- 1 neuron ---------- */
let s1pick = 0;
ST.s1 = {
  tab: "Neuron", cam: [[0, 13, 19], [0, 1.6, 0]],
  legend: () => `<b>One neuron over the input floor</b><div class="row"><span><i class="sw" style="background:var(--c2)"></i>says 0</span><span><i class="sw" style="background:var(--c1)"></i>says 1</span><span>blocks = labelled examples</span></div>`,
  init() {
    bindW("s1");
    $("#s1-new").onclick = () => { newData1(Math.random() * 1e9 | 0); this.refresh(); };
    $("#s1-sig").onclick = () => { W.hard = false; this.seg(); };
    $("#s1-step").onclick = () => { W.hard = true; this.seg(); goal("g1", "step"); };
    syncers.push(() => this.refresh());
  },
  seg() { $("#s1-sig").setAttribute("aria-pressed", !W.hard); $("#s1-step").setAttribute("aria-pressed", W.hard); this.refresh(); },
  refresh() {
    let ok = 0; for (const d of D1) if ((neuron(d.x1, d.x2) > 0.5) === !!d.y) ok++;
    const acc = ok / D1.length; $("#s1-acc").textContent = Math.round(acc * 100) + "%"; $("#s1-acc").className = acc >= 0.9 ? "ok" : "";
    $("#s1-ang").textContent = Math.round(Math.atan2(-W.w1, W.w2) * 180 / Math.PI) + "°";
    const st = Math.hypot(W.w1, W.w2); $("#s1-st").textContent = f2(st);
    if (acc >= 0.9) goal("g1", "all"); if (acc >= 0.9 && st >= 3) goal("g1", "steep");
    const d = D1[s1pick], z = W.w1 * d.x1 + W.w2 * d.x2 + W.b, a = neuron(d.x1, d.x2);
    $("#s1-flow").innerHTML = `<span class="nd"><b>x₁, x₂</b>${f2(d.x1)}, ${f2(d.x2)}</span><span class="ar">→</span>
      <span class="nd"><b>x₁·w₁ + x₂·w₂ + b</b>${f2(d.x1)}·${f2(W.w1)} + ${f2(d.x2)}·${f2(W.w2)} + ${f2(W.b)} = ${f2(z)}</span><span class="ar">→</span>
      <span class="nd"><b>${W.hard ? "step(z)" : "σ(z)"}</b>${f3(a)}</span><span class="ar">vs</span><span class="nd"><b>label y</b>${d.y}</span>`;
  },
  draw() {
    const G = 24, cs = 0.5;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
      const x1 = -3 + (i + 0.5) * 6 / G, x2 = -3 + (j + 0.5) * 6 / G, a = neuron(x1, x2);
      V.box(x1 * 2, a * 4, x2 * 2, cs * 0.6, 0.16, cs * 0.6, mix3(C.c2, C.card, C.c1, a), null);
      V.box(x1 * 2, -0.08, x2 * 2, cs * 0.96, 0.06, cs * 0.96, (i + j) & 1 ? C.panel : C.line, null);
    }
    D1.forEach((d, i) => { const c = d.y ? C.c1 : C.c2; V.box(d.x1 * 2, d.y * 4 + 0.15, d.x2 * 2, 0.5, 0.5, 0.5, i === s1pick ? C.c4 : mix(c, C.ink, 0.25), { pt: i }); });
    const d = D1[s1pick]; pin(d.x1 * 2, d.y * 4 + 0.7, d.x2 * 2, `y=${d.y}  a=${f2(neuron(d.x1, d.x2))}`, "soft");
    pin(6.6, 0.2, 0, "x₁ →", "flat"); pin(0, 0.2, 6.6, "x₂ →", "flat");
  },
  onPick(t) { if (t && t.pt != null) { s1pick = t.pt; this.refresh(); } },
  onHover(t) { if (t && t.pt != null) { const d = D1[t.pt]; return `x=(${f2(d.x1)}, ${f2(d.x2)})  y=${d.y}\nneuron says ${f3(neuron(d.x1, d.x2))}`; } },
  state: () => `w1=${f2(W.w1)}, w2=${f2(W.w2)}, b=${f2(W.b)}, squash=${W.hard ? "hard step" : "sigmoid"}, accuracy=${$("#s1-acc").textContent} on 30 examples.`
};

/* ---------- 2 loss ---------- */
let lossKind = "bce";
const perLoss = (d) => { const a = clamp(neuron(d.x1, d.x2), 1e-7, 1 - 1e-7); return lossKind === "bce" ? -Math.log(d.y ? a : 1 - a) : (d.y - a) ** 2; };
ST.s2 = {
  tab: "Loss", cam: [[3, 12, 19], [0, 1.8, 0]],
  legend: () => `<b>The gap is the error</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>error column</span><span>tile height = neuron's answer</span></div>`,
  init() {
    bindW("s2");
    $("#s2-bce").onclick = () => { lossKind = "bce"; this.seg(); }; $("#s2-mse").onclick = () => { lossKind = "mse"; this.seg(); };
    syncers.push(() => this.refresh());
  },
  seg() { $("#s2-bce").setAttribute("aria-pressed", lossKind === "bce"); $("#s2-mse").setAttribute("aria-pressed", lossKind === "mse"); this.refresh(); },
  refresh() {
    const ls = D1.map(perLoss), tot = ls.reduce((a, b) => a + b, 0), srt = [...ls].sort((a, b) => b - a);
    $("#s2-L").textContent = f3(tot / ls.length); $("#s2-worst").textContent = f3(srt[0]);
    $("#s2-share").textContent = Math.round((srt[0] + srt[1] + srt[2]) / Math.max(tot, 1e-9) * 100) + "%";
    const order = ls.map((v, i) => i).sort((a, b) => ls[b] - ls[a]);
    if (cur === this) barChart($("#s2-chart"), order.map(i => ls[i]), order.map(i => D1[i].y ? tok("--c1") : tok("--c2")));
  },
  enter() { this.refresh(); },
  draw() {
    const G = 24, cs = 0.5;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
      const x1 = -3 + (i + 0.5) * 6 / G, x2 = -3 + (j + 0.5) * 6 / G, a = neuron(x1, x2);
      V.box(x1 * 2, a * 4, x2 * 2, cs * 0.55, 0.12, cs * 0.55, mix(mix3(C.c2, C.card, C.c1, a), C.bg, 0.45), null);
      V.box(x1 * 2, -0.08, x2 * 2, cs * 0.96, 0.06, cs * 0.96, (i + j) & 1 ? C.panel : C.line, null);
    }
    D1.forEach((d, i) => {
      const a = neuron(d.x1, d.x2), lo = Math.min(a, d.y) * 4, hi = Math.max(a, d.y) * 4, L = perLoss(d);
      V.box(d.x1 * 2, lo + 0.06, d.x2 * 2, 0.2, hi - lo, 0.2, C.c1, { pt: i });
      V.box(d.x1 * 2, d.y * 4 + 0.15, d.x2 * 2, 0.36, 0.36, 0.36, d.y ? C.c1 : C.c2, { pt: i });
      if (L > (lossKind === "bce" ? 1.2 : 0.4)) pin(d.x1 * 2, hi + 0.8, d.x2 * 2, f2(L), "hot");
    });
  },
  onHover(t) { if (t && t.pt != null) { const d = D1[t.pt], a = neuron(d.x1, d.x2); return `y=${d.y}, a=${f3(a)}\ncross-entropy −log p = ${f3(-Math.log(clamp(d.y ? a : 1 - a, 1e-7, 1)))}\nsquared (y−a)² = ${f3((d.y - a) ** 2)}`; } },
  state: () => `loss=${lossKind === "bce" ? "cross-entropy" : "squared error"}, mean loss=${$("#s2-L").textContent}, worst example loss=${$("#s2-worst").textContent}, w1=${f2(W.w1)}, w2=${f2(W.w2)}, b=${f2(W.b)}.`
};

/* ---------- 3 gradient descent ---------- */
const GD = { run: false, n: 0, hist: [], trail: [], start: null, acc: 0, terrain: null, tb: null, tdata: null };
const TG = 40, TR = 4;
function terrain() {
  if (GD.terrain && GD.tb === W.b && GD.tdata === D1) return GD.terrain;
  const T = new Float32Array(TG * TG); for (let i = 0; i < TG; i++) for (let j = 0; j < TG; j++) T[i * TG + j] = bceMean(-TR + (i + 0.5) * 2 * TR / TG, -TR + (j + 0.5) * 2 * TR / TG, W.b);
  GD.terrain = T; GD.tb = W.b; GD.tdata = D1; return T;
}
const hOf = L => clamp(L, 0, 3) * 1.7;
function gdStep() {
  let g1 = 0, g2 = 0; for (const d of D1) { const e = sig(W.w1 * d.x1 + W.w2 * d.x2 + W.b) - d.y; g1 += e * d.x1; g2 += e * d.x2; }
  g1 /= D1.length; g2 /= D1.length; const lr = Math.pow(10, +$("#s3-lr").value), before = bceMean(W.w1, W.w2, W.b);
  GD.last = { w1: W.w1, g1, lr };
  W.w1 = clamp(W.w1 - lr * g1, -6, 6); W.w2 = clamp(W.w2 - lr * g2, -6, 6);
  GD.n++; const after = bceMean(W.w1, W.w2, W.b); GD.hist.push(after); if (GD.hist.length > 400) GD.hist.shift();
  GD.trail.push([W.w1, W.w2]); if (GD.trail.length > 80) GD.trail.shift();
  if (after > before + 0.01) goal("g3", "boom"); if (after < 0.40) goal("g3", "conv");
  if (GD.n >= 100 && Math.hypot(W.w1 - GD.start[0], W.w2 - GD.start[1]) < 0.3) goal("g3", "slow");
  syncers.forEach(f => f());
}
ST.s3 = {
  tab: "Downhill", cam: [[0, 15, 18], [0, 1.5, 0]],
  legend: () => `<b>Loss terrain over (w₁, w₂)</b><div class="row"><span><i class="sw" style="background:var(--c3)"></i>low loss</span><span><i class="sw" style="background:var(--c1)"></i>high loss</span><span><i class="sw" style="background:var(--c4)"></i>your neuron</span></div>`,
  init() {
    const lr = $("#s3-lr"), o = $("#o3-lr"); const show = () => o.textContent = Math.pow(10, +lr.value).toPrecision(2); lr.oninput = show; show();
    $("#s3-run").onclick = () => { GD.run = !GD.run; $("#s3-run").textContent = GD.run ? "Pause" : "Roll"; };
    $("#s3-step").onclick = () => gdStep();
    $("#s3-reset").onclick = () => this.reset([2.5, -3]);
    syncers.push(() => this.refresh());
  },
  reset(p) { W.w1 = p[0]; W.w2 = p[1]; GD.n = 0; GD.hist = [bceMean(W.w1, W.w2, W.b)]; GD.trail = [p.slice()]; GD.start = p.slice(); GD.last = null; syncers.forEach(f => f()); },
  enter() { if (!GD.start) this.reset([2.5, -3]); this.refresh(); },
  exit() { GD.run = false; $("#s3-run").textContent = "Roll"; },
  refresh() {
    if (!GD.start) return;
    let g1 = 0, g2 = 0; for (const d of D1) { const e = sig(W.w1 * d.x1 + W.w2 * d.x2 + W.b) - d.y; g1 += e * d.x1; g2 += e * d.x2; }
    g1 /= D1.length; g2 /= D1.length;
    $("#s3-n").textContent = GD.n; $("#s3-L").textContent = f3(bceMean(W.w1, W.w2, W.b)); $("#s3-g").textContent = f3(Math.hypot(g1, g2));
    const lr = Math.pow(10, +$("#s3-lr").value);
    $("#s3-flow").innerHTML = `<span class="nd"><b>w₁ now</b>${f3(W.w1)}</span><span class="ar">−</span><span class="nd"><b>η</b>${lr.toPrecision(2)}</span><span class="ar">×</span>
      <span class="nd"><b>∂L/∂w₁ = mean((a−y)·x₁)</b>${f3(g1)}</span><span class="ar">=</span><span class="nd"><b>w₁ next</b>${f3(W.w1 - lr * g1)}</span>`;
    if (cur === this) lineChart($("#s3-chart"), [{ data: GD.hist, color: tok("--c2") }], { ymin: 0, xlabel: "step →" });
  },
  tick(dt) { if (!GD.run) return; GD.acc += dt; while (GD.acc > 1 / 12) { GD.acc -= 1 / 12; gdStep(); } },
  draw() {
    const T = terrain(), cs = 12 / TG;
    for (let i = 0; i < TG; i++) for (let j = 0; j < TG; j++) { const L = T[i * TG + j]; V.box(-6 + (i + 0.5) * cs, 0, -6 + (j + 0.5) * cs, cs * 0.95, hOf(L) + 0.05, cs * 0.95, mix3(C.c3, C.c4, C.c1, (L - 0.25) / 1.6), { ter: [i, j] }); }
    const wx = w => clamp(w, -TR, TR) / TR * 6;
    GD.trail.forEach(([a, b], k) => V.box(wx(a), hOf(bceMean(a, b, W.b)) + 0.06, wx(b), 0.16, 0.16, 0.16, mix(C.card, C.ink, k / GD.trail.length), null));
    const L = bceMean(W.w1, W.w2, W.b), y = hOf(L) + 0.05;
    V.box(wx(W.w1), y, wx(W.w2), 0.55, 0.55, 0.55, C.c4, null); V.box(wx(W.w1), y + 0.55, wx(W.w2), 0.3, 0.3, 0.3, C.c4, null);
    pin(wx(W.w1), y + 1.1, wx(W.w2), Math.abs(W.w1) > TR || Math.abs(W.w2) > TR ? "off the map!" : `L=${f2(L)}`, "soft");
    pin(6.7, 0.2, 0, "w₁ →", "flat"); pin(0, 0.2, 6.7, "w₂ →", "flat");
  },
  onPick(t) { if (t && t.ter) { const [i, j] = t.ter; this.reset([-TR + (i + 0.5) * 2 * TR / TG, -TR + (j + 0.5) * 2 * TR / TG]); } },
  onHover(t) { if (t && t.ter) { const [i, j] = t.ter, w1 = -TR + (i + 0.5) * 2 * TR / TG, w2 = -TR + (j + 0.5) * 2 * TR / TG; return `w=(${f2(w1)}, ${f2(w2)})\nloss ${f3(bceMean(w1, w2, W.b))}\ntap to drop the neuron here`; } },
  state: () => `w1=${f2(W.w1)}, w2=${f2(W.w2)}, b held fixed at ${f2(W.b)}, step size η=${$("#o3-lr").textContent}, steps taken=${GD.n}, loss=${$("#s3-L").textContent}, gradient size=${$("#s3-g").textContent}.`
};

/* ---------- 4 backprop ---------- */
const BP = { f: 0, b: 0 };
const BPN = {
  x1: { p: [-10, -7], lbl: "x₁" }, w1: { p: [-10, -4.6], lbl: "w₁" }, x2: { p: [-10, -1], lbl: "x₂" }, w2: { p: [-10, 1.4], lbl: "w₂" }, b: { p: [-10, 5], lbl: "b" },
  m1: { p: [-4.5, -5.8], lbl: "m₁ = x₁·w₁", par: ["x1", "w1"] }, m2: { p: [-4.5, 0.2], lbl: "m₂ = x₂·w₂", par: ["x2", "w2"] },
  z: { p: [0.5, -0.5], lbl: "z = m₁+m₂+b", par: ["m1", "m2", "b"] }, a: { p: [5, -0.5], lbl: "a = σ(z)", par: ["z"] }, L: { p: [9.5, -0.5], lbl: "L = −log a or −log(1−a)", par: ["a"] }
};
const FWD = ["m1", "m2", "z", "a", "L"], BWD = ["L", "a", "z", "m1", "m2", "b", "w1", "x1", "w2", "x2"];
function bpVals() {
  const x1 = +$("#s4-x1").value, x2 = +$("#s4-x2").value, y = +$("#s4-y").value;
  const m1 = x1 * W.w1, m2 = x2 * W.w2, z = m1 + m2 + W.b, a = sig(z), L = -(y ? Math.log(a) : Math.log(1 - a));
  const v = { x1, x2, w1: W.w1, w2: W.w2, b: W.b, m1, m2, z, a, L, y };
  const dL = 1, da = y ? -1 / a : 1 / (1 - a), dz = a - y;
  const g = { L: dL, a: da, z: dz, m1: dz, m2: dz, b: dz, w1: dz * x1, x1: dz * W.w1, w2: dz * x2, x2: dz * W.w2 };
  const rule = {
    m1: "multiply", m2: "multiply", z: "add", a: "σ(z) = 1/(1+e^−z)", L: y ? "−log a  (y=1)" : "−log(1−a)  (y=0)",
    bL: "start: ∂L/∂L = 1", ba: y ? "d(−log a)/da = −1/a" : "d(−log(1−a))/da = 1/(1−a)", bz: "× σ'(z) = a(1−a)  →  a − y",
    bm1: "add passes blame through: ×1", bm2: "add passes blame through: ×1", bb: "add passes blame through: ×1",
    bw1: "× the other input of the multiply: x₁", bx1: "× the other input: w₁", bw2: "× the other input: x₂", bx2: "× the other input: w₂"
  };
  return { v, g, rule };
}
const bpSay = {
  m1: "Multiply input 1 by its weight.", m2: "Multiply input 2 by its weight.", z: "Add the two products and the bias. This is the weighted vote.", a: "Squash the vote into (0, 1).", L: "Score the answer. If the label is 1, the penalty is −log a; if it's 0, −log(1−a).",
  L_: "Start at the end. Nudging L by 1 moves L by 1, so its blame is 1.",
  a_: "How much does L move if a moves a little? That's the derivative of −log a, which is −1/a.",
  z_: "a = σ(z) and σ'(z) = a(1−a). Multiply: (−1/a)·a(1−a) = −(1−a) = a − y when y = 1. The messy parts cancel. That's why sigmoid and cross-entropy are always paired.",
  m1_: "z = m₁ + m₂ + b. Nudging m₁ by 0.01 nudges z by exactly 0.01, so m₁ inherits z's blame unchanged.", m2_: "Same for m₂: an addition copies blame to each input.", b_: "And to b. That's why the bias gradient is just (a − y).",
  w1_: "m₁ = x₁·w₁. Nudging w₁ by 0.01 nudges m₁ by 0.01·x₁. So w₁'s blame = m₁'s blame × x₁. This is the number station 3 used.", x1_: "Symmetric: x₁'s blame = m₁'s blame × w₁. (We can't change inputs, but in a deeper net this is the blame passed to the previous layer.)",
  w2_: "w₂'s blame = m₂'s blame × x₂.", x2_: "x₂'s blame = m₂'s blame × w₂."
};
ST.s4 = {
  tab: "Backprop", cam: [[0, 21, 21], [0, 1, -0.5]],
  legend: () => `<b>The neuron as a chain of tiny steps</b><div class="row"><span><i class="sw" style="background:var(--c2)"></i>value ≥ 0</span><span><i class="sw" style="background:var(--c1)"></i>value &lt; 0</span><span><i class="sw" style="background:var(--c4)"></i>∂L/∂(this)</span></div>`,
  init() {
    for (const id of ["x1", "x2", "y"]) { const s = $("#s4-" + id), o = $("#o4-" + id); const sh = () => { o.textContent = id === "y" ? s.value : f2(+s.value); }; s.addEventListener("input", () => { sh(); this.reset(); }); sh(); }
    $("#s4-f").onclick = () => { if (BP.f < FWD.length) BP.f++; this.refresh(); };
    $("#s4-b").onclick = () => { if (BP.f < FWD.length) { toast("Finish the forward pass first"); return; } if (BP.b < BWD.length) BP.b++; this.refresh(); };
    $("#s4-all").onclick = () => { BP.f = FWD.length; BP.b = BWD.length; this.refresh(); };
    $("#s4-reset").onclick = () => this.reset();
    $("#s4-check").onclick = () => {
      const { v, g } = bpVals(), h = 1e-4, Lf = w1 => { const a = sig(v.x1 * w1 + v.x2 * W.w2 + W.b); return -(v.y ? Math.log(a) : Math.log(1 - a)); };
      const num = (Lf(W.w1 + h) - Lf(W.w1 - h)) / (2 * h);
      $("#s4-checkout").innerHTML = `L(w₁+h) = ${Lf(W.w1 + h).toFixed(7)}, L(w₁−h) = ${Lf(W.w1 - h).toFixed(7)}, h = 0.0001<br>measured slope = (difference) / 2h = <b>${num.toFixed(6)}</b><br>backprop said (a − y)·x₁ = <b>${g.w1.toFixed(6)}</b>`;
    };
    syncers.push(() => this.reset());
  },
  reset() { BP.f = 0; BP.b = 0; this.refresh(); },
  enter() { this.refresh(); },
  refresh() {
    const { v, g, rule } = bpVals(), known = new Set(["x1", "w1", "x2", "w2", "b", ...FWD.slice(0, BP.f)]), gk = new Set(BWD.slice(0, BP.b));
    const nowF = BP.b === 0 && BP.f > 0 ? FWD[BP.f - 1] : null, nowB = BP.b > 0 ? BWD[BP.b - 1] : null;
    const rows = ["x1", "w1", "x2", "w2", "b", "m1", "m2", "z", "a", "L"].map(k => `<tr class="${k === nowF || k === nowB ? "now" : ""}"><td>${BPN[k].lbl}</td><td>${known.has(k) ? f3(v[k]) : "·"}</td><td>${gk.has(k) ? f3(g[k]) : "·"}</td><td style="font-family:var(--f-body);text-align:left">${gk.has(k) ? rule["b" + k] : known.has(k) && rule[k] ? rule[k] : ""}</td></tr>`).join("");
    $("#s4-table").innerHTML = `<thead><tr><th>Node</th><th>Value</th><th>∂L/∂node</th><th style="text-align:left">Rule used</th></tr></thead><tbody>${rows}</tbody>`;
    let say = "Press <b>Forward one step</b>.";
    if (nowB) say = bpSay[nowB + "_"]; else if (nowF) say = bpSay[nowF];
    if (BP.b === BWD.length) say += ` <br><b>Done.</b> Every gradient came from one multiply of local slopes, walking backwards. Deep nets do exactly this, just with more blocks.`;
    $("#s4-say").innerHTML = say;
    this.v = { v, g, known, gk, nowF, nowB };
  },
  draw() {
    if (!this.v) return; const { v, g, known, gk, nowF, nowB } = this.v;
    for (const k in BPN) {
      const n = BPN[k], [x, z] = n.p, hot = k === nowF || k === nowB;
      V.box(x, 0, z, 1.6, 0.25, 1.6, hot ? C.c4 : C.line, { node: k });
      if (n.par) for (const p of n.par) { const q = BPN[p].p; Ln.seg(q[0] + 0.8, 0.3, q[1], x - 0.8, 0.3, z, hot ? C.c4 : C.muted); }
      if (known.has(k)) { const h = Math.min(Math.abs(v[k]) * 1.3, 5) + 0.08; V.box(x - 0.35, 0.25, z, 0.6, h, 0.6, v[k] >= 0 ? C.c2 : C.c1, { node: k }); pin(x - 0.35, h + 0.5, z, `${n.lbl.split(" ")[0]} = ${f2(v[k])}`, ""); }
      if (gk.has(k)) { const h = Math.min(Math.abs(g[k]) * 1.8, 5) + 0.08; V.box(x + 0.4, 0.25, z, 0.5, h, 0.5, C.c4, { node: k }); pin(x + 0.5, h + 0.5, z + 1.1, `∂=${f2(g[k])}`, "soft"); }
    }
  },
  onHover(t) { if (t && t.node) { const k = t.node, { v, g, known, gk } = this.v; return `${BPN[k].lbl}\nvalue ${known.has(k) ? f3(v[k]) : "not computed yet"}\n∂L/∂${k} ${gk.has(k) ? f3(g[k]) : "not computed yet"}`; } },
  state() { const { v } = bpVals(); return `example x1=${f2(v.x1)}, x2=${f2(v.x2)}, label y=${v.y}; w1=${f2(W.w1)}, w2=${f2(W.w2)}, b=${f2(W.b)}; z=${f3(v.z)}, a=${f3(v.a)}, L=${f3(v.L)}; forward steps done ${BP.f}/5, backward steps done ${BP.b}/10.`; }
};

/* ---------- 5 hidden layer ---------- */
const H5 = { data: "xor", act: "tanh", run: true, n: 0, net: null, X: null, Y: null, N: 200, G: 28, grid: null };
function data5(kind) {
  const r = rng(kind.length * 97 + 3), X = new Float32Array(400), Y = new Float32Array(200);
  for (let i = 0; i < 200; i++) {
    let x, y, l;
    if (kind === "xor") { const q = i % 4, sx = q & 1 ? 1 : -1, sy = q & 2 ? 1 : -1; x = sx * 1.5 + randn(r) * 0.5; y = sy * 1.5 + randn(r) * 0.5; l = sx * sy > 0 ? 1 : 0; }
    else if (kind === "circle") { const rad = Math.sqrt(r()) * 2.9, t = r() * 6.283; x = rad * Math.cos(t); y = rad * Math.sin(t); l = rad < 1.6 ? 1 : 0; }
    else { l = i % 2; const t = (i >> 1) / 100 * 3.5 + 0.3, rr = t * 0.75; x = rr * Math.cos(t * 1.8 + l * Math.PI) + randn(r) * 0.12; y = rr * Math.sin(t * 1.8 + l * Math.PI) + randn(r) * 0.12; }
    X[2 * i] = clamp(x, -2.95, 2.95); X[2 * i + 1] = clamp(y, -2.95, 2.95); Y[i] = l;
  }
  return { X, Y };
}
function reset5() {
  const d = data5(H5.data); H5.X = d.X; H5.Y = d.Y; H5.n = 0;
  H5.net = new Net([2, +$("#s5-h").value, 1], [H5.act, "sigmoid"], Math.random() * 1e9 | 0);
  const G = H5.G, g = new Float32Array(G * G * 2); for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { g[(i * G + j) * 2] = -3 + (i + 0.5) * 6 / G; g[(i * G + j) * 2 + 1] = -3 + (j + 0.5) * 6 / G; } H5.grid = g;
  const th = $("#s5-thumbs"); th.innerHTML = ""; for (let k = 0; k < +$("#s5-h").value; k++) { const c = document.createElement("canvas"); c.width = c.height = G; th.appendChild(c); }
  H5.out = null; refresh5();
}
function train5(steps) {
  const lr = Math.pow(10, +$("#s5-lr").value);
  for (let s = 0; s < steps; s++) { const a = H5.net.forward(H5.X, 200), d = new Float32Array(200); for (let i = 0; i < 200; i++) d[i] = (a[i] - H5.Y[i]) / 200; H5.net.backward(d, 200, true); H5.net.step(lr); H5.n++; }
}
function refresh5() {
  const a = H5.net.forward(H5.X, 200); let L = 0, ok = 0;
  for (let i = 0; i < 200; i++) { const p = clamp(a[i], 1e-7, 1 - 1e-7); L -= H5.Y[i] ? Math.log(p) : Math.log(1 - p); if ((a[i] > 0.5) === (H5.Y[i] > 0.5)) ok++; }
  $("#s5-n").textContent = H5.n; $("#s5-L").textContent = f3(L / 200); const acc = ok / 200; $("#s5-acc").textContent = (acc * 100).toFixed(1) + "%"; $("#s5-acc").className = acc >= 0.99 ? "ok" : "";
  if (H5.data === "xor" && acc >= 1 && H5.act !== "none") goal("g5", "xor");
  if (H5.data === "xor" && H5.act === "none" && H5.n > 300 && acc < 0.8) goal("g5", "lin");
  if (H5.data === "spiral" && acc > 0.95) goal("g5", "spiral");
  const G = H5.G; H5.out = H5.net.forward(H5.grid, G * G); const hid = H5.net.cache[1], Hn = H5.net.L[0].O;
  const cvs = $$("#s5-thumbs canvas"), pos = [C.c1.r, C.c1.g, C.c1.b].map(v => v * 255), neg = [C.c2.r, C.c2.g, C.c2.b].map(v => v * 255), mid = [C.card.r, C.card.g, C.card.b].map(v => v * 255);
  for (let k = 0; k < Hn && k < cvs.length; k++) {
    let mx = 1e-6; for (let p = 0; p < G * G; p++) mx = Math.max(mx, Math.abs(hid[p * Hn + k]));
    const g = cvs[k].getContext("2d"), im = g.createImageData(G, G);
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const v = hid[(i * G + j) * Hn + k] / mx, t = Math.abs(v), c = v >= 0 ? pos : neg, px = ((G - 1 - j) * G + i) * 4; for (let ch = 0; ch < 3; ch++) im.data[px + ch] = mid[ch] + (c[ch] - mid[ch]) * t; im.data[px + 3] = 255; }
    g.putImageData(im, 0, 0);
  }
}
ST.s5 = {
  tab: "Layers", cam: [[0, 14, 19], [0, 1.6, 0]],
  legend: () => `<b>Output of the whole network</b><div class="row"><span><i class="sw" style="background:var(--c2)"></i>says 0</span><span><i class="sw" style="background:var(--c1)"></i>says 1</span></div>`,
  init() {
    $$("[data-d]").forEach(b => b.onclick = () => { H5.data = b.dataset.d; $$("[data-d]").forEach(x => x.setAttribute("aria-pressed", x === b)); reset5(); });
    $$("[data-a]").forEach(b => b.onclick = () => { H5.act = b.dataset.a; $$("[data-a]").forEach(x => x.setAttribute("aria-pressed", x === b)); reset5(); });
    const h = $("#s5-h"), oh = $("#o5-h"); h.oninput = () => { oh.textContent = h.value; reset5(); }; oh.textContent = h.value;
    const lr = $("#s5-lr"), ol = $("#o5-lr"); const sl = () => ol.textContent = Math.pow(10, +lr.value).toPrecision(2); lr.oninput = sl; sl();
    $("#s5-run").onclick = () => { H5.run = !H5.run; $("#s5-run").textContent = H5.run ? "Pause" : "Train"; };
    $("#s5-reset").onclick = reset5;
  },
  enter() { if (!H5.net) reset5(); },
  tick() { if (H5.run && H5.net) { train5(4); if (H5.n % 8 === 0) refresh5(); } },
  draw() {
    if (!H5.out) return; const G = H5.G, cs = 12 / G;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const a = H5.out[i * G + j]; V.box(-6 + (i + 0.5) * cs, a * 4, -6 + (j + 0.5) * cs, cs * 0.62, 0.14, cs * 0.62, mix3(C.c2, C.card, C.c1, a), null); V.box(-6 + (i + 0.5) * cs, -0.08, -6 + (j + 0.5) * cs, cs * 0.96, 0.06, cs * 0.96, (i + j) & 1 ? C.panel : C.line, null); }
    for (let i = 0; i < 200; i++) { const y = H5.Y[i]; V.box(H5.X[2 * i] * 2, y * 4 + 0.12, H5.X[2 * i + 1] * 2, 0.24, 0.24, 0.24, mix(y ? C.c1 : C.c2, C.ink, 0.3), null); }
  },
  state: () => `data=${H5.data}, hidden neurons H=${$("#s5-h").value}, squash=${H5.act}, steps=${H5.n}, loss=${$("#s5-L").textContent}, accuracy=${$("#s5-acc").textContent}.`
};

/* ---------- 6 images ---------- */
const S6 = { im: makeFace(rng(5), { smile: 0.9, bags: false, gap: 2, ey: 3, shade: 0.9 }).im, view: "img", t: 0, target: 0, w: new Float32Array(144), b: -1.5 };
for (let x = 3; x <= 8; x++) { const u = (x - 5.5) / 2.5, dy = Math.round(u * u * 1.6); if (dy) { S6.w[(8 - dy) * 12 + x] += 1; S6.w[(8 + dy) * 12 + x] -= 1; } }
function refresh6() {
  let z = 0; for (let k = 0; k < 144; k++) z += S6.w[k] * (1 - S6.im[k]);
  const a = sig(z + S6.b); $("#s6-z").textContent = f2(z); $("#s6-a").textContent = f3(a);
  $("#s6-say").textContent = a > 0.7 ? "smiling" : a < 0.3 ? (z < -0.5 ? "frowning" : "not smiling") : "unsure";
  let s = "x = darkness = 1 − brightness, row by row (144 numbers)\n"; for (let y = 0; y < 12; y++) s += "[" + Array.from({ length: 12 }, (_, x) => (1 - S6.im[y * 12 + x]).toFixed(2)).join(" ") + "]\n";
  $("#s6-vec").textContent = s;
}
ST.s6 = {
  tab: "Pixels", cam: [[0, 19, 19], [0, 0.5, 2]],
  legend: () => `<b>${S6.view === "img" ? "Image: dark ink stands tall" : S6.view === "w" ? "Weights of a smile-detector neuron" : "Product x·w per pixel. Their sum is z."}</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>positive</span><span><i class="sw" style="background:var(--c2)"></i>negative</span></div>`,
  init() {
    $$("[data-v]").forEach(b => b.onclick = () => { S6.view = b.dataset.v; $$("[data-v]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#legend").innerHTML = this.legend(); });
    $("#s6-flat").onclick = () => { S6.target = S6.target ? 0 : 1; $("#s6-flat").textContent = S6.target ? "Fold back into a grid" : "Flatten"; };
    const set = o => { S6.im = makeFace(rng(Math.random() * 1e9 | 0), o).im; refresh6(); };
    $("#s6-rand").onclick = () => set({}); $("#s6-smile").onclick = () => set({ smile: 0.9 }); $("#s6-frown").onclick = () => set({ smile: -0.9 });
    $("#s6-clear").onclick = () => { S6.im = makeFace(rng(1), { smile: 0 }).im.map((v, k) => { const y = k / 12 | 0, x = k % 12; return ((y - 5.5) ** 2 + (x - 5.5) ** 2 <= 28.09) ? 0.9 : 0.3; }); refresh6(); };
    refresh6();
  },
  tick(dt) { S6.t += (S6.target - S6.t) * Math.min(1, dt * 3); },
  draw() {
    const t = S6.t, e = t * t * (3 - 2 * t), cell = 0.8;
    for (let k = 0; k < 144; k++) {
      const y = k / 12 | 0, x = k % 12, gx = (x - 5.5) * cell, gz = (y - 5.5) * cell, lx = (k - 71.5) * 0.19, lz = 7.5;
      const px = gx + (lx - gx) * e, pz = gz + (lz - gz) * e, sz = cell * 0.92 + (0.17 - cell * 0.92) * e;
      const xv = 1 - S6.im[k], wv = S6.w[k];
      let h, c;
      if (S6.view === "img") { h = xv * 2.4 + 0.1; c = grey(S6.im[k]); }
      else if (S6.view === "w") { h = Math.abs(wv) * 2 + 0.06; c = wv > 0 ? C.c1 : wv < 0 ? C.c2 : C.line; }
      else { const p = xv * wv; h = Math.abs(p) * 2.5 + 0.06; c = p > 0.01 ? C.c1 : p < -0.01 ? C.c2 : C.line; }
      V.box(px, 0, pz, sz, h, sz, c, { px: k });
    }
    if (e > 0.95) { pin(-13.6, 0.4, 7.5, "x[0]", "flat"); pin(13.6, 0.4, 7.5, "x[143]", "flat"); }
  },
  onPick(t) { if (t && t.px != null) { const k = t.px; S6.im[k] = S6.im[k] < 0.5 ? 0.9 : 0.05; refresh6(); } },
  onHover(t) { if (t && t.px != null) { const k = t.px; return `pixel ${k} = row ${k / 12 | 0}, col ${k % 12}\nx = ${f2(1 - S6.im[k])}  w = ${f2(S6.w[k])}\nx·w = ${f2((1 - S6.im[k]) * S6.w[k])}`; } },
  state: () => `view=${S6.view}, z=Σx·w=${$("#s6-z").textContent}, bias=-1.5, output=${$("#s6-a").textContent} (${$("#s6-say").textContent}). The weight template is +1 at the mouth corners of a smile and −1 at the corners of a frown.`
};

/* ---------- 7 autoencoder ---------- */
const AE = { run: true, n: 0, net: null, lin: false, hist: [], pca: null, idx: 0, test: null, train: null, draw: null, eig: null };
function pcaEig(X, n) {
  const D = 144, mu = new Float64Array(D); for (let i = 0; i < n; i++) for (let d = 0; d < D; d++) mu[d] += X[i * D + d] / n;
  const Cv = new Float64Array(D * D); for (let i = 0; i < n; i++) for (let a = 0; a < D; a++) { const da = X[i * D + a] - mu[a]; if (!da) continue; for (let b = a; b < D; b++) Cv[a * D + b] += da * (X[i * D + b] - mu[b]); }
  for (let a = 0; a < D; a++) for (let b = a; b < D; b++) { Cv[a * D + b] /= n; Cv[b * D + a] = Cv[a * D + b]; }
  let tr = 0; for (let a = 0; a < D; a++) tr += Cv[a * D + a];
  const lam = [], r = rng(3);
  for (let k = 0; k < 24; k++) {
    let v = new Float64Array(D).map(() => r() - 0.5), l = 0;
    for (let it = 0; it < 120; it++) { const w = new Float64Array(D); for (let a = 0; a < D; a++) { let s = 0; for (let b = 0; b < D; b++) s += Cv[a * D + b] * v[b]; w[a] = s; } let nr = Math.hypot(...w); if (nr < 1e-12) break; l = nr; v = w.map(x => x / nr); }
    lam.push(l); for (let a = 0; a < D; a++) for (let b = 0; b < D; b++) Cv[a * D + b] -= l * v[a] * v[b];
  }
  return { tr, lam };
}
function resetAE() {
  const Lb = +$("#s7-L").value;
  AE.net = AE.lin ? new Net([144, 32, Lb, 32, 144], ["none", "none", "none", "none"], 11) : new Net([144, 32, Lb, 32, 144], ["tanh", "none", "tanh", "sigmoid"], 11);
  AE.n = 0; AE.hist = []; AE.pcaLine = AE.eig ? (AE.eig.tr - AE.eig.lam.slice(0, Lb).reduce((a, b) => a + b, 0)) / 144 : null;
  $("#s7-pca").textContent = AE.pcaLine != null ? AE.pcaLine.toFixed(4) : "–"; evalAE();
}
function evalAE() {
  const n = 300, out = AE.net.forward(AE.train.X.subarray(0, n * 144), n); let s = 0; for (let k = 0; k < n * 144; k++) s += (out[k] - AE.train.X[k]) ** 2;
  const e = s / (n * 144); AE.err = e; AE.hist.push(e); if (AE.hist.length > 300) AE.hist.splice(0, 1);
  $("#s7-n").textContent = AE.n; $("#s7-L1").textContent = e.toFixed(4);
  const Lb = +$("#s7-L").value;
  if (AE.lin && AE.n > 1500 && e < AE.pcaLine * 1.05) goal("g7", "pca");
  if (!AE.lin && Lb === 3 && e < AE.pcaLine * 0.97) goal("g7", "beat");
  if (Lb === 1 && AE.n > 2000) goal("g7", "one");
}
function trainAE(steps) {
  const B = 32, X = new Float32Array(B * 144), r = Math.random;
  for (let s = 0; s < steps; s++) {
    for (let b = 0; b < B; b++) { const i = (r() * AE.train.n) | 0; X.set(AE.train.X.subarray(i * 144, i * 144 + 144), b * 144); }
    const out = AE.net.forward(X, B), d = new Float32Array(B * 144); for (let k = 0; k < d.length; k++) d[k] = 2 * (out[k] - X[k]) / (B * 144);
    AE.net.backward(d, B); AE.net.step(AE.lin ? 0.002 : 0.004); AE.n++;
  }
}
function pairsAE() {
  const box = $("#s7-pairs"); if (!box.children.length) { for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const c = document.createElement("canvas"); c.width = c.height = 12; box.appendChild(c); } }
  const X = AE.test.X.subarray(0, 6 * 144), out = AE.net.forward(X, 6), cv = box.querySelectorAll("canvas");
  for (let i = 0; i < 6; i++) { drawFace2D(cv[i], X.subarray(i * 144, i * 144 + 144)); drawFace2D(cv[6 + i], out.subarray(i * 144, i * 144 + 144)); }
}
ST.s7 = {
  tab: "Autoencoder", cam: [[0, 22, 25], [0, 0.5, 0]],
  legend: () => `<b>Original → 32 → L → 32 → output</b><div class="row"><span>tall = dark ink</span><span><i class="sw" style="background:var(--c1)"></i>+ activation</span><span><i class="sw" style="background:var(--c2)"></i>− activation</span></div>`,
  init() {
    AE.train = faceSet(1200, 101); AE.test = faceSet(200, 202); AE.eig = pcaEig(AE.train.X, AE.train.n);
    AE.draw = AE.test.X.slice(0, 144);
    const L = $("#s7-L"), o = $("#o7-L"); L.oninput = () => { o.textContent = L.value; resetAE(); }; o.textContent = L.value;
    $("#s7-run").onclick = () => { AE.run = !AE.run; $("#s7-run").textContent = AE.run ? "Pause" : "Train"; };
    $("#s7-reset").onclick = resetAE;
    $("#s7-next").onclick = () => { AE.idx = (AE.idx + 1) % AE.test.n; AE.draw = AE.test.X.slice(AE.idx * 144, AE.idx * 144 + 144); };
    $("#s7-nl").onclick = () => { AE.lin = false; $("#s7-nl").setAttribute("aria-pressed", true); $("#s7-lin").setAttribute("aria-pressed", false); resetAE(); };
    $("#s7-lin").onclick = () => { AE.lin = true; $("#s7-nl").setAttribute("aria-pressed", false); $("#s7-lin").setAttribute("aria-pressed", true); resetAE(); };
    resetAE();
  },
  enter() { pairsAE(); this.chart(); },
  chart() { if (cur !== this) return; const s = [{ data: AE.hist, color: tok("--c2") }]; if (AE.pcaLine != null) s.push({ data: [AE.pcaLine, AE.pcaLine], color: tok("--c4"), dash: [5, 4], flat: true }); lineChart($("#s7-chart"), s, { ymin: 0, xlabel: "training →" }); },
  tick() { if (!AE.run) return; trainAE(8); if (AE.n % 40 === 0) { evalAE(); this.chart(); } if (AE.n % 160 === 0) pairsAE(); },
  draw() {
    const net = AE.net, out = net.forward(AE.draw, 1), c = net.cache, cell = 0.62;
    faceGrid(AE.draw, -12.5, 0, cell, k => ({ px: k }), 2);
    faceGrid(out, 12.5, 0, cell, null, 2);
    const slab = (vals, cx, cols) => { const n = vals.length, rows = Math.ceil(n / cols); for (let k = 0; k < n; k++) { const v = vals[k], x = cx + ((k % cols) - (cols - 1) / 2) * 0.55, z = ((k / cols | 0) - (rows - 1) / 2) * 0.55; V.box(x, 0, z, 0.48, Math.min(Math.abs(v) * 1.6, 4) + 0.06, 0.48, v >= 0 ? C.c1 : C.c2, null); } return rows * 0.55 / 2; };
    const h1 = slab(c[1], -5.5, 4), hz = slab(c[2], 0, 1), h2 = slab(c[3], 5.5, 4);
    const e = 6 * cell, ln = C.muted;
    for (const s of [-1, 1]) { Ln.seg(-12.5 + e, 0.05, s * e, -5.5 - 1.1, 0.05, s * h1, ln); Ln.seg(-5.5 + 1.1, 0.05, s * h1, -0.3, 0.05, s * hz, ln); Ln.seg(0.3, 0.05, s * hz, 5.5 - 1.1, 0.05, s * h2, ln); Ln.seg(5.5 + 1.1, 0.05, s * h2, 12.5 - e, 0.05, s * e, ln); }
    pin(-12.5, 2.8, -e, "Original · 144", ""); pin(0, 3.4, -hz, `Bottleneck · ${c[2].length}`, "hot"); pin(12.5, 2.8, -e, "Output · 144", "");
  },
  onPick(t) { if (t && t.px != null) { const k = t.px; AE.draw[k] = AE.draw[k] < 0.5 ? 0.9 : 0.05; } },
  onHover(t) { if (t && t.px != null) return "tap to paint / erase"; },
  state: () => `bottleneck L=${$("#s7-L").value}, mode=${AE.lin ? "linear" : "with tanh/sigmoid"}, training steps=${AE.n}, reconstruction error per pixel=${$("#s7-L1").textContent}, PCA error at same L=${$("#s7-pca").textContent}. Network 144→32→L→32→144, Adam, batch 32, 1200 toy 12×12 faces.`
};

/* ---------- 8 latent map ---------- */
const LT = { net: null, steps: 0, total: 3500, Z: null, n: 500, base: [0, 0], dS: [0, 0], dB: [0, 0], bounds: null, ready: false };
function encode8() {
  const X = AE.train.X.subarray(0, LT.n * 144); LT.net.forward(X, LT.n); const z = LT.net.cache[2]; LT.Z = z.slice(0, LT.n * 2);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (let i = 0; i < LT.n; i++) { x0 = Math.min(x0, z[2 * i]); x1 = Math.max(x1, z[2 * i]); y0 = Math.min(y0, z[2 * i + 1]); y1 = Math.max(y1, z[2 * i + 1]); }
  const mx = (x1 - x0) * 0.12 + 1e-3, my = (y1 - y0) * 0.12 + 1e-3; LT.bounds = [x0 - mx, x1 + mx, y0 - my, y1 + my];
  const mean = f => { let a = 0, b = 0, c = 0; for (let i = 0; i < LT.n; i++) if (f(AE.train.meta[i])) { a += z[2 * i]; b += z[2 * i + 1]; c++; } return [a / c, b / c]; };
  const s1 = mean(m => m.smile), s0 = mean(m => !m.smile), b1 = mean(m => m.bags), b0 = mean(m => !m.bags);
  LT.dS = [s1[0] - s0[0], s1[1] - s0[1]]; LT.dB = [b1[0] - b0[0], b1[1] - b0[1]]; LT.mid = mean(() => true);
}
const zw = (zx, zy) => { const [x0, x1, y0, y1] = LT.bounds; return [((zx - x0) / (x1 - x0) - 0.5) * 16, ((zy - y0) / (y1 - y0) - 0.5) * 16]; };
const wz = (wx, wzv) => { const [x0, x1, y0, y1] = LT.bounds; return [x0 + (wx / 16 + 0.5) * (x1 - x0), y0 + (wzv / 16 + 0.5) * (y1 - y0)]; };
function probe8() { const s = +$("#s8-sm").value, b = +$("#s8-bg").value; return [LT.base[0] + s * LT.dS[0] + b * LT.dB[0], LT.base[1] + s * LT.dS[1] + b * LT.dB[1]]; }
function decode8(z) { let h = Float32Array.from(z); for (const l of LT.net.L.slice(2)) { const o = new Float32Array(l.O); for (let k = 0; k < l.O; k++) { let s = l.b[k]; for (let i = 0; i < l.I; i++) s += h[i] * l.W[k * l.I + i]; o[k] = l.act === "tanh" ? Math.tanh(s) : l.act === "sigmoid" ? sig(s) : s; } h = o; } return h; }
ST.s8 = {
  tab: "Latent map", cam: [[2.5, 24, 21], [2.5, 0, 0]],
  legend: () => `<b>Each dot = one face's 2-number address</b><div class="row"><span><i class="sw" style="background:var(--c1)"></i>smiling</span><span><i class="sw" style="background:var(--c2)"></i>frowning</span><span><i class="sw" style="background:var(--c4)"></i>cap = eyebags</span></div>`,
  init() {
    for (const id of ["sm", "bg"]) { const s = $("#s8-" + id), o = $("#o8-" + id); const sh = () => { o.textContent = (+s.value >= 0 ? "+" : "") + f2(+s.value); this.face(); }; s.oninput = sh; o.textContent = "+0.00"; }
  },
  enter() { if (!LT.net) { LT.net = new Net([144, 32, 2, 32, 144], ["tanh", "none", "tanh", "sigmoid"], 21); } },
  tick() {
    if (LT.steps < LT.total) {
      const B = 32, X = new Float32Array(B * 144);
      for (let s = 0; s < 30; s++) { for (let b = 0; b < B; b++) { const i = (Math.random() * AE.train.n) | 0; X.set(AE.train.X.subarray(i * 144, i * 144 + 144), b * 144); } const out = LT.net.forward(X, B), d = new Float32Array(B * 144); for (let k = 0; k < d.length; k++) d[k] = 2 * (out[k] - X[k]) / (B * 144); LT.net.backward(d, B); LT.net.step(0.004); LT.steps++; }
      if (LT.steps % 150 === 0 || LT.steps >= LT.total) { encode8(); if (!LT.ready) LT.base = LT.mid.slice(); this.face(); }
      $("#s8-prog i").style.width = (LT.steps / LT.total * 100) + "%";
      $("#s8-status").textContent = LT.steps >= LT.total ? "Trained. Tap a dot to pick a face, or tap the floor to decode any address." : `Training the 2-number autoencoder… step ${LT.steps} of ${LT.total}. Watch the dots sort themselves.`;
      if (LT.steps >= LT.total) LT.ready = true;
    }
  },
  face() { if (!LT.bounds) return; const z = probe8(), im = decode8(z); this.im = im; drawFace2D($("#s8-face"), im); $("#s8-z").textContent = `z = (${f2(z[0])}, ${f2(z[1])})`; },
  draw() {
    if (!LT.bounds) return; const G = 20, cs = 16 / G;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) V.box(-8 + (i + 0.5) * cs, -0.1, -8 + (j + 0.5) * cs, cs * 0.96, 0.1, cs * 0.96, (i + j) & 1 ? C.panel : C.line, { fl: [-8 + (i + 0.5) * cs, -8 + (j + 0.5) * cs] });
    for (let i = 0; i < LT.n; i++) { const [x, z] = zw(LT.Z[2 * i], LT.Z[2 * i + 1]), m = AE.train.meta[i]; V.box(x, 0, z, 0.26, 0.26, 0.26, m.smile ? C.c1 : C.c2, { dot: i }); if (m.bags) V.box(x, 0.26, z, 0.18, 0.12, 0.18, C.c4, { dot: i }); }
    const [mx, mz] = zw(LT.mid[0], LT.mid[1]);
    const arrow = (d, col) => { const [ex, ez] = zw(LT.mid[0] + d[0], LT.mid[1] + d[1]); Ln.seg(mx, 0.5, mz, ex, 0.5, ez, col); V.box(ex, 0.3, ez, 0.4, 0.4, 0.4, col, null); };
    arrow(LT.dS, C.c1); arrow(LT.dB, C.c4);
    const p = probe8(), [px, pz] = zw(p[0], p[1]); V.box(clamp(px, -8, 8), 0, clamp(pz, -8, 8), 0.3, 2.2, 0.3, C.ink, null);
    pin(clamp(px, -8, 8), 2.6, clamp(pz, -8, 8), "decoder looks here", "soft");
    if (this.im) faceGrid(this.im, 13, 0, 0.55, null, 1.8);
    pin(13, 2.6, -3.3, "decoded face", "");
  },
  onPick(t) { if (!t || !LT.bounds) return; if (t.dot != null) LT.base = [LT.Z[2 * t.dot], LT.Z[2 * t.dot + 1]]; else if (t.fl) LT.base = wz(t.fl[0], t.fl[1]); else return; $("#s8-sm").value = 0; $("#s8-bg").value = 0; $("#o8-sm").textContent = "+0.00"; $("#o8-bg").textContent = "+0.00"; this.face(); },
  onHover(t) { if (t && t.dot != null) { const m = AE.train.meta[t.dot]; return `face #${t.dot}: ${m.smile ? "smiling" : "frowning"}${m.bags ? ", eyebags" : ""}\nz = (${f2(LT.Z[2 * t.dot])}, ${f2(LT.Z[2 * t.dot + 1])})`; } if (t && t.fl) return "tap: decode this address"; },
  state: () => `2-number autoencoder trained ${LT.steps} steps. Probe ${$("#s8-z").textContent}. smile direction d_smile=(${f2(LT.dS[0])}, ${f2(LT.dS[1])}), eyebags direction=(${f2(LT.dB[0])}, ${f2(LT.dB[1])}); smile slider=${$("#s8-sm").value}, eyebags slider=${$("#s8-bg").value}.`
};

/* ---------- 9 convolution ---------- */
const KS = { vert: [-1, 0, 1, -1, 0, 1, -1, 0, 1], horiz: [-1, -1, -1, 0, 0, 0, 1, 1, 1], blur: Array(9).fill(1 / 9), dot: [-1, -1, -1, -1, 8, -1, -1, -1, -1] };
const CV = { k: "vert", p: 0, run: true, acc: 0, im: makeFace(rng(9), { smile: 0.8, gap: 2 }).im, out: new Float32Array(100) };
function conv9() { const x = CV.im.map(v => 1 - v), K = KS[CV.k]; for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { let s = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += K[a * 3 + b] * x[(i + a) * 12 + j + b]; CV.out[i * 10 + j] = s; } }
function flow9() {
  const i = (CV.p / 10) | 0, j = CV.p % 10, x = CV.im.map(v => 1 - v), K = KS[CV.k];
  const patch = [], parts = []; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const v = x[(i + a) * 12 + j + b]; patch.push(f2(v)); if (Math.abs(K[a * 3 + b]) > 1e-9 && v > 0.02) parts.push(`${f2(K[a * 3 + b])}·${f2(v)}`); }
  $("#s9-flow").innerHTML = `<span class="nd"><b>3×3 patch at row ${i}, col ${j}</b>${patch.slice(0, 3).join(" ")}<br>${patch.slice(3, 6).join(" ")}<br>${patch.slice(6).join(" ")}</span><span class="ar">·</span>
    <span class="nd"><b>kernel</b>${KS[CV.k].slice(0, 3).map(f2).join(" ")}<br>${KS[CV.k].slice(3, 6).map(f2).join(" ")}<br>${KS[CV.k].slice(6).map(f2).join(" ")}</span><span class="ar">=</span>
    <span class="nd"><b>sum of 9 products</b>${f2(CV.out[CV.p])}</span>`;
}
ST.s9 = {
  tab: "Convolution", cam: [[0.5, 18, 17], [0.5, 0.5, 0]],
  legend: () => `<b>Input → 3×3 kernel → feature map</b><div class="row"><span><i class="sw" style="background:var(--c4)"></i>kernel</span><span><i class="sw" style="background:var(--c1)"></i>+ response</span><span><i class="sw" style="background:var(--c2)"></i>− response</span></div>`,
  init() {
    $$("[data-k]").forEach(b => b.onclick = () => { CV.k = b.dataset.k; $$("[data-k]").forEach(x => x.setAttribute("aria-pressed", x === b)); conv9(); CV.p = 0; flow9(); });
    const sp = $("#s9-sp"), o = $("#o9-sp"); sp.oninput = () => o.textContent = sp.value + "/s"; o.textContent = sp.value + "/s";
    $("#s9-run").onclick = () => { CV.run = !CV.run; $("#s9-run").textContent = CV.run ? "Pause" : "Slide"; };
    $("#s9-step").onclick = () => { CV.p = (CV.p + 1) % 100; flow9(); };
    $("#s9-face").onclick = () => { CV.im = makeFace(rng(Math.random() * 1e9 | 0)).im; conv9(); CV.p = 0; flow9(); };
    conv9(); flow9();
  },
  tick(dt) { if (!CV.run) return; CV.acc += dt * +$("#s9-sp").value; let ch = false; while (CV.acc >= 1) { CV.acc -= 1; CV.p = (CV.p + 1) % 100; ch = true; } if (ch) flow9(); },
  draw() {
    const cell = 0.7, ox = -7, oxo = 7.5, i = (CV.p / 10) | 0, j = CV.p % 10;
    faceGrid(CV.im, ox, 0, cell, null, 1.6);
    const K = KS[CV.k], ky = 3.4;
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const v = K[a * 3 + b], x = ox + (j + b - 5.5) * cell, z = (i + a - 5.5) * cell; V.box(x, ky, z, cell * 0.9, 0.12 + Math.abs(v) * (CV.k === "blur" ? 2 : 0.25), cell * 0.9, v > 0 ? C.c4 : v < 0 ? mix(C.c4, C.c2, 0.6) : mix(C.c4, C.bg, 0.6), null); }
    const cx = ox + (j + 1 - 5.5) * cell, cz = (i + 1 - 5.5) * cell;
    for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) Ln.seg(cx + dx * cell, ky, cz + dz * cell, cx + dx * cell, 1.6, cz + dz * cell, C.c4);
    let mx = 1e-6; for (const v of CV.out) mx = Math.max(mx, Math.abs(v));
    for (let k = 0; k < 100; k++) { const ii = (k / 10) | 0, jj = k % 10, x = oxo + (jj - 4.5) * cell, z = (ii - 4.5) * cell; if (k > CV.p) { V.box(x, 0, z, cell * 0.9, 0.05, cell * 0.9, C.line, null); continue; } const v = CV.out[k] / mx; V.box(x, 0, z, cell * 0.9, Math.abs(v) * 2.4 + 0.06, cell * 0.9, k === CV.p ? C.c4 : v >= 0 ? C.c1 : C.c2, null); }
    const ox2 = oxo + (j - 4.5) * cell, oz2 = (i - 4.5) * cell; Ln.seg(cx, ky + 0.3, cz, ox2, 2.6, oz2, C.c4);
    pin(ox, 2.4, -4.6, "input 12×12", ""); pin(oxo, 2.4, -4, "feature map 10×10", ""); pin(cx, ky + 1, cz, "same 9 weights everywhere", "soft");
  },
  state: () => `kernel=${CV.k} [${KS[CV.k].map(f2).join(", ")}], position ${CV.p} of 100 (row ${(CV.p / 10) | 0}, col ${CV.p % 10}), response there=${f2(CV.out[CV.p])}. Input is a 12×12 toy face as darkness values.`
};

/* ---------- 10 GPU / CelebA network ---------- */
const ARCH = [
  { name: "input", c: 3, s: 64, code: "x = batch of faces, shape (B, 3, 64, 64)", note: "3 colour channels × 64 × 64 pixels = 12,288 numbers per face." },
  { name: "enc1", c: 32, s: 32, ci: 3, k: 4, code: "nn.Conv2d(3, 32, kernel_size=4, stride=2, padding=1), BatchNorm2d(32), LeakyReLU(0.2)", note: "Stride 2 halves the size: (64 + 2·1 − 4)/2 + 1 = 32. 32 filters, each 3×4×4 = 48 weights." },
  { name: "enc2", c: 64, s: 16, ci: 32, k: 4, code: "nn.Conv2d(32, 64, 4, 2, 1), BatchNorm2d(64), LeakyReLU(0.2)", note: "(32 + 2 − 4)/2 + 1 = 16." },
  { name: "enc3", c: 128, s: 8, ci: 64, k: 4, code: "nn.Conv2d(64, 128, 4, 2, 1), BatchNorm2d(128), LeakyReLU(0.2)", note: "(16 + 2 − 4)/2 + 1 = 8." },
  { name: "enc4", c: 256, s: 4, ci: 128, k: 4, code: "nn.Conv2d(128, 256, 4, 2, 1), BatchNorm2d(256), LeakyReLU(0.2)", note: "256 × 4 × 4 = 4,096 numbers. Space has been traded for channels." },
  { name: "code z", c: 128, s: 1, fc: 4096, code: "nn.Flatten(), nn.Linear(4096, latent_dim)   # latent_dim = 128", note: "The bottleneck from your screenshot: 12,288 → 128 numbers, about 1%." },
  { name: "dec0", c: 256, s: 4, fc: 128, code: "nn.Linear(latent_dim, 4096), Unflatten → (256, 4, 4)", note: "Start rebuilding: expand the code back to a small 4×4 image with 256 channels." },
  { name: "dec1", c: 128, s: 8, ci: 256, k: 4, t: 1, code: "nn.ConvTranspose2d(256, 128, 4, 2, 1), BatchNorm2d(128), ReLU", note: "Transposed conv doubles the size (D2L §14.10): (4 − 1)·2 − 2 + 4 = 8." },
  { name: "dec2", c: 64, s: 16, ci: 128, k: 4, t: 1, code: "nn.ConvTranspose2d(128, 64, 4, 2, 1), BatchNorm2d(64), ReLU", note: "8 → 16." },
  { name: "dec3", c: 32, s: 32, ci: 64, k: 4, t: 1, code: "nn.ConvTranspose2d(64, 32, 4, 2, 1), BatchNorm2d(32), ReLU", note: "16 → 32." },
  { name: "output", c: 3, s: 64, ci: 32, k: 4, t: 1, code: "nn.ConvTranspose2d(32, 3, 4, 2, 1), nn.Sigmoid()", note: "32 → 64, back to 3 colours, squashed to [0, 1] like pixel values." }
];
ARCH.forEach(a => {
  a.params = a.fc ? a.fc * (a.c * a.s * a.s) + a.c * a.s * a.s : a.ci ? a.ci * a.c * a.k * a.k + a.c : 0;
  if (a.name === "code z") a.params = 4096 * 128 + 128;
  a.flops = a.fc ? 2 * a.fc * (a.c * a.s * a.s) : a.ci ? 2 * (a.t ? a.ci * (a.s / 2) ** 2 * a.c * a.k * a.k : a.c * a.s * a.s * a.ci * a.k * a.k) : 0;
});
let s10sel = 0;
function info10() {
  const a = ARCH[s10sel], tot = ARCH.reduce((s, x) => s + x.params, 0);
  $("#s10-info").innerHTML = `<h3>${a.name}: shape (${a.c}, ${a.s}, ${a.s}) = ${(a.c * a.s * a.s).toLocaleString()} numbers</h3><pre class="code">${esc(a.code)}</pre><p class="note">${a.note}</p>
   <p class="note">Weights in this layer: <b>${a.params.toLocaleString()}</b> · whole network: ${tot.toLocaleString()} (BatchNorm adds a few thousand more).</p>`;
  const F = ARCH.reduce((s, x) => s + x.flops, 0) * 3;
  $("#s10-flops").innerHTML = `One face, forward and backward, is about <b>${(F / 1e6).toFixed(0)} million</b> multiply-adds (forward ×3 is the usual rule of thumb). One pass over 50,000 faces is about <b>${(F * 5e4 / 1e12).toFixed(1)} trillion</b>. A laptop CPU manages tens of billions per second, so that's minutes per epoch. The L4's tensor cores do tens of trillions per second in bf16, which brings it down to seconds. That's the whole reason for the GPU: these are the same multiply-and-add operations as station 1, just billions of them.`;
}
ST.s10 = {
  tab: "On the GPU", cam: [[0, 15, 27], [0, 1.5, 0]],
  legend: () => `<b>The notebook's conv autoencoder</b><div class="row"><span>footprint = image size</span><span>height = channels</span><span><i class="sw" style="background:var(--c1)"></i>bottleneck</span></div>`,
  init() { info10(); },
  draw() {
    const n = ARCH.length, gap = 2.6;
    ARCH.forEach((a, i) => {
      const x = (i - (n - 1) / 2) * gap, side = Math.max(0.35, a.s / 64 * 2.2), h = Math.max(0.2, Math.sqrt(a.c) * 0.32);
      const col = a.name === "code z" ? C.c1 : i < 5 ? C.c2 : i === 0 || i === n - 1 ? C.c3 : C.c3;
      const c2 = i === s10sel ? C.c4 : (i === 0 || i === n - 1) ? C.c5 : col;
      if (a.name === "code z") { for (let k = 0; k < 128; k++) V.box(x + ((k % 8) - 3.5) * 0.2, (k / 8 | 0) * 0.2, 0, 0.17, 0.17, 0.17, i === s10sel ? C.c4 : C.c1, { arch: i }); }
      else V.box(x, 0, 0, side, h, side, c2, { arch: i });
      pin(x, (a.name === "code z" ? 3.4 : h) + 0.5, 0, `${a.c}×${a.s}×${a.s}`, i === s10sel ? "soft" : "");
      if (i < n - 1) Ln.seg(x + side / 2, 0.2, 0, x + gap - 0.6, 0.2, 0, C.muted);
    });
    pin(-((n - 1) / 2) * gap, 0.1, 2.4, "encoder →", "flat"); pin(((n - 1) / 2) * gap, 0.1, 2.4, "→ decoder", "flat");
  },
  onPick(t) { if (t && t.arch != null) { s10sel = t.arch; info10(); } },
  onHover(t) { if (t && t.arch != null) { const a = ARCH[t.arch]; return `${a.name}: (${a.c}, ${a.s}, ${a.s})`; } },
  state: () => `selected layer ${ARCH[s10sel].name}: ${ARCH[s10sel].code}. The network is the conv autoencoder in the Colab notebook: 64×64×3 → 128 numbers → 64×64×3, trained on CelebA on an L4 GPU with bf16.`
};
