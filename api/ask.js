// Vercel serverless function: the only place the OpenCode key exists.
// POST {messages} → asks DeepSeek V4.1 Flash on OpenCode Zen (or the models in OPENCODE_MODELS, in order).
// GET /api/ask?diag=1 → checks every endpoint/model and reports what OpenCode answered (never the key).

// OpenCode documents two URL shapes for Go models; we try both and remember which one works.
const GO_ENDPOINTS = [
  "https://opencode.ai/zen/go/v1/chat/completions",
  "https://opencode.ai/inference/go/openai/v1/chat/completions"
];
// Zen (pay-as-you-go credits). Current documented URL first, the older one as a fallback.
const ZEN_ENDPOINTS = [
  "https://opencode.ai/inference/openai/v1/chat/completions",
  "https://opencode.ai/zen/v1/chat/completions"
];

// Default: DeepSeek V4.1 Flash on OpenCode Zen (billed from Zen credits, $0.30 / $1.20 per 1M tokens in/out).
// Override with OPENCODE_MODELS="m1,m2,..." (comma-separated fallbacks). "zen:" = Zen credits; no prefix = Go subscription.
const DEFAULT_MODELS = "zen:deepseek-v4.1-flash";

const SYSTEM = `You are the tutor inside "Neuron Voxel Lab", a site that teaches machine learning from first principles through Kevin Murphy's "Probabilistic Machine Learning" (both volumes) and "Dive into Deep Learning". The learner keeps only what he has verified the logic of and rejects unexplained abstraction. Always: start from a concrete picture or tiny numeric example; explain every symbol the first time it appears; say what an equation computes and why it has that shape; connect to what came before. Plain text, short paragraphs, math in plain characters (x², Σ, √, ·, ∂), no LaTeX. Small NumPy snippets in fenced code when useful.`;

const MAX_CHARS = 30000;
const MAX_TOKENS = 2400;   // room for a full derivation plus a code snippet
const MAX_CONTINUE = 2;    // extra "keep going" calls when an answer is cut off at MAX_TOKENS
const CONTINUE = "You were cut off. Continue exactly where you stopped: no recap, no greeting, do not repeat any text. If you were inside a code block, keep writing the code (do not open a new fence).";
// Glue a continuation onto the first part: drop a repeated overlap and re-open nothing.
function joinParts(a, b) {
  b = b.replace(/^\s*(continuing|continued|…|\.\.\.)[:.]?\s*/i, "");
  for (let k = Math.min(120, a.length, b.length); k >= 12; k--) if (a.endsWith(b.slice(0, k))) return a + b.slice(k);
  // Cut mid-word and the model restarted the word ("probab" + "probability"): keep the whole word once.
  const tail = /(\w+)$/.exec(a), head = /^(\w+)/.exec(b);
  if (tail && head && head[1].length > tail[1].length && head[1].startsWith(tail[1])) return a.slice(0, -tail[1].length) + b;
  const midWord = /\w$/.test(a) && /^\w/.test(b);
  return a + (midWord || /^\s/.test(b) || /\s$/.test(a) ? "" : (/^[,.;:!?)\]]/.test(b) ? "" : " ")) + b;
}
let workingEndpoint = {}; // model -> endpoint that answered last time (survives while the function is warm)

// Best-effort rate limit per IP, per warm instance: protects the key's budget from a runaway tab or a scraper.
// It is not a global guarantee (instances don't share memory); set ACCESS_CODE for a hard gate.
const PER_MIN = Math.max(1, +process.env.RATE_LIMIT_PER_MIN || 12);
const PER_DAY = Math.max(PER_MIN, +process.env.RATE_LIMIT_PER_DAY || 300);
const hits = new Map(); // ip -> array of timestamps (ms)
function rateLimited(ip) {
  const now = Date.now(), day = 86400000;
  const list = (hits.get(ip) || []).filter(t => now - t < day);
  const lastMin = list.filter(t => now - t < 60000).length;
  if (lastMin >= PER_MIN) return Math.ceil((60000 - (now - list.filter(t => now - t < 60000)[0])) / 1000);
  if (list.length >= PER_DAY) return Math.ceil((day - (now - list[0])) / 1000);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > day) hits.delete(k);
  return 0;
}
function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
}

function models() {
  return (process.env.OPENCODE_MODELS || DEFAULT_MODELS).split(",").map(s => s.trim()).filter(Boolean);
}

// Some reasoning models leak a <think>…</think> preamble into content; the learner should only see the answer.
function cleanText(t) {
  if (typeof t !== "string") return t;
  return t.replace(/<think>[\s\S]*?<\/think>\s*/gi, "").replace(/^\s*<think>[\s\S]*$/i, "");
}

