// Vercel serverless function: the only place the OpenCode key exists.
// The browser sends {messages}; this tries free models first, then the cheap paid one.
const GO = "https://opencode.ai/inference/go/openai/v1/chat/completions";
const ZEN = "https://opencode.ai/zen/v1/chat/completions";

// Order matters: free first. Override with OPENCODE_MODELS="model1,model2,...". Prefix "zen:" for the Zen endpoint.
const DEFAULT_MODELS = "beam-free,iceman-contributor-free,zen:deepseek-v4-flash-free,deepseek-v4.1-flash";

const SYSTEM = `You are the tutor inside "Neuron Voxel Lab", a site that teaches machine learning from first principles through Kevin Murphy's "Probabilistic Machine Learning" (both volumes) and "Dive into Deep Learning". The learner keeps only what he has verified the logic of and rejects unexplained abstraction. Always: start from a concrete picture or tiny numeric example; explain every symbol the first time it appears; say what an equation computes and why it has that shape; connect to what came before. Plain text, short paragraphs, math in plain characters (x², Σ, √, ·, ∂), no LaTeX. Small NumPy snippets in fenced code when useful.`;

const MAX_CHARS = 30000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  const key = process.env.OPENCODE_API_KEY;
  if (!key) return res.status(500).json({ error: "The server has no OPENCODE_API_KEY. Add it in Vercel → Settings → Environment Variables." });
  const code = process.env.ACCESS_CODE;
  if (code && req.headers["x-access-code"] !== code) return res.status(401).json({ error: "Access code needed." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const messages = body && Array.isArray(body.messages) ? body.messages : null;
  if (!messages || !messages.length || messages.length > 24) return res.status(400).json({ error: "Send {messages: [...]} with 1–24 turns." });
  const clean = [];
  let total = 0;
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return res.status(400).json({ error: "Each message needs role user|assistant and string content." });
    total += m.content.length; clean.push({ role: m.role, content: m.content });
  }
  if (total > MAX_CHARS) return res.status(413).json({ error: "Question too long. Ask about one part at a time." });

  const models = (process.env.OPENCODE_MODELS || DEFAULT_MODELS).split(",").map(s => s.trim()).filter(Boolean);
  const tried = [];
  for (const entry of models) {
    const zen = entry.startsWith("zen:"), model = zen ? entry.slice(4) : entry;
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 45000);
    try {
      const r = await fetch(zen ? ZEN : GO, {
        method: "POST", signal: ctl.signal,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`, "x-opencode-session": String(req.headers["x-session"] || "nvl") },
        body: JSON.stringify({ model, messages: [{ role: "system", content: SYSTEM }, ...clean], max_tokens: 1400, temperature: 0.4 })
      });
      if (!r.ok) { tried.push(`${entry}: HTTP ${r.status}`); continue; }
      const j = await r.json();
      const text = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (text && text.trim()) return res.status(200).json({ text, model });
      tried.push(`${entry}: empty answer`);
    } catch (e) {
      tried.push(`${entry}: ${e.name === "AbortError" ? "timed out" : "network error"}`);
    } finally { clearTimeout(timer); }
  }
  return res.status(502).json({ error: "Every model failed. Try again in a minute.", tried });
}
