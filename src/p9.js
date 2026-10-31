/* ================= learning paths: several ordered routes through stations, labs, sections, exercises and projects ================= */
// Step = [type, ref, label, why]. Types: st (station), lab ("M2/m2bayes"), c (concept), sec ("M10.2"), ch ("D5"), ex ("13.1"), pj ("p3"), nb (notebook file)
const PATHS = [
  { id: "nn", color: "c1", title: "Neural networks by building", tag: "Start here if you want deep learning", level: "Beginner", time: "≈ 25 hours",
    who: "You can write a Python loop. No maths beyond school algebra assumed: each idea is introduced the moment you need it.",
    outcome: "You'll have written a neural network, backprop, a CNN and an autoencoder from scratch, and know why each piece exists.",
    stages: [
      ["One neuron", [
        ["st", "s1", "Station 1 · a single neuron", "A weighted vote plus a squash: the atom everything else is made of."],
        ["c", "sigm", "Concept · the sigmoid", "Why that exact S-curve, and what its slope is."],
        ["sec", "M10.2", "Murphy §10.2 · one neuron is logistic regression", "The same thing in the book's language."],
        ["ex", "10.1", "Exercise · logistic regression from scratch", "Write the neuron and train it yourself."]]],
      ["Learning = going downhill", [
        ["st", "s2", "Station 2 · measuring wrongness", "A loss turns 'how wrong' into one number to minimise."],
        ["c", "nll", "Concept · loss = negative log-likelihood", "Where cross-entropy comes from."],
        ["st", "s3", "Station 3 · gradient descent", "Feel the slope and step down it."],
        ["lab", "M8/m8opt", "Lab · optimisers on a hard surface", "See why plain gradient descent zig-zags and momentum and Adam don't."],
        ["ex", "8.1", "Exercise · when gradient descent blows up", "Find the learning rate that breaks it."]]],
      ["Many neurons, and how they learn", [
        ["st", "s5", "Station 5 · hidden layers", "Stack neurons and they can bend the boundary."],
        ["ex", "13.1", "Exercise · solve XOR with a 2-2-1 network", "The smallest problem one neuron can't do."],
        ["st", "s4", "Station 4 · backpropagation", "One backward pass gives every weight its share of the blame."],
        ["c", "chain", "Concept · the chain rule", "The only calculus backprop needs."],
        ["ex", "13.4", "Exercise · backprop in matrices", "Derive it once by hand, then never fear it."],
        ["pj", "p3", "Project · a neural network from scratch", "Beat the linear model on real digits, with gradient checks and regularisation."]]],
      ["Making deep nets train", [
        ["sec", "M13.4", "Murphy §13.4 · vanishing gradients, init, ReLU, skips", "Why depth used to fail, and the four fixes."],
        ["ex", "13.2", "Exercise · vanishing gradients, measured", "Watch the gradient die in a sigmoid stack."],
        ["ex", "13.3", "Exercise · why dropout divides by (1 − p)", "Regularisation without changing the average."],
        ["ex", "14.3", "Exercise · residual connections, measured", "The identity path that lets nets go 100+ layers deep."]]],
      ["Images", [
        ["st", "s6", "Station 6 · pixels as numbers", "An image is a grid of inputs."],
        ["st", "s9", "Station 9 · convolution", "One small filter, slid everywhere."],
        ["ex", "14.1", "Exercise · convolution and pooling from scratch", "Write the two core image layers."],
        ["pj", "p7", "Project · a CNN from scratch", "im2col, max-pool backward, gradient check, and a 1-pixel-shift test."]]],
      ["Compress and generate", [
        ["st", "s7", "Station 7 · the autoencoder", "Squeeze a face through a bottleneck and rebuild it."],
        ["st", "s8", "Station 8 · the latent map", "What the bottleneck learned to represent."],
        ["st", "s10", "Station 10 · on the GPU", "The same maths at real scale."],
        ["nb", "Neuron_Voxel_Lab_Autoencoders.ipynb", "Colab · NumPy autoencoder → CelebA conv autoencoder", "Train a real one on a GPU."]]],
      ["Where to go next", [
        ["ch", "D5", "D2L ch. 5 · multilayer perceptrons in PyTorch", "Everything above, now with autograd."],
        ["c", "attention", "Concept · attention", "The idea behind transformers."],
        ["c", "vae", "Concept · variational autoencoder", "Autoencoders that can generate."]]]
    ] },
  { id: "stats", color: "c2", title: "Statistics and probability for ML", tag: "The reasoning under every model", level: "Beginner", time: "≈ 20 hours",
    who: "You want to know when a result is real, what a probability means, and how to decide under uncertainty.",
    outcome: "You'll run an A/B test six ways, build and calibrate a medical classifier, and know exactly what p-values and posteriors do and don't say.",
    stages: [
      ["Probability, by counting", [
        ["c", "prob", "Concept · probability", "Fractions of a crowd."],
        ["c", "condp", "Concept · conditional probability", "Shrink the crowd to what you know."],
        ["lab", "M2/m2bayes", "Lab · Bayes' rule on 2,000 people", "Why a 99%-accurate test can still mostly be wrong."],
        ["ex", "2.1", "Exercise · the COVID test by hand", "Bayes with real numbers."],
        ["lab", "M2/m2monty", "Lab · Monty Hall", "Intuition vs counting."],
        ["ex", "2.2", "Exercise · prove Monty Hall by simulation", "When in doubt, simulate."]]],
      ["Distributions and averages", [
        ["lab", "M2/m2dist", "Lab · the common distributions", "Bernoulli, binomial, Poisson, Gaussian: what each one models."],
        ["lab", "M2/m2clt", "Lab · the central limit theorem", "Why averages are Gaussian (and error bars work)."],
        ["ex", "2.4", "Exercise · measure the CLT", "See it converge."],
        ["lab", "M3/m3gauss", "Lab · the 2-D Gaussian", "Covariance as a tilted ellipse."],
        ["ex", "3.4", "Exercise · Simpson's paradox in one table", "How aggregation lies."]]],
      ["Learning from data", [
        ["c", "likelihood", "Concept · likelihood", "How well do these knobs explain the data?"],
        ["lab", "M4/m4coin", "Lab · MLE and the Bayesian coin", "Point estimate vs a whole posterior."],
        ["ex", "4.1", "Exercise · the coin's MLE from scratch", "Derive it."],
        ["ex", "4.2", "Exercise · the MLE of variance is biased", "And why it divides by n."],
        ["ex", "4.3", "Exercise · Beta-binomial updating", "Watch a posterior sharpen."],
        ["lab", "M4/m4boot", "Lab · the bootstrap", "Error bars without formulas."],
        ["ex", "4.4", "Exercise · bootstrap a confidence interval", "Resample yourself."]]],
      ["Testing and deciding", [
        ["c", "hyptest", "Concept · hypothesis tests and p-values", "What a p-value is, precisely."],
        ["ex", "5.4", "Exercise · what a p-value is not", "The four classic misreadings."],
        ["pj", "p4", "Project · A/B testing from first principles", "CLT, bootstrap, permutation test, Bayesian posterior, power, peeking."],
        ["c", "decision", "Concept · decision theory", "Probabilities plus costs give actions."],
        ["lab", "M5/m5roc", "Lab · ROC curves", "Every threshold at once."],
        ["ex", "5.2", "Exercise · the cost-optimal threshold", "Derive p > c_FP / (c_FP + c_FN)."]]],
      ["Models as statistics", [
        ["lab", "M6/m6info", "Lab · entropy, cross-entropy, KL", "Information as surprise."],
        ["lab", "M9/m9gda", "Lab · Gaussian classifiers", "Model each class, flip with Bayes."],
        ["pj", "p5", "Project · diagnose from measurements", "Naive Bayes vs LDA vs logistic: AUC, calibration, costs, learning curves."],
        ["ex", "12.1", "Exercise · Poisson regression for counts", "The GLM pattern."],
        ["c", "calib", "Concept · evaluating predictions", "Calibration and conformal prediction."]]]
    ] },
  { id: "classic", color: "c3", title: "Classical machine learning toolkit", tag: "The models that still win on tables", level: "Intermediate", time: "≈ 20 hours",
    who: "You know what a gradient is (or did the first two stages of the neural-net path) and want the standard toolkit.",
    outcome: "Regression, classification, regularisation, clustering and evaluation, each written from scratch at least once.",
    stages: [
      ["Fit, then doubt", [
        ["lab", "M1/m1fit", "Lab · overfitting", "Training error lies; test error tells the truth."],
        ["ex", "1.2", "Exercise · draw the overfitting curve", "The U-shape, from your own code."],
        ["ex", "5.3", "Exercise · cross-validation from scratch", "Honest error estimates with little data."]]],
      ["Regression", [
        ["sec", "M11.2", "Murphy §11.2 · least squares", "The exact bottom of the bowl."],
        ["ex", "7.4", "Exercise · three ways to solve least squares", "Normal equations, QR, SVD."],
        ["lab", "M11/m11l1", "Lab · ridge vs lasso geometry", "Why ℓ₁ gives exact zeros."],
        ["ex", "11.1", "Exercise · lasso by coordinate descent", "Soft-thresholding in a loop."],
        ["ex", "11.3", "Exercise · outliers: squared error vs Huber", "Robustness in one line."],
        ["pj", "p1", "Project · regression on real medical data", "Closed form, GD, ridge + CV, bootstrap."]]],
      ["Classification", [
        ["ex", "10.1", "Exercise · logistic regression from scratch", "The workhorse classifier."],
        ["ex", "10.4", "Exercise · Newton (IRLS) vs gradient descent", "Curvature buys speed."],
        ["ex", "9.1", "Exercise · naive Bayes spam filter", "Counting as learning."],
        ["ex", "9.3", "Exercise · Gaussian classifier on flowers", "LDA vs nearest centroid."],
        ["pj", "p5", "Project · generative vs discriminative", "Three classifiers, compared properly."]]],
      ["Structure without labels", [
        ["lab", "M7/m7mat", "Lab · matrices as transformations, SVD", "Every matrix is rotate–stretch–rotate."],
        ["ex", "7.2", "Exercise · compress an image with SVD", "Low rank, visibly."],
        ["pj", "p2", "Project · digits: PCA, softmax, optimisers", "Dimensionality reduction meets classification."],
        ["lab", "M21/m21km", "Lab · k-means and the elbow", "Clustering you can watch."],
        ["ex", "8.4", "Exercise · EM for a two-bump mixture", "Soft clustering by alternating guesses."],
        ["pj", "p6", "Project · k-means, Gaussian mixtures and EM", "Rediscover iris species; choose K with BIC."]]],
      ["Beyond", [
        ["c", "kernel", "Concept · kernels", "Linear models in curved feature spaces."],
        ["c", "trees", "Concept · decision trees", "Questions as a model."],
        ["c", "ensemble", "Concept · bagging, forests, boosting", "Many weak models, one strong one."]]]
    ] },
  { id: "math", color: "c4", title: "The maths underneath, in the order you need it", tag: "Fill gaps on demand", level: "Foundations", time: "≈ 12 hours",
    who: "Equations make your eyes glaze over. Do this first, or dip in whenever another path names a concept you haven't met.",
    outcome: "Σ, derivatives, gradients, vectors, matrices, SVD and optimisation, each tied to a picture and a line of NumPy.",
    stages: [
      ["Reading the notation", [
        ["c", "func", "Concept · function", "A model is a function with knobs."],
        ["c", "sum", "Concept · Σ is a for-loop", "Most scary equations are this."],
        ["c", "explog", "Concept · exp and log", "Turn products into sums."]]],
      ["Change and slopes", [
        ["c", "deriv", "Concept · derivative", "Slope at a point."],
        ["c", "chain", "Concept · chain rule", "Slopes multiply through a pipeline."],
        ["c", "grad", "Concept · gradient", "The uphill direction in many dimensions."],
        ["ex", "7.3", "Exercise · gradient of the squared error", "The derivation behind every regression."]]],
      ["Vectors and matrices", [
        ["c", "dot", "Concept · dot product", "A weighted vote, and an angle."],
        ["c", "matrix", "Concept · matrix multiply", "Many dot products at once."],
        ["lab", "M7/m7mat", "Lab · matrices as transformations", "See a matrix act on the plane."],
        ["ex", "7.1", "Exercise · power iteration", "Find the top eigenvector by repetition."],
        ["c", "svd", "Concept · SVD", "The most useful decomposition in ML."]]],
      ["Optimisation", [
        ["c", "gd", "Concept · gradient descent", "Step against the gradient."],
        ["lab", "M8/m8opt", "Lab · optimisers on a hard surface", "GD, momentum, Adam side by side."],
        ["ex", "8.2", "Exercise · momentum and Adam on the banana", "Implement both."],
        ["ex", "8.5", "Exercise · Newton's method by hand", "Use curvature."],
        ["c", "convex", "Concept · convexity", "When downhill always finds the bottom."]]]
    ] },
  { id: "d2l", color: "c5", title: "Deep learning in practice with D2L (PyTorch)", tag: "After the neural-net path", level: "Intermediate → advanced", time: "≈ 40 hours",
    who: "You've built a network from scratch and want to train real models with PyTorch on a GPU.",
    outcome: "Modern CNNs, sequence models, transformers and the engineering that makes them train.",
    stages: [
      ["PyTorch foundations", [
        ["ch", "D2", "D2L ch. 2 · preliminaries (tensors, autograd)", "NumPy, plus automatic gradients."],
        ["ch", "D3", "D2L ch. 3 · linear regression, the PyTorch way", "Modules, losses, data loaders."],
        ["ch", "D4", "D2L ch. 4 · softmax classification", "Your first real classifier."],
        ["ch", "D5", "D2L ch. 5 · MLPs", "Hidden layers, dropout, numerical stability."],
        ["ch", "D6", "D2L ch. 6 · builder's guide", "Parameters, custom layers, saving, GPUs."]]],
      ["Vision", [
        ["ch", "D7", "D2L ch. 7 · CNNs", "Convolution in PyTorch."],
        ["ch", "D8", "D2L ch. 8 · modern CNNs", "AlexNet → ResNet → beyond."],
        ["ch", "D14", "D2L ch. 14 · computer vision", "Augmentation, fine-tuning, detection, segmentation."]]],
      ["Sequences and attention", [
        ["ch", "D9", "D2L ch. 9 · RNNs", "Memory through recurrence."],
        ["ch", "D10", "D2L ch. 10 · modern RNNs", "LSTM, GRU, seq2seq."],
        ["ch", "D11", "D2L ch. 11 · attention and transformers", "The architecture behind LLMs."],
        ["ch", "D15", "D2L ch. 15 · NLP pretraining", "word2vec to BERT."]]],
      ["Training well", [
        ["ch", "D12", "D2L ch. 12 · optimisation algorithms", "SGD, momentum, Adam, schedules."],
        ["ch", "D13", "D2L ch. 13 · computational performance", "Speed, multiple GPUs."],
        ["ch", "D19", "D2L ch. 19 · hyperparameter optimisation", "Search instead of guess."]]]
    ] },
  { id: "gen", color: "c1", title: "Probabilistic and generative models (Murphy 2)", tag: "Research-level, after stats + neural nets", level: "Advanced", time: "≈ 60 hours",
    who: "You've done the statistics path and the neural-net path, and want the modern probabilistic view.",
    outcome: "Inference (variational, Monte Carlo), Bayesian deep learning, and every major family of generative model.",
    stages: [
      ["Inference", [
        ["ch", "A4", "Murphy 2 ch. 4 · graphical models", "Structure as a picture."],
        ["ch", "A7", "Murphy 2 ch. 7 · inference algorithms overview", "The map of methods."],
        ["ch", "A10", "Murphy 2 ch. 10 · variational inference", "Inference as optimisation."],
        ["ch", "A11", "Murphy 2 ch. 11 · Monte Carlo", "Inference by sampling."],
        ["ch", "A12", "Murphy 2 ch. 12 · MCMC", "Random walks that find the posterior."]]],
      ["Bayesian prediction", [
        ["ch", "A17", "Murphy 2 ch. 17 · Bayesian neural networks", "Uncertainty for deep nets."],
        ["ch", "A18", "Murphy 2 ch. 18 · Gaussian processes", "Distributions over functions."]]],
      ["Generative models", [
        ["ch", "A20", "Murphy 2 ch. 20 · generative models overview", "What 'generate' means."],
        ["ch", "A21", "Murphy 2 ch. 21 · VAEs", "Autoencoders with a probabilistic latent."],
        ["ch", "A22", "Murphy 2 ch. 22 · autoregressive models", "One token at a time."],
        ["ch", "A23", "Murphy 2 ch. 23 · normalizing flows", "Invertible transforms of noise."],
        ["ch", "A25", "Murphy 2 ch. 25 · diffusion models", "Learn to undo noise."],
        ["ch", "A26", "Murphy 2 ch. 26 · GANs", "Generator vs critic."]]],
      ["Acting and explaining", [
        ["ch", "A34", "Murphy 2 ch. 34 · decision making under uncertainty", "Bandits and beyond."],
        ["ch", "A35", "Murphy 2 ch. 35 · reinforcement learning", "Learning from reward."],
        ["ch", "A36", "Murphy 2 ch. 36 · causality", "From correlation to intervention."]]]
    ] }
];
// How the paths connect: where to start, and where each leads.
const PATH_MAP = [["math"], ["nn", "stats", "classic"], ["d2l", "gen"]];
const PATH_AFTER = { nn: ["d2l", "gen"], stats: ["gen", "classic"], classic: ["nn", "gen"], math: ["nn", "stats", "classic"], d2l: ["gen"], gen: [] };
const TYPE_LABEL = { st: "Station", lab: "Lab", c: "Concept", sec: "Read", ch: "Chapter", ex: "Exercise", pj: "Project", nb: "Colab" };
let PATHDONE = PROG.load("nvl-pathdone");
{ const save0 = PROG.save; PROG.save = (k, s) => { save0(k, s); setTimeout(() => typeof updatePathPill === "function" && updatePathPill()); }; }
function stepTitle(s) { const t = s[2].replace(/^(Station \d+|Lab|Concept|Exercise|Project|Colab) · /, ""); return t[0].toUpperCase() + t.slice(1); }
function stepKey(s) { return s[0] + ":" + s[1]; }
function stepDone(s) {
  if (s[0] === "c") return DONE.has(s[1]);
  if (s[0] === "ex") return EXDONE.has(s[1]);
  if (s[0] === "pj") { const p = PRACTICE.projects.find(x => x.id === s[1]); return !!p && p.steps.every((_, i) => EXDONE.has(p.id + "." + (i + 1))); }
  return PATHDONE.has(stepKey(s));
}
function toggleStep(s) {
  if (s[0] === "c") { DONE.has(s[1]) ? DONE.delete(s[1]) : DONE.add(s[1]); PROG.save("nvl-done", DONE); updateProgressBadge(); }
  else if (s[0] === "ex") { EXDONE.has(s[1]) ? EXDONE.delete(s[1]) : EXDONE.add(s[1]); PROG.save("nvl-exdone", EXDONE); }
  else if (s[0] === "pj") { const p = PRACTICE.projects.find(x => x.id === s[1]), all = stepDone(s); p.steps.forEach((_, i) => all ? EXDONE.delete(p.id + "." + (i + 1)) : EXDONE.add(p.id + "." + (i + 1))); PROG.save("nvl-exdone", EXDONE); }
  else { const k = stepKey(s); PATHDONE.has(k) ? PATHDONE.delete(k) : PATHDONE.add(k); PROG.save("nvl-pathdone", PATHDONE); }
  updatePathPill();
}
const pathSteps = P => P.stages.flatMap(([, st]) => st);
const pathProgress = P => { const s = pathSteps(P); return [s.filter(stepDone).length, s.length]; };
const nextStep = P => pathSteps(P).find(s => !stepDone(s));
let activePath = null; try { activePath = localStorage.getItem("nvl-path"); } catch (e) { }
function setActivePath(id) { activePath = id; try { id ? localStorage.setItem("nvl-path", id) : localStorage.removeItem("nvl-path"); } catch (e) { } updatePathPill(); }