async function callOnce(endpoint, model, key, messages, maxTokens, ms, session) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(endpoint, {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`, "x-opencode-session": session },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.4 })
    });
    const raw = await r.text();
    let j = null; try { j = JSON.parse(raw); } catch {}
    const choice = j && j.choices && j.choices[0];
    const text = cleanText(choice && choice.message && choice.message.content);
    // finish_reason "length" means the model hit max_tokens mid-answer; the caller asks it to continue.
    if (r.ok && text && text.trim()) return { ok: true, text, finish: choice.finish_reason || "stop" };
    const msg = (j && (j.error?.message || j.error || j.message)) || raw.slice(0, 160);
    return { ok: false, status: r.status, detail: typeof msg === "string" ? msg.slice(0, 200) : JSON.stringify(msg).slice(0, 200) };
  } catch (e) {
    return { ok: false, status: 0, detail: e.name === "AbortError" ? "timed out" : "network error: " + e.message };
  } finally { clearTimeout(timer); }
}

async function tryModel(entry, key, messages, maxTokens, ms, log, session) {
  const zen = entry.startsWith("zen:"), model = zen ? entry.slice(4) : entry;
  const list = zen ? ZEN_ENDPOINTS : GO_ENDPOINTS;
  const order = workingEndpoint[entry] ? [workingEndpoint[entry], ...list.filter(e => e !== workingEndpoint[entry])] : list;
  for (const ep of order) {
    const r = await callOnce(ep, model, key, messages, maxTokens, ms, session);
    log.push({ model: entry, endpoint: ep.replace("https://opencode.ai", ""), status: r.ok ? 200 : r.status, detail: r.ok ? "ok" : r.detail });
    if (r.ok) { workingEndpoint[entry] = ep; return { text: r.text, model, finish: r.finish, endpoint: ep }; }
    if (r.status === 401 || r.status === 403) break; // auth problems won't be fixed by another URL shape
  }
  return null;
}

export default async function handler(req, res) {
  const key = process.env.OPENCODE_API_KEY;
  const code = process.env.ACCESS_CODE;

  if (req.method === "GET") {
    if (!("diag" in (req.query || {}))) return res.status(405).json({ error: "Use POST. For a health check open /api/ask?diag=1" + (code ? "&code=YOUR_ACCESS_CODE" : "") });
    if (code && req.query.code !== code) return res.status(401).json({ error: "Add &code=YOUR_ACCESS_CODE" });
    const report = { keySet: !!key, keyPrefix: key ? key.slice(0, 6) + "…" : null, models: models(), checks: [] };
    if (!key) return res.status(200).json(report);
    for (const entry of models()) await tryModel(entry, key, [{ role: "user", content: "Reply with the single word: ok" }], 5, 15000, report.checks, "nvl-diag-" + Date.now());
    report.working = report.checks.filter(c => c.status === 200).map(c => c.model + " via " + c.endpoint);
    return res.status(200).json(report);
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  if (!key) return res.status(500).json({ error: "The server has no OPENCODE_API_KEY. Add it in Vercel → Settings → Environment Variables, then redeploy." });
  if (code && req.headers["x-access-code"] !== code) return res.status(401).json({ error: "Access code needed." });
  const wait = rateLimited(clientIp(req));
  if (wait) { res.setHeader("Retry-After", String(wait)); return res.status(429).json({ error: `Too many questions in a short time. Try again in ${wait < 120 ? wait + " s" : Math.ceil(wait / 60) + " min"}.` }); }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const messages = body && Array.isArray(body.messages) ? body.messages : null;
  if (!messages || !messages.length || messages.length > 24) return res.status(400).json({ error: "Send {messages: [...]} with 1–24 turns." });
  const clean = []; let total = 0;
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return res.status(400).json({ error: "Each message needs role user|assistant and string content." });
    total += m.content.length; clean.push({ role: m.role, content: m.content });
  }
  if (total > MAX_CHARS) return res.status(413).json({ error: "Question too long. Ask about one part at a time." });

  // OpenCode routes by session: one stable id per learner conversation (sent by the page), else a fresh one.
  const raw = String(req.headers["x-session"] || "");
  const session = /^[\w-]{8,64}$/.test(raw) ? raw : "nvl-" + Math.random().toString(36).slice(2, 12);
  const log = [], started = Date.now();
  for (const entry of models()) {
    const left = 55000 - (Date.now() - started); if (left < 4000) break;
    const base = [{ role: "system", content: SYSTEM }, ...clean];
    const r = await tryModel(entry, key, base, MAX_TOKENS, Math.min(40000, left - 2000), log, session);
    if (!r) continue;
    // The model ran out of room mid-answer: ask it to carry on from the exact cut, up to MAX_CONTINUE times.
    let text = r.text, finish = r.finish, parts = 1;
    while (finish === "length" && parts <= MAX_CONTINUE) {
      const rest = 55000 - (Date.now() - started); if (rest < 8000) break;
      const more = await callOnce(r.endpoint, r.model, key, [...base, { role: "assistant", content: text }, { role: "user", content: CONTINUE }], MAX_TOKENS, Math.min(30000, rest - 2000), session);
      if (!more.ok) break;
      text = joinParts(text, more.text); finish = more.finish; parts++;
    }
    return res.status(200).json({ text, model: r.model, truncated: finish === "length", parts });
  }
  return res.status(502).json({ error: "Every model failed: " + log.map(l => `${l.model} ${l.endpoint} → ${l.status} ${l.detail}`).join(" | "), tried: log });
}
