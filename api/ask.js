// Vercel serverless function: the only place the OpenCode key exists.
// POST {messages} → tries free models first, then the cheap paid one.
// GET /api/ask?diag=1 → checks every endpoint/model and reports what OpenCode answered (never the key).

// OpenCode documents two URL shapes for Go models; we try both and remember which one works.
const GO_ENDPOINTS = [
  "https://opencode.ai/zen/go/v1/chat/completions",
  "https://opencode.ai/inference/go/openai/v1/chat/completions"
];
const ZEN_ENDPOINTS = ["https://opencode.ai/zen/v1/chat/completions"];

// Default: DeepSeek V4.1 Flash on OpenCode Go (cheap and reliable). Override with OPENCODE_MODELS="m1,m2,..." (comma-separated
// fallbacks; prefix "zen:" for the Zen endpoint).
const DEFAULT_MODELS = "deepseek-v4.1-flash";

const SYSTEM = `You are the tutor inside "Neuron Voxel Lab", a site that teaches machine learning from first principles through Kevin Murphy's "Probabilistic Machine Learning" (both volumes) and "Dive into Deep Learning". The learner keeps only what he has verified the logic of and rejects unexplained abstraction. Always: start from a concrete picture or tiny numeric example; explain every symbol the first time it appears; say what an equation computes and why it has that shape; connect to what came before. Plain text, short paragraphs, math in plain characters (x², Σ, √, ·, ∂), no LaTeX. Small NumPy snippets in fenced code when useful.`;

const MAX_CHARS = 30000;
let workingEndpoint = {}; // model -> endpoint that answered last time (survives while the function is warm)

function models() {
  return (process.env.OPENCODE_MODELS || DEFAULT_MODELS).split(",").map(s => s.trim()).filter(Boolean);
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
    const text = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (r.ok && text && text.trim()) return { ok: true, text };
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
    if (r.ok) { workingEndpoint[entry] = ep; return { text: r.text, model }; }
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

  // OpenCode Go routes by session: one stable id per learner conversation (sent by the page), else a fresh one.
  const raw = String(req.headers["x-session"] || "");
  const session = /^[\w-]{8,64}$/.test(raw) ? raw : "nvl-" + Math.random().toString(36).slice(2, 12);
  const log = [], started = Date.now();
  for (const entry of models()) {
    const left = 55000 - (Date.now() - started); if (left < 4000) break;
    const r = await tryModel(entry, key, [{ role: "system", content: SYSTEM }, ...clean], 1400, Math.min(40000, left - 2000), log, session);
    if (r) return res.status(200).json(r);
  }
  return res.status(502).json({ error: "Every model failed: " + log.map(l => `${l.model} ${l.endpoint} → ${l.status} ${l.detail}`).join(" | "), tried: log });
}