function goStep(s) {
  $$(".drawer").forEach(d => d.hidden = true);
  const [t, r] = s;
  if (t === "st") goStation(r);
  else if (t === "c") goConcept(r);
  else if (t === "lab") { const [ch, id] = r.split("/"); goChapter(ch); startSim(id); }
  else if (t === "sec") { const b = r[0], n = r.slice(1); goChapter(b + n.split(".")[0], n); }
  else if (t === "ch") goChapter(r);
  else if (t === "pj") openProject(r);
  else if (t === "nb") window.open(PRACTICE.colab + r, "_blank", "noopener");
  else if (t === "ex") {
    const e = PRACTICE.exercises.find(x => x.id === r); if (!e) return;
    goChapter(e.ch);
    setTimeout(() => { const el = document.querySelector(`details.ex[data-ex="${r}"]`); if (el) { el.open = true; el.scrollIntoView({ block: "start" }); } }, 60);
  }
}

function openPaths() {
  const d = drawer("paths", "Learning paths", "Pick a route; every step is something you do"); d.hidden = false;
  const body = d.querySelector(".drawer-body");
  const card = P => { const [a, n] = pathProgress(P), nx = nextStep(P); return `<button type="button" class="pathcard${P.id === activePath ? " on" : ""}" data-path="${P.id}" style="--pc:var(--${P.color})">
      <span class="pc-top"><span class="pc-tag">${esc(P.tag)}</span><span class="pc-lvl">${esc(P.level)} · ${esc(P.time)}</span></span>
      <b class="pc-t">${esc(P.title)}</b><span class="pc-who">${esc(P.who)}</span>
      <span class="bar"><i style="width:${a / n * 100}%"></i></span><span class="pc-meta">${a} of ${n} steps${P.id === activePath ? " · your current path" : ""}${a && nx ? ` · next: ${esc(nx[2])}` : ""}</span></button>`; };
  const name = id => PATHS.find(p => p.id === id).title;
  body.innerHTML = `<p class="lede" style="margin:0">There isn't one right order. These are six routes through the same material. Each mixes simulations, reading, exercises and build projects, and they share steps, so progress in one counts in the others. <b>New to all of this and want neural nets?</b> Start with the first one.</p>
    <div class="pathmap" aria-label="How the paths connect">${PATH_MAP.map((row, i) => `<div class="pm-row"><span class="pm-l">${["Foundations (optional)", "Pick one to start", "Then go deeper"][i]}</span><div class="pm-items">${row.map(id => `<button type="button" class="pm-node" data-path="${id}" style="--pc:var(--${PATHS.find(p => p.id === id).color})">${esc(name(id))}</button>`).join("")}</div></div>`).join('<div class="pm-arrow" aria-hidden="true">↓</div>')}</div>
    <div class="pathgrid">${PATHS.map(card).join("")}</div>`;
  body.querySelectorAll("[data-path]").forEach(b => b.onclick = () => openPath(b.dataset.path));
}
function openPath(id) {
  const P = PATHS.find(p => p.id === id), d = drawer("paths", "Learning paths", "Pick a route; every step is something you do"); d.hidden = false;
  const body = d.querySelector(".drawer-body"), [a, n] = pathProgress(P), nx = nextStep(P);
  let k = 0;
  body.innerHTML = `<button type="button" class="btn" data-back>← All paths</button>
    <div style="--pc:var(--${P.color})" class="pathhead"><p class="eyebrow">${esc(P.level)} · ${esc(P.time)} · ${pathSteps(P).length} steps</p><h2 style="margin:2px 0 6px">${esc(P.title)}</h2>
    <p class="lede" style="margin:0 0 4px"><b>For:</b> ${esc(P.who)}</p><p class="lede" style="margin:0"><b>You'll end with:</b> ${esc(P.outcome)}</p>
    <span class="bar" style="margin-top:10px"><i style="width:${a / n * 100}%"></i></span><p class="note">${a} of ${n} done. Exercises, concepts and project milestones tick themselves when you complete them anywhere on the site; tick the rest here.</p>
    <div class="btns" style="margin:0">${nx ? `<button type="button" class="btn primary" data-next>${a ? "Continue" : "Start"}: ${esc(nx[2])} →</button>` : `<span class="pill ok">Path complete</span>`}${P.id === activePath ? `<button type="button" class="btn" data-unfollow>Stop following</button>` : `<button type="button" class="btn" data-follow>Follow this path</button>`}</div></div>
    ${P.stages.map(([title, steps], si) => `<section class="pstage"><h3><span>${si + 1}</span>${esc(title)}</h3><ol>${steps.map(s => { const i = k++, dn = stepDone(s), isNext = nx && stepKey(s) === stepKey(nx); return `<li class="pstep${dn ? " done" : ""}${isNext ? " next" : ""}">
      <button type="button" class="tick" data-tick="${i}" aria-pressed="${dn}" aria-label="${dn ? "Mark not done" : "Mark done"}">${dn ? "✓" : ""}</button>
      <button type="button" class="ps-go" data-go="${i}"><span class="ps-type t-${s[0]}">${TYPE_LABEL[s[0]]}</span><b>${esc(stepTitle(s))}</b><small>${esc(s[3])}</small></button></li>`; }).join("")}</ol></section>`).join("")}
    ${PATH_AFTER[P.id].length ? `<div class="pathafter"><p class="eyebrow">After this</p><div class="btns" style="margin:0">${PATH_AFTER[P.id].map(x => `<button type="button" class="btn" data-path="${x}">${esc(PATHS.find(p => p.id === x).title)} →</button>`).join("")}</div></div>` : ""}`;
  const all = pathSteps(P);
  body.querySelector("[data-back]").onclick = openPaths;
  body.querySelectorAll("[data-path]").forEach(b => b.onclick = () => openPath(b.dataset.path));
  body.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { setActivePath(P.id); goStep(all[+b.dataset.go]); });
  body.querySelectorAll("[data-tick]").forEach(b => b.onclick = () => { const top = d.querySelector(".drawer-card").scrollTop; toggleStep(all[+b.dataset.tick]); openPath(id); d.querySelector(".drawer-card").scrollTop = top; });
  const nb = body.querySelector("[data-next]"); if (nb) nb.onclick = () => { setActivePath(P.id); goStep(nx); };
  const f = body.querySelector("[data-follow]"); if (f) f.onclick = () => { setActivePath(P.id); openPath(id); };
  const u = body.querySelector("[data-unfollow]"); if (u) u.onclick = () => { setActivePath(null); openPath(id); };
}
// The pill: your current path's next step, one click away from anywhere.
function updatePathPill() {
  let pill = $("#path-pill");
  const P = activePath && PATHS.find(p => p.id === activePath);
  const badge = $("#path-badge"); if (badge) badge.textContent = P ? pathProgress(P).join("/") : "";
  if (!P) { if (pill) pill.remove(); return; }
  const nx = nextStep(P), [a, n] = pathProgress(P);
  if (!pill) { pill = document.createElement("div"); pill.id = "path-pill"; document.body.appendChild(pill); }
  pill.style.setProperty("--pc", `var(--${P.color})`);
  pill.innerHTML = nx ? `<button type="button" class="pp-main" title="Go to the next step of your path"><span class="pp-k">${esc(P.title)} · ${a}/${n}</span><span class="pp-n">Next: ${esc(nx[2])} →</span></button>${PATHDONE.has(stepKey(nx)) || ["c", "ex", "pj"].includes(nx[0]) ? "" : `<button type="button" class="pp-done" title="Mark this step done">✓ Done</button>`}<button type="button" class="pp-x" aria-label="Open path">☰</button>`
    : `<button type="button" class="pp-main"><span class="pp-k">${esc(P.title)}</span><span class="pp-n">Path complete. Pick the next one →</span></button>`;
  pill.querySelector(".pp-main").onclick = () => nx ? goStep(nx) : openPaths();
  const dn = pill.querySelector(".pp-done"); if (dn) dn.onclick = () => toggleStep(nx);
  const x = pill.querySelector(".pp-x"); if (x) x.onclick = () => openPath(P.id);
}
