# Neuron Voxel Lab

An interactive course through three books, built from the ground floor:

- Kevin Murphy, *Probabilistic Machine Learning: An Introduction* (Murphy 1)
- Zhang, Lipton, Li, Smola, *Dive into Deep Learning* (D2L)
- Kevin Murphy, *Probabilistic Machine Learning: Advanced Topics* (Murphy 2)

What's inside:

- **Course**: every chapter, section and subsection of all three books (2,660 entries) with page numbers. Murphy 1 ch. 1–8 have hand-written easy + precise explanations; every section has an "Explain this simply (AI)" button and an ask box.
- **Concept map**: 131 concepts on 11 floors (ground-floor maths → diffusion, transformers, RL), each linked to its prerequisites, what it unlocks, and its sections in all three books, with a learning path.
- **Labs**: 22 voxel simulations (three.js), from Bayes' rule on 2,000 people to a face autoencoder.
- **Live equations**: 16 equations with sliders that compute every term.
- **Symbols decoder**: the 54 symbols the books are written in.
- **Colab notebook**: `notebooks/Neuron_Voxel_Lab_Autoencoders.ipynb` (NumPy from scratch → CelebA conv autoencoder on an L4).

## Deploy on Vercel

1. Push this folder to GitHub, then import it at vercel.com/new. No framework or build command needed; `index.html` is static and `api/ask.js` becomes a serverless function.
2. In **Settings → Environment Variables**, add:
   - `OPENCODE_API_KEY`: your OpenCode key (never put it in the HTML).
   - `ACCESS_CODE` (recommended for a public site): a passphrase visitors type once before asking, so strangers can't spend your budget.
   - `OPENCODE_MODELS` (optional): model order. Default: `beam-free,iceman-contributor-free,zen:deepseek-v4-flash-free,deepseek-v4.1-flash` (free first; `deepseek-v4.1-flash` only if every free one fails).
3. Redeploy. The ask boxes and "Explain" buttons now work.

Notes: DeepSeek V4.1 Flash needs **Global** selected under Regions in your OpenCode Settings › Privacy. Models named `*-contributor-*` may use your requests for training.

## Local development

```bash
cp .env.example .env.local   # then put your key in it
npx vercel dev               # serves index.html + /api/ask on localhost:3000
```

## Editing

Edit the parts in `src/`, then run `npm run build:site` to regenerate `index.html`.

| File | What it holds |
|---|---|
| `src/p1.html` | Layout, design tokens, station panels |
| `src/p2.js` | Voxel engine, tiny neural-net library, stations 1–10 |
| `src/p4.js` | Lab framework and the Murphy ch. 1–8 labs |
| `src/p5easy.js`, `src/p5.js` | Easy layer, chapter intros, section explanations, chapter pages |
| `src/p6a.js` | Concept map data and symbols |
| `src/p6b.js` | Live equations, AI client, library, concept tower |
| `src/p3.js` | Station content, ask box, app shell |
| `src/toc.json` | Every section of all three books |
| `api/ask.js` | Server: OpenCode fallback chain (holds the key) |
