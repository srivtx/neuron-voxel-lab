/* ================= live equations: move the inputs, watch every term ================= */
const LIVE = {
bayes: { t: "Bayes' rule with real numbers", c: ["bayes"], eq: "[P(sick|+)|1|what you want: chance you're sick given a positive test] = [P(+|sick)|2|sensitivity] · [P(sick)|3|prior: prevalence] / [P(+)|4|all the ways to test positive]", v: [["prev", "P(sick)", 0.001, 0.5, 0.001, 0.01], ["sens", "P(+ | sick)", 0.5, 1, 0.005, 0.9], ["fpr", "P(+ | healthy)", 0, 0.5, 0.005, 0.05]],
  f: v => { const a = v.sens * v.prev, b = v.fpr * (1 - v.prev), pp = a + b; return { rows: [["sick and positive", `${f3(v.sens)} × ${f3(v.prev)}`, a], ["healthy but positive", `${f3(v.fpr)} × ${f3(1 - v.prev)}`, b], ["P(+) = both", `${a.toFixed(4)} + ${b.toFixed(4)}`, pp]], out: ["P(sick | +)", a / pp], say: `Out of every 10,000 people tested: ${Math.round(a * 1e4)} are sick and positive, ${Math.round(b * 1e4)} are healthy and positive.` }; } },
gauss: { t: "The Gaussian density, term by term", c: ["gauss"], eq: "[p(x)|1|density at x] = [1/(σ√(2π))|4|makes the total area 1] · exp( −[(x−μ)²|3|squared distance from the centre] / [2σ²|2|measured in units of the spread] )", v: [["x", "x", -5, 5, 0.05, 1], ["m", "μ", -3, 3, 0.05, 0], ["s", "σ", 0.2, 3, 0.05, 1]],
  f: v => { const z = (v.x - v.m) / v.s, e = Math.exp(-z * z / 2), k = 1 / (v.s * Math.sqrt(2 * Math.PI)), p = k * e; return { rows: [["z = (x − μ)/σ", `(${f2(v.x)} − ${f2(v.m)}) / ${f2(v.s)}`, z], ["exp(−z²/2)", `exp(−${f3(z * z)}/2)`, e], ["1/(σ√2π)", `1/(${f2(v.s)} × 2.507)`, k], ["−log p(x)", "= z²/2 + log(σ√2π)", -Math.log(p)]], out: ["p(x)", p], say: "The −log row is z²/2 plus a constant. That's squared error, which is where it comes from." }; } },
sigmoid: { t: "Sigmoid and its slope", c: ["sigm", "neuron"], eq: "[σ(z)|1|the squash] = 1 / (1 + [e^{−z}|3|huge when z is very negative, tiny when z is large]),   [σ′(z)|2|its slope] = σ(z)(1 − σ(z))", v: [["z", "z", -8, 8, 0.05, 1.1]],
  f: v => { const e = Math.exp(-v.z), s = 1 / (1 + e); return { rows: [["e^(−z)", `e^(−${f2(v.z)})`, e], ["1 + e^(−z)", "", 1 + e], ["slope σ(1 − σ)", `${f3(s)} × ${f3(1 - s)}`, s * (1 - s)]], out: ["σ(z)", s], say: "The slope is at most 0.25 (at z = 0) and nearly 0 at the ends. That's why stacked sigmoids make gradients vanish (D2L §5.4)." }; } },
softmax: { t: "Softmax and the log-sum-exp trick", c: ["cat", "softreg"], eq: "[pₖ|1|probability of class k] = [e^{zₖ/T}|3|make each score positive] / [Σⱼ e^{zⱼ/T}|4|divide by the total so they sum to 1]", v: [["a", "score z₁", -5, 10, 0.1, 2], ["b", "score z₂", -5, 10, 0.1, 1], ["c", "score z₃", -5, 10, 0.1, 0.1], ["T", "temperature T", 0.1, 5, 0.05, 1]],
  f: v => { const z = [v.a, v.b, v.c].map(x => x / v.T), m = Math.max(...z), e = z.map(x => Math.exp(x - m)), s = e.reduce((p, q) => p + q, 0), p = e.map(x => x / s); return { rows: [["subtract max (stability)", `max = ${f2(m)}`, m], ["e^(z−max)", e.map(f3).join(", "), s], ["p₁, p₂, p₃", p.map(f3).join(", "), 1], ["log Σ e^z", `${f2(m)} + log(${f3(s)})`, m + Math.log(s)]], out: ["p₁", p[0]], say: "Subtracting the max changes nothing in the answer but keeps e^z from overflowing (Murphy §2.5.4). Low T → winner takes all; high T → uniform." }; } },
coinmle: { t: "Likelihood of a coin, and its peak", c: ["likelihood", "mle", "nll"], eq: "[log L(θ)|1|log-likelihood] = [h|3|heads] log θ + [(n−h)|2|tails] log(1 − θ),   [θ̂|4|MLE] = h / n", v: [["h", "heads h", 0, 20, 1, 7], ["n", "flips n", 1, 20, 1, 10], ["th", "try θ", 0.01, 0.99, 0.01, 0.5]],
  f: v => { const h = Math.min(v.h, v.n), L = th => h * Math.log(th) + (v.n - h) * Math.log(1 - th), hat = h / v.n; return { rows: [["h log θ", `${h} × log ${f2(v.th)}`, h * Math.log(v.th)], ["(n−h) log(1−θ)", `${v.n - h} × log ${f2(1 - v.th)}`, (v.n - h) * Math.log(1 - v.th)], ["log L at your θ", "", L(v.th)], ["log L at θ̂ = h/n", `θ̂ = ${f3(hat)}`, hat > 0 && hat < 1 ? L(hat) : 0]], out: ["θ̂ (MLE)", hat], say: "Move 'try θ' and you'll never beat the last row. Setting the slope h/θ − (n−h)/(1−θ) to zero gives θ̂ = h/n (Murphy §4.2.3)." }; } },
betamap: { t: "Prior + data: MAP and posterior mean", c: ["prior", "map", "conjugate"], eq: "[θ_MAP|1|peak of the posterior] = (h + [a|2|prior heads + 1] − 1) / (n + a + [b|2|prior tails + 1] − 2)", v: [["a", "prior a", 1, 20, 0.5, 2], ["b", "prior b", 1, 20, 0.5, 2], ["h", "heads h", 0, 20, 1, 3], ["n", "flips n", 0, 20, 1, 3]],
  f: v => { const h = Math.min(v.h, v.n), A = v.a + h, B = v.b + v.n - h; return { rows: [["posterior", `Beta(${A}, ${B})`, A + B], ["MLE h/n", v.n ? `${h}/${v.n}` : "0/0", v.n ? h / v.n : NaN], ["posterior mean", `${A}/(${A}+${B})`, A / (A + B)]], out: ["θ_MAP", A + B - 2 > 0 ? (A - 1) / (A + B - 2) : NaN], say: "The prior acts like a − 1 extra heads and b − 1 extra tails you'd already seen. With 3 heads in 3 flips, the MLE says 1.0; the prior keeps you sane." }; } },
entropy: { t: "Entropy of a coin", c: ["entropy"], eq: "[H|1|average surprise in bits] = −[p|3|chance of heads] log₂ p − (1−p) log₂(1−p)", v: [["p", "p", 0.001, 0.999, 0.001, 0.5]],
  f: v => { const s1 = -Math.log2(v.p), s0 = -Math.log2(1 - v.p); return { rows: [["surprise of heads −log₂ p", "", s1], ["surprise of tails", "", s0], ["weighted average", `${f3(v.p)}·${f2(s1)} + ${f3(1 - v.p)}·${f2(s0)}`, v.p * s1 + (1 - v.p) * s0]], out: ["H (bits)", v.p * s1 + (1 - v.p) * s0], say: "Maximum is 1 bit at p = 0.5, where you're most unsure. A rare event is very surprising but rarely happens, so it adds little to the average." }; } },
kl: { t: "Cross-entropy = entropy + KL", c: ["xent", "kl"], eq: "[H(p,q)|1|cross-entropy] = [H(p)|3|unavoidable surprise] + [KL(p‖q)|4|extra surprise from the wrong model]", v: [["p", "true p", 0.01, 0.99, 0.01, 0.7], ["q", "model q", 0.01, 0.99, 0.01, 0.4]],
  f: v => { const H = -(v.p * Math.log2(v.p) + (1 - v.p) * Math.log2(1 - v.p)), X = -(v.p * Math.log2(v.q) + (1 - v.p) * Math.log2(1 - v.q)); return { rows: [["H(p)", "", H], ["H(p, q)", "", X], ["KL = H(p,q) − H(p)", "", X - H]], out: ["KL(p‖q) bits", X - H], say: "Training with cross-entropy can only lower the KL part, since H(p) is fixed by the data. So minimising cross-entropy = making q match p." }; } },
dot: { t: "Dot product = overlap", c: ["dot", "neuron"], eq: "[w·x|1|the neuron's vote] = [w₁x₁|3|first product] + [w₂x₂|3|second product] = ‖w‖‖x‖ [cos θ|4|how aligned they are]", v: [["w1", "w₁", -3, 3, 0.05, 1], ["w2", "w₂", -3, 3, 0.05, 0.5], ["x1", "x₁", -3, 3, 0.05, 2], ["x2", "x₂", -3, 3, 0.05, -1]],
  f: v => { const d = v.w1 * v.x1 + v.w2 * v.x2, nw = Math.hypot(v.w1, v.w2), nx = Math.hypot(v.x1, v.x2); return { rows: [["w₁x₁", "", v.w1 * v.x1], ["w₂x₂", "", v.w2 * v.x2], ["‖w‖ ‖x‖", "", nw * nx], ["cos θ", "", d / (nw * nx || 1)]], out: ["w·x", d], say: `Angle between them: ${Math.round(Math.acos(clamp(d / (nw * nx || 1), -1, 1)) * 180 / Math.PI)}°. Perpendicular means zero vote; pointing the same way means the biggest vote.` }; } },
gdstep: { t: "One gradient-descent step on (w − 3)²", c: ["gd"], eq: "[w_new|1|after the step] = [w|2|now] − [η|4|step size] · [2(w − 3)|3|slope of (w−3)² at w]", v: [["w", "w now", -5, 10, 0.1, 0], ["eta", "η", 0.01, 1.2, 0.01, 0.1]],
  f: v => { const g = 2 * (v.w - 3), n = v.w - v.eta * g; return { rows: [["loss (w − 3)²", "", (v.w - 3) ** 2], ["slope 2(w − 3)", "", g], ["step −η·slope", `−${f2(v.eta)} × ${f2(g)}`, -v.eta * g], ["new loss", "", (n - 3) ** 2]], out: ["w_new", n], say: v.eta > 1 ? "η > 1: each step overshoots by more than it started. The loss grows: divergence." : v.eta === 0.5 ? "η = 0.5 lands exactly on the minimum in one step, because 1/curvature = 1/2." : "The distance to the minimum shrinks by a factor |1 − 2η| each step." }; } },
chain: { t: "The chain rule through one neuron", c: ["chain", "backprop"], eq: "[∂L/∂w|1|what we need] = [∂L/∂a|3|−1/a] · [∂a/∂z|3|a(1−a)] · [∂z/∂w|3|x] = [(a − 1)·x|4|after cancelling]", v: [["x", "input x", -3, 3, 0.05, 1.5], ["w", "weight w", -3, 3, 0.05, 0.6]],
  f: v => { const z = v.w * v.x, a = sig(z); return { rows: [["z = w·x", "", z], ["a = σ(z)", "", a], ["∂L/∂a (L = −log a)", "−1/a", -1 / a], ["∂a/∂z", "a(1 − a)", a * (1 - a)], ["∂z/∂w", "x", v.x]], out: ["∂L/∂w", -1 / a * a * (1 - a) * v.x], say: `The product (−1/a)·a(1−a)·x simplifies to (a − 1)·x = ${f3((a - 1) * v.x)}. Same number, much less work.` }; } },
convsize: { t: "Conv output size", c: ["pool", "conv"], eq: "[out|1|output width] = ⌊([n|3|input width] + 2[p|2|padding] − [k|2|kernel]) / [s|4|stride]⌋ + 1", v: [["n", "input n", 4, 128, 1, 64], ["k", "kernel k", 1, 11, 1, 4], ["p", "padding p", 0, 5, 1, 1], ["s", "stride s", 1, 4, 1, 2]],
  f: v => { const inner = v.n + 2 * v.p - v.k; return { rows: [["n + 2p − k", `${v.n} + ${2 * v.p} − ${v.k}`, inner], ["÷ s, rounded down", "", Math.floor(inner / v.s)]], out: ["out", Math.floor(inner / v.s) + 1], say: "Count the positions the kernel can sit at: start at 0, jump s at a time, and stop when it would fall off the padded edge." }; } },
mahal: { t: "Mahalanobis distance in 2-D", c: ["mvn", "cov"], eq: "[d²|1|squared distance in 'spread units'] = (x−μ)ᵀ [Σ⁻¹|4|undo the stretch and tilt] (x−μ)", v: [["x1", "x₁", -3, 3, 0.05, 1], ["x2", "x₂", -3, 3, 0.05, 1], ["s1", "σ₁", 0.3, 2, 0.05, 1], ["s2", "σ₂", 0.3, 2, 0.05, 1], ["r", "ρ", -0.95, 0.95, 0.01, 0.8]],
  f: v => { const u = v.x1 / v.s1, w = v.x2 / v.s2, d2 = (u * u - 2 * v.r * u * w + w * w) / (1 - v.r * v.r); return { rows: [["x₁/σ₁, x₂/σ₂", `${f2(u)}, ${f2(w)}`, u], ["plain distance²", "x₁² + x₂²", v.x1 ** 2 + v.x2 ** 2], ["with correlation", "(u² − 2ρuw + w²)/(1−ρ²)", d2]], out: ["d²", d2], say: "Try ρ = 0.8 with x = (1, 1) and then x = (1, −1). Same plain distance, but (1, −1) goes against the correlation, so it's much more surprising." }; } },
clt: { t: "Standard error of an average", c: ["clt", "sampdist"], eq: "[SE|1|typical error of the average] = [σ|3|spread of one value] / [√n|4|square root of the sample size]", v: [["s", "σ", 0.1, 5, 0.1, 1], ["n", "n", 1, 1000, 1, 25]],
  f: v => ({ rows: [["√n", "", Math.sqrt(v.n)], ["n needed to halve SE", `4 × ${v.n}`, 4 * v.n]], out: ["SE", v.s / Math.sqrt(v.n)], say: "Quadruple the data to halve the error. That's why going from 90% to 99% certainty is so expensive." }) },
matvec: { t: "Matrix × vector", c: ["matrix"], eq: "[Ax|1|output] = [ a·x₁ + b·x₂ ,  c·x₁ + d·x₂ ]  — each row of A dotted with x", v: [["a", "a", -2, 2, 0.05, 1], ["b", "b", -2, 2, 0.05, 0.5], ["c", "c", -2, 2, 0.05, 0], ["d", "d", -2, 2, 0.05, 1], ["x1", "x₁", -2, 2, 0.05, 1], ["x2", "x₂", -2, 2, 0.05, 1]],
  f: v => ({ rows: [["row 1 · x", `${f2(v.a)}·${f2(v.x1)} + ${f2(v.b)}·${f2(v.x2)}`, v.a * v.x1 + v.b * v.x2], ["row 2 · x", `${f2(v.c)}·${f2(v.x1)} + ${f2(v.d)}·${f2(v.x2)}`, v.c * v.x1 + v.d * v.x2], ["det A", "ad − bc", v.a * v.d - v.b * v.c]], out: ["|Ax| / |x|", Math.hypot(v.a * v.x1 + v.b * v.x2, v.c * v.x1 + v.d * v.x2) / (Math.hypot(v.x1, v.x2) || 1)], say: "A layer of 2 neurons with 2 inputs is exactly this: each row is one neuron's weights." }) },
mse_vs_ce: { t: "Squared error vs cross-entropy on one example", c: ["nll", "xent"], eq: "[(y − a)²|2|squared error] vs [−log a|1|cross-entropy, when y = 1]", v: [["a", "prediction a for a true label y = 1", 0.001, 0.999, 0.001, 0.05]],
  f: v => ({ rows: [["squared error", "(1 − a)²", (1 - v.a) ** 2], ["its slope w.r.t. z", "−2(1−a)·a(1−a)", -2 * (1 - v.a) * v.a * (1 - v.a)], ["cross-entropy slope w.r.t. z", "a − 1", v.a - 1]], out: ["−log a", -Math.log(v.a)], say: "When the model is confidently wrong (a near 0), the squared-error slope is nearly 0, so it barely learns. Cross-entropy's slope stays near −1 and pushes hard." }) }
};
function liveHTML(id) { const L = LIVE[id]; return `<div class="live" data-live="${id}"><p class="eyebrow">Live equation</p><h4>${esc(L.t)}</h4><div class="eq">${eqHTML(L.eq)}</div><p class="eq-say">Tap a coloured symbol to see what it means.</p><div class="live-ctl">${L.v.map(([k, l, a, b, s, d]) => `<div class="ctl"><label>${esc(l)}</label><input type="range" min="${a}" max="${b}" step="${s}" value="${d}" data-k="${k}"><output></output></div>`).join("")}</div><div class="live-out"></div></div>`; }
function bindLive(root) {
  root.querySelectorAll(".live").forEach(box => {
    if (box.dataset.bound) return; box.dataset.bound = 1; const L = LIVE[box.dataset.live], ins = box.querySelectorAll("input"), out = box.querySelector(".live-out");
    const fmt = x => typeof x === "number" ? (isFinite(x) ? (Math.abs(x) >= 1000 ? x.toFixed(0) : Math.abs(x) < 0.001 && x !== 0 ? x.toExponential(2) : x.toFixed(4).replace(/\.?0+$/, "") || "0") : "undefined") : x;
    const run = () => { const v = {}; ins.forEach(i => { v[i.dataset.k] = +i.value; i.nextElementSibling.textContent = fmt(+i.value); }); const r = L.f(v); out.innerHTML = `<table class="t">${r.rows.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td class="mid">${esc(b)}</td><td>${fmt(c)}</td></tr>`).join("")}<tr class="now"><td><b>${esc(r.out[0])}</b></td><td></td><td><b>${fmt(r.out[1])}</b></td></tr></table><p class="note" style="color:var(--ink)">${esc(r.say)}</p>`; };
    ins.forEach(i => i.oninput = run); run();
    const say = box.querySelector(".eq-say"); box.querySelectorAll(".sym").forEach(s => { const f = () => { box.querySelectorAll(".sym").forEach(x => x.classList.toggle("on", x === s)); say.innerHTML = `<b>${esc(s.textContent)}</b>: ${esc(s.dataset.m)}`; }; s.onclick = f; s.onmouseenter = f; });
  });
}
/* which live equations belong to which Murphy section */
const LIVE_SEC = { "M2.3": ["bayes"], "M2.4": ["sigmoid"], "M2.5": ["softmax"], "M2.6": ["gauss"], "M2.8": ["clt"], "M3.2": ["mahal"], "M4.2": ["coinmle"], "M4.5": ["betamap"], "M4.6": ["betamap"], "M4.7": ["clt"], "M6.1": ["entropy", "mse_vs_ce"], "M6.2": ["kl"], "M7.2": ["dot", "matvec"], "M7.8": ["chain"], "M8.2": ["gdstep"], "M10.2": ["sigmoid", "mse_vs_ce"], "M13.3": ["chain"], "M14.2": ["convsize"], "D2.3": ["dot", "matvec"], "D2.4": ["gdstep", "chain"], "D2.6": ["bayes"], "D3.1": ["gauss"], "D4.1": ["softmax", "mse_vs_ce"], "D5.3": ["chain"], "D7.3": ["convsize"], "D12.3": ["gdstep"] };

/* ================= AI explanations through the site's own server (OpenCode key lives there) ================= */
const AIKEY = "nvl-ai-";
async function askAI(messages) {
  let code = ""; try { code = localStorage.getItem("nvl-access") || ""; } catch (e) { }
  let sid = ""; try { sid = localStorage.getItem("nvl-session") || ""; if (!sid) { sid = "nvl-" + Math.random().toString(36).slice(2, 14); localStorage.setItem("nvl-session", sid); } } catch (e) { sid = "nvl-" + Math.random().toString(36).slice(2, 14); }
  let r; try { r = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json", "x-access-code": code, "x-session": sid }, body: JSON.stringify({ messages }) }); }
  catch (e) { throw { code: "offline", message: "Asking works on the hosted site (Vercel). This copy can't reach the internet." }; }
  let j = null; try { j = await r.json(); } catch (e) { }
  if (r.status === 401) throw { code: "auth", message: "This site needs its access code. Enter it below once; it's saved in this browser." };
  if (!r.ok || !j || !j.text) throw { code: "server", message: j && j.error ? j.error : "Asking works on the hosted site (Vercel). This copy has no server behind it." };
  return j;
}
function aiErrorHTML(e, retry) {
  const box = document.createElement("div"); box.className = "note"; box.innerHTML = esc(e.message || "Something went wrong.");
  if (e.code === "auth") { const i = document.createElement("input"); i.className = "text-in"; i.placeholder = "Access code"; const b = document.createElement("button"); b.className = "btn"; b.textContent = "Save and retry"; b.onclick = () => { try { localStorage.setItem("nvl-access", i.value.trim()); } catch (x) { } retry(); }; box.append(document.createElement("br"), i, b); }
  return box;
}
function explainButton(host, key, promptFn, label = "Explain this simply (AI)") {
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "btn ai"; btn.textContent = label;
  const out = document.createElement("div"); out.className = "ai-out";
  const show = (text, model, cut) => { out.innerHTML = md(text) + (cut ? `<p class="cut">This explanation was cut short. Press "Explain again" or ask below for the rest.</p>` : "") + `<p class="note">Written by ${esc(model || "AI")} on request; check it against the book.</p>`; btn.textContent = "Explain again"; };
  let cached = null; try { cached = JSON.parse(localStorage.getItem(AIKEY + key) || "null"); } catch (e) { }
  if (cached) show(cached.text, cached.model, cached.truncated);
  const run = async () => {
    btn.disabled = true; out.innerHTML = `<p class="note">Thinking…</p>`;
    try { const j = await askAI([{ role: "user", content: promptFn() }]); show(j.text, j.model, j.truncated); try { localStorage.setItem(AIKEY + key, JSON.stringify({ text: j.text, model: j.model, truncated: !!j.truncated })); } catch (e) { } }
    catch (e) { out.innerHTML = ""; out.append(aiErrorHTML(e, run)); }
    finally { btn.disabled = false; }
  };
  btn.onclick = run; host.append(btn, out);
}
const EASY_RULES = "Explain for a learner who only remembers what he has verified himself and rejects unexplained abstraction. Start with an everyday picture or a tiny numeric example, then the idea in plain words, then the equation with every symbol explained and a small worked number, then why it matters and what it connects to. Short paragraphs (\"- \" lists allowed), **bold** only for a few key terms and always closed, math in plain characters (x², Σ, √, ·), never LaTeX. Under 300 words, and end on a complete sentence.";

/* ================= drawers: library, symbols ================= */
function drawer(id, title, sub) {
  let d = document.getElementById(id); if (d) return d;
  d = document.createElement("div"); d.className = "drawer"; d.id = id; d.hidden = true;
  d.innerHTML = `<div class="drawer-card" role="dialog" aria-label="${esc(title)}"><div class="drawer-head"><div><p class="eyebrow">${esc(sub)}</p><h2>${esc(title)}</h2></div><button class="iconbtn" type="button" data-close aria-label="Close">✕</button></div><div class="drawer-body"></div></div>`;
  document.body.appendChild(d); d.querySelector("[data-close]").onclick = () => d.hidden = true; d.addEventListener("click", e => { if (e.target === d) d.hidden = true; });
  return d;
}
let libBook = "M";
function openLibrary(book) {
  const d = drawer("library", "Library", "Three books · every chapter"); libBook = book || (curChap ? curChap[0] : "M"); d.hidden = false; renderLibrary();
}
function chapterStats(b, n) { const secs = TOC[b].filter(x => x[0].split(".")[0] === n && x[0].split(".").length === 2 && !/Exercises|Summary/.test(x[1])), ex = secs.filter(s => SEC[b + s[0]]).length, info = CHI[b + n], old = chInfo(b, n); return { total: secs.length, ex, labs: (info ? info.sims : old ? old[6] : []).length }; }
function renderLibrary(q = "") {
  const body = $("#library .drawer-body");
  body.innerHTML = `<div class="libtop"><div class="booktabs">${Object.entries(BOOKN).map(([b, n]) => `<button type="button" class="booktab${b === libBook ? " on" : ""}" data-b="${b}"><span class="spine s${b}"></span><span><b>${esc(n.split(" · ")[0])}</b><small>${esc(n.split(" · ")[1] || "Zhang, Lipton, Li, Smola")} · ${chapters(b).length} chapters</small></span></button>`).join("")}</div>
    <label class="search"><span>Find</span><input class="text-in" id="lib-q" placeholder="a chapter, section or concept… e.g. softmax, Kalman, dropout" value="${esc(q)}" autocomplete="off"></label></div><div id="lib-list"></div>`;
  body.querySelectorAll(".booktab").forEach(b => b.onclick = () => { libBook = b.dataset.b; renderLibrary($("#lib-q").value); });
  const inp = $("#lib-q"); inp.oninput = () => fillLib(inp.value); fillLib(q); if (q) inp.focus();
}
function fillLib(q) {
  const list = $("#lib-list"); q = q.trim().toLowerCase();
  if (!q) {
    list.innerHTML = `<div class="chgrid">${chapters(libBook).map(c => { const s = chapterStats(libBook, c[0]), k = libBook + c[0]; return `<button type="button" class="chtile${k === curChap ? " cur" : ""}" data-k="${k}"><span class="chn">${c[0]}</span><span class="cht">${esc(c[1].replace(/\s*\*$/, ""))}</span><span class="chm">p. ${c[2]} · ${s.total} sections${s.labs ? " · " + s.labs + " lab" + (s.labs > 1 ? "s" : "") : ""}${(() => { const xs = EX_OF(k); if (!xs.length) return ""; const d = xs.filter(e => EXDONE.has(e.id)).length; return ` · <span class="exb${d === xs.length ? " all" : ""}">${d}/${xs.length} exercises</span>`; })()}</span><span class="bar"><i style="width:${s.total ? s.ex / s.total * 100 : 0}%"></i></span></button>`; }).join("")}</div><p class="note">The green bar shows how many sections have a written explanation so far; the exercise count is your own progress. Every section has AI explain and ask buttons.</p>`;
    list.querySelectorAll(".chtile").forEach(t => t.onclick = () => { $("#library").hidden = true; goChapter(t.dataset.k); });
    return;
  }
  const hits = []; for (const b of "MDA") for (const x of TOC[b]) if (x[1].toLowerCase().includes(q)) hits.push({ b, x });
  const ch = CONCEPTS.filter(c => (c.name + " " + c.easy).toLowerCase().includes(q)).slice(0, 8);
  list.innerHTML = `${ch.length ? `<h3 class="lh">Concepts</h3><div class="hits">${ch.map(c => `<button type="button" class="hit" data-c="${c.id}"><b>${esc(c.name)}</b><small>floor ${c.floor} · ${esc(FLOORS[c.floor])}</small></button>`).join("")}</div>` : ""}
    <h3 class="lh">Sections (${hits.length})</h3><div class="hits">${hits.slice(0, 60).map(({ b, x }) => `<button type="button" class="hit" data-b="${b}" data-n="${x[0]}"><b>${esc(BOOKN[b].split(" · ")[0])} §${x[0]} ${esc(x[1])}</b><small>p. ${x[2]}</small></button>`).join("") || "<p class='note'>Nothing matches.</p>"}</div>`;
  list.querySelectorAll("[data-c]").forEach(h => h.onclick = () => { $("#library").hidden = true; goConcept(h.dataset.c); });
  list.querySelectorAll("[data-n]").forEach(h => h.onclick = () => { $("#library").hidden = true; const parts = h.dataset.n.split("."); goChapter(h.dataset.b + parts[0], parts.length > 1 ? parts.slice(0, 2).join(".") : null); });
}
function openSymbols() {
  const d = drawer("symbols", "Symbols decoder", "The alphabet the books are written in"); d.hidden = false;
  const body = d.querySelector(".drawer-body");
  body.innerHTML = `<label class="search"><span>Find</span><input class="text-in" id="sym-q" placeholder="Σ, gradient, given, ~ …" autocomplete="off"></label><p class="note">Most of what makes an equation feel abstract is the alphabet. There are about 55 symbols; learn them once and every chapter becomes readable.</p><div class="symgrid" id="sym-list"></div>`;
  const fill = q => { q = (q || "").toLowerCase(); $("#sym-list").innerHTML = SYMBOLS.filter(s => !q || s.join(" ").toLowerCase().includes(q)).map(([s, n, m, e, c]) => `<div class="symcard"><div class="sy">${esc(s)}</div><div><b>${esc(n)}</b><p>${esc(m)}</p><p class="ex">e.g. ${esc(e)}</p>${c ? `<code>${esc(c)}</code>` : ""}</div></div>`).join(""); };
  $("#sym-q").oninput = e => fill(e.target.value); fill("");
}

/* ================= concept map: the tower ================= */
let selC = "bayes";
function layoutConcepts() {
  const byF = {}; CONCEPTS.forEach(c => (byF[c.floor] = byF[c.floor] || []).push(c));
  for (const f in byF) { const arr = byF[f], n = arr.length, R = 3.2 + n * 0.42; arr.forEach((c, i) => { const a = i / n * Math.PI * 2 + f * 0.5; c.pos = [Math.cos(a) * R, +f * 2.3, Math.sin(a) * R]; }); }
}
function ancestors(id, acc = new Set()) { for (const p of CI[id].pre) if (!acc.has(p)) { acc.add(p); ancestors(p, acc); } return acc; }
function descendants(id, acc = new Set()) { for (const p of CI[id].next) if (!acc.has(p)) { acc.add(p); descendants(p, acc); } return acc; }
function learningPath(id) { const anc = ancestors(id), order = [], seen = new Set(); const visit = x => { if (seen.has(x)) return; seen.add(x); CI[x].pre.forEach(visit); order.push(x); }; [...anc].forEach(visit); return order; }
ST.cmap = {
  tab: "Concept map", cam: [[0, 16, 34], [0, 10, 0]],
  legend() { return `<b>130 ideas, ground floor up</b><div class="row"><span><i class="sw" style="background:var(--c4)"></i>selected</span><span><i class="sw" style="background:var(--c3)"></i>needs (below)</span><span><i class="sw" style="background:var(--c1)"></i>unlocks (above)</span></div>`; },
  draw() {
    if (!CONCEPTS[0].pos) layoutConcepts();
    const anc = ancestors(selC), des = descendants(selC), s = CI[selC];
    for (let f = 0; f < FLOORS.length; f++) { const n = CONCEPTS.filter(c => c.floor === f).length, R = 3.2 + n * 0.42 + 0.9; for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; V.box(Math.cos(a) * R, f * 2.3 - 0.12, Math.sin(a) * R, 0.5, 0.06, 0.5, C.line, null); } pin(R + 0.6, f * 2.3, 0, f + " · " + FLOORS[f].split(":")[0].split(" (")[0], "flat"); }
    for (const c of CONCEPTS) {
      const hot = c.id === selC, a = anc.has(c.id), d = des.has(c.id), col = hot ? C.c4 : a ? C.c3 : d ? C.c1 : mix(C.c5, C.bg, 0.25);
      V.box(c.pos[0], c.pos[1], c.pos[2], hot ? 0.95 : 0.62, hot ? 0.95 : 0.62, hot ? 0.95 : 0.62, col, { cid: c.id });
      for (const p of c.pre) { const q = CI[p].pos, on = (c.id === selC || anc.has(c.id)) && (anc.has(p)) || (p === selC) || (d && (des.has(p) || p === selC)); if (on || hot) Ln.seg(q[0], q[1] + 0.3, q[2], c.pos[0], c.pos[1] + 0.3, c.pos[2], a || c.id === selC ? C.c3 : C.c1); }
    }
    pin(s.pos[0], s.pos[1] + 1.3, s.pos[2], s.name, "soft");
    s.pre.forEach(p => { const q = CI[p].pos; pin(q[0], q[1] + 0.9, q[2], CI[p].name, "ok"); });
    s.next.forEach(p => { const q = CI[p].pos; pin(q[0], q[1] + 0.9, q[2], CI[p].name, "hot"); });
  },
  onPick(t) { if (t && t.cid) goConcept(t.cid, false); },
  onHover(t) { if (t && t.cid) { const c = CI[t.cid]; return `${c.name}\nfloor ${c.floor} · needs ${c.pre.length} · unlocks ${c.next.length}`; } },
  state() { return `concept map, selected concept "${CI[selC].name}"`; }
};
function labHome(id) { for (const [k, v] of Object.entries(CHI)) if (v.sims.includes(id)) return k; const c = CH.find(x => x[6].includes(id)); return c ? c[0] + c[1] : "M1"; }
function goConcept(id, fly = true) {
  selC = id; const c = CI[id]; mode = "concept";
  $$("[data-station]").forEach(s => s.hidden = true); $("#chapview").hidden = true; $("#back-bar").hidden = true; $("#conceptview").hidden = false;
  if (cur && cur !== ST.cmap && cur.exit) cur.exit(); cur = ST.cmap; cur.id = "cmap"; $("#legend").innerHTML = cur.legend();
  if (!CONCEPTS[0].pos) layoutConcepts();
  if (fly) { const L = Math.hypot(c.pos[0], c.pos[2]) || 1, dx = c.pos[0] / L, dz = c.pos[2] / L; flyTo([c.pos[0] + dx * 20, c.pos[1] + 11, c.pos[2] + dz * 20], [c.pos[0] * 0.55, c.pos[1] + 1, c.pos[2] * 0.55]); }
  setMode("concept"); if (location.hash !== "#c-" + id) history.replaceState(null, "", "#c-" + id);
  const path = learningPath(id), lives = Object.entries(LIVE).filter(([k, L]) => L.c.includes(id)).map(([k]) => k);
  const v = $("#conceptview");
  v.innerHTML = `<div><p class="eyebrow">Concept map · floor ${c.floor}: ${esc(FLOORS[c.floor])}</p><h2>${esc(c.name)}</h2><p class="easy"><span class="tag">Easy</span>${esc(c.easy)}</p></div>
    <div class="block"><h3>The equation, in words</h3><div class="eq">${esc(c.eq)}</div><p class="note" style="color:var(--ink)">${esc(c.words)}</p></div>
    ${lives.map(liveHTML).join("")}
    <div class="block"><h3>How it connects</h3><div class="links"><div><p class="eyebrow">Needs first</p>${c.pre.length ? c.pre.map(p => `<button type="button" class="chip ok" data-c="${p}">${esc(CI[p].name)}</button>`).join("") : `<span class="note">Nothing. It's ground floor.</span>`}</div><div><p class="eyebrow">Unlocks</p>${c.next.length ? c.next.map(p => `<button type="button" class="chip hot" data-c="${p}">${esc(CI[p].name)}</button>`).join("") : `<span class="note">Top of its branch.</span>`}</div></div></div>
    <div class="block"><h3>Where it is in the books</h3><div class="refs2">${c.refs.map(r => { const b = r[0], n = r.slice(1), x = TOC[b].find(y => y[0] === n); return `<button type="button" class="ref" data-b="${b}" data-n="${n}"><span class="spine s${b}"></span><b>${esc(BOOKN[b].split(" · ")[0])} §${n}</b><small>${esc(x ? x[1].replace(/\s*\*$/, "") : "")} · p. ${x ? x[2] : "?"}</small></button>`; }).join("")}</div>
    ${c.labs.length ? `<div class="btns">${c.labs.map(l => `<button type="button" class="btn primary" data-lab="${l}">Lab: ${esc(ST[l].tab)}</button>`).join("")}</div>` : ""}</div>
    ${path.length ? `<div class="block"><h3>Learning path to here (${path.length} steps)</h3><ol class="path">${path.map(p => `<li><button type="button" data-c="${p}">${esc(CI[p].name)}</button><small>floor ${CI[p].floor}</small></li>`).join("")}<li class="here"><b>${esc(c.name)}</b></li></ol></div>` : ""}
    <div class="block" id="c-ai"><h3>Still fuzzy?</h3></div><div class="block ask" id="c-ask"></div>`;
  v.querySelectorAll("[data-c]").forEach(b => b.onclick = () => goConcept(b.dataset.c));
  v.querySelectorAll(".ref").forEach(b => b.onclick = () => { const parts = b.dataset.n.split("."); goChapter(b.dataset.b + parts[0], parts.length > 1 ? b.dataset.n : null); });
  v.querySelectorAll("[data-lab]").forEach(b => b.onclick = () => { const home = labHome(b.dataset.lab); goChapter(home); startSim(b.dataset.lab); });
  bindLive(v);
  explainButton($("#c-ai"), "c-" + id, () => `${EASY_RULES}\n\nConcept: "${c.name}". The site's short version: ${c.easy} Equation: ${c.eq} (${c.words}). It builds on: ${c.pre.map(p => CI[p].name).join(", ") || "nothing"}. It leads to: ${c.next.map(p => CI[p].name).join(", ") || "nothing"}. Book sections: ${c.refs.join(", ")} (M = Murphy PML 1, D = Dive into Deep Learning, A = Murphy PML 2).`);
  afterConcept(c, v, fly);
  makeAsk($("#c-ask"), () => `Concept "${c.name}" (floor ${c.floor}, ${FLOORS[c.floor]}). Short version: ${c.easy} Equation: ${c.eq}. Prerequisites: ${c.pre.map(p => CI[p].name).join(", ")}. Book sections: ${c.refs.join(", ")}.`, [`Why does ${c.name} exist? What problem forced it?`, "Walk me through the equation with small numbers", "How does this connect to what I already know?"]);
  $("#panel").scrollTop = 0;
}
let mode = "course";
function setMode(m) { mode = m; $$(".modesw button").forEach(b => b.setAttribute("aria-pressed", b.dataset.m === m)); $("#crumb").hidden = m !== "course"; $("#prev-ch").hidden = m !== "course"; $("#next-ch").hidden = m !== "course"; }
