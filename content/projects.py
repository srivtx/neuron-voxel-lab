"""Build-it projects. Each milestone runs top to bottom in one Colab session (state carries over)."""
PROJECTS = [
dict(id="p1", title="Regression from scratch on real medical data",
 chapters=["M4", "M5", "M7", "M8", "M11"],
 blurb="Predict disease progression from 10 patient measurements (scikit-learn's diabetes dataset, 442 patients, bundled with Colab). You'll build linear regression four ways (closed form, gradient descent, ridge with cross-validation) and put an honest error bar on one coefficient with the bootstrap. Uses Murphy ch. 4, 5, 7, 8 and 11.",
 steps=[
  dict(title="Load, split and standardise", kind="code",
   q="Load the data, split 80/20 with a fixed seed, and standardise each feature using the training set's mean and standard deviation only. Why must the test set use the training statistics?",
   answer="Standardising puts every feature on the same scale, so weights are comparable and gradient descent isn't dominated by one large-scale feature. Using test-set statistics would leak information about the test data into training, making the test score optimistic.",
   code='''import numpy as np
from sklearn.datasets import load_diabetes
d = load_diabetes()
X, y, names = d.data, d.target, d.feature_names
rng = np.random.default_rng(0)
idx = rng.permutation(len(y)); cut = int(0.8 * len(y))
tr, te = idx[:cut], idx[cut:]
mu, sd = X[tr].mean(0), X[tr].std(0)
Xtr = (X[tr] - mu) / sd                  ## standardise with TRAINING statistics
Xte = (X[te] - mu) / sd                  ## same transform for the test set
ytr, yte = y[tr], y[te]
print(Xtr.shape, Xte.shape, names)'''),
  dict(title="Closed-form least squares", kind="code",
   q="Add a column of ones for the bias and solve the normal equations. Report the test MSE and R² (1 − MSE / variance of y). Which feature has the largest weight?",
   answer="The normal equations give the exact minimum of the squared error in one step (Murphy §11.2). Test R² ≈ 0.35 on this split: the 10 measurements explain about a third of the variation in disease progression (other splits give up to ≈ 0.5). BMI and s5 get the largest positive weights; s1 gets a large negative one that partly cancels its correlated twin s2. Because features are standardised, weight sizes are comparable.",
   code='''A = np.column_stack([np.ones(len(Xtr)), Xtr])
w = np.linalg.solve(A.T @ A, A.T @ ytr)          ## normal equations (X^T X) w = X^T y
pred = np.column_stack([np.ones(len(Xte)), Xte]) @ w
mse = np.mean((pred - yte) ** 2)
print(f"test MSE {mse:.1f}   R^2 {1 - mse / yte.var():.3f}")
print("largest weight:", names[np.argmax(np.abs(w[1:]))], np.round(w[1:], 1))'''),
  dict(title="The same answer by gradient descent", kind="code",
   q="Minimise the mean squared error with plain gradient descent (learning rate 0.1, 2,000 steps) starting from zeros. Compare the weights with the closed form.",
   answer="Most weights match, but the largest gap is still ≈ 0.7 after 2,000 steps. The culprit is s1 and s2: they are strongly correlated, which turns the bowl into a long, flat valley (an ill-conditioned problem, Murphy §8.2.3), and gradient descent crawls along it. The loss is convex, so it will get there; run 20,000 steps and watch the gap shrink. This slow-valley effect is exactly what momentum and Adam fix.",
   code='''wg = np.zeros(A.shape[1])
for step in range(2000):
    grad = 2 * A.T @ (A @ wg - ytr) / len(ytr)   ## gradient of the mean squared error
    wg -= 0.1 * grad
print("max |w_gd - w_closed| =", np.abs(wg - w).max().round(4))'''),
  dict(title="Ridge with 5-fold cross-validation", kind="code",
   q="For λ in a log grid from 1e−3 to 1e3, fit ridge (don't penalise the bias) and measure 5-fold CV error on the training set. Pick the best λ, refit on all training data, report test MSE.",
   answer="Small λ ≈ ordinary least squares; huge λ shrinks every weight to zero and underfits. The CV curve is fairly flat for small λ here because 10 features and 353 patients isn't a hard overfitting problem, and the best λ gives a test MSE close to plain least squares. Ridge helps most when features are many or correlated (s1 and s2 are highly correlated here).",
   code='''def ridge(A, y, lam):
    P = lam * np.eye(A.shape[1]); P[0, 0] = 0            # don't penalise the bias
    return np.linalg.solve(A.T @ A + P, A.T @ y)          ## ridge closed form
folds = np.array_split(np.random.default_rng(1).permutation(len(ytr)), 5)
lams = np.logspace(-3, 3, 13); cv = []
for lam in lams:
    errs = []
    for k in range(5):
        v = folds[k]; t = np.concatenate([folds[j] for j in range(5) if j != k])
        wr = ridge(A[t], ytr[t], lam)
        errs.append(np.mean((A[v] @ wr - ytr[v]) ** 2))
    cv.append(np.mean(errs))
best = lams[int(np.argmin(cv))]
wr = ridge(A, ytr, best)
print("CV errors:", np.round(cv, 0))
print(f"best lambda {best:.3g}  test MSE {np.mean((np.column_stack([np.ones(len(Xte)), Xte]) @ wr - yte)**2):.1f}")'''),
  dict(title="Bootstrap error bar on the BMI effect", kind="code",
   q="Resample the training patients with replacement 2,000 times, refit least squares each time, and report a 95% interval for the BMI weight. Does the interval include 0?",
   answer="The interval is well away from 0, so BMI's effect isn't a fluke of this particular sample. The bootstrap gives this error bar without any formula, by rerunning the analysis on resampled data (Murphy §4.7.3).",
   code='''j = names.index("bmi") + 1
boots = []
rng = np.random.default_rng(2)
for _ in range(2000):
    i = rng.integers(0, len(ytr), len(ytr))          ## resample patients with replacement
    boots.append(np.linalg.lstsq(A[i], ytr[i], rcond=None)[0][j])
lo, hi = np.percentile(boots, [2.5, 97.5])
print(f"BMI weight {w[j]:.1f}   95% bootstrap interval [{lo:.1f}, {hi:.1f}]")'''),
  dict(title="Write-up", kind="think",
   q="In four sentences: what did each method add, and which model would you deploy?",
   answer="Closed form gives the exact least-squares answer instantly; gradient descent reaches the same answer by a method that also works when no formula exists; ridge plus cross-validation chose how much to shrink using only training data; the bootstrap measured how much a coefficient would wobble with new patients. Deploy ridge with the CV-chosen λ (here nearly identical to least squares), report its test MSE, and report the bootstrap interval for any coefficient you interpret.")
 ]),
dict(id="p2", title="Handwritten digits: PCA, softmax and optimisers from scratch",
 chapters=["M2", "M6", "M7", "M8", "M10"],
 blurb="1,797 handwritten digits, 8×8 pixels (bundled with scikit-learn). Compress them with PCA via SVD, build a softmax classifier with hand-derived gradients, check those gradients numerically, race GD, momentum and Adam, and find the digits the model is least sure about using entropy. Uses Murphy ch. 2, 6, 7, 8 and 10.",
 steps=[
  dict(title="Load and look", kind="code",
   q="Load the digits, scale pixels to 0–1, split 1,400 train / rest test, and print the class counts.",
   answer="Each image is 64 numbers (8×8 pixels, values 0–16). Dividing by 16 puts them in 0–1. Classes are roughly balanced, so accuracy is a fair first metric.",
   code='''import numpy as np
from sklearn.datasets import load_digits
d = load_digits()
X, y = d.data / 16.0, d.target
rng = np.random.default_rng(0); idx = rng.permutation(len(y))
Xtr, ytr, Xte, yte = X[idx[:1400]], y[idx[:1400]], X[idx[1400:]], y[idx[1400:]]
print(Xtr.shape, Xte.shape, np.bincount(ytr))'''),
  dict(title="PCA by SVD", kind="code",
   q="Centre the training images and compute the SVD. How many components keep 90% of the variance? Reconstruct a test image from 5, 15 and 30 components and print the errors.",
   answer="About 20 of the 64 directions hold 90% of the variance, so digit images live near a much smaller subspace. Reconstruction error drops quickly with the first components. This is the linear autoencoder from station 7 (Murphy §20.1, §7.5).",
   code='''mean = Xtr.mean(0)
U, s, Vt = np.linalg.svd(Xtr - mean, full_matrices=False)
var = s ** 2 / np.sum(s ** 2)
k90 = int(np.searchsorted(np.cumsum(var), 0.90) + 1)    ## components needed for 90% variance
print("components for 90% variance:", k90)
x = Xte[0] - mean
for k in [5, 15, 30]:
    rec = Vt[:k].T @ (Vt[:k] @ x)                        ## project onto top-k directions and back
    print(f"k={k:2d}  reconstruction error {np.linalg.norm(x - rec) / np.linalg.norm(x):.3f}")'''),
  dict(title="Softmax regression: loss and gradient", kind="code",
   q="Write the softmax cross-entropy loss and its gradient for weights W (64×10) and bias b (10). Derive the gradient first: why is it Xᵀ(P − Y)/N?",
   answer="With p = softmax(z) and loss −log p_true, the derivative with respect to each score is p_k − y_k (y is one-hot): the same 'prediction minus truth' as logistic regression, one entry per class. Chain rule through z = XW + b gives ∂L/∂W = Xᵀ(P − Y)/N and ∂L/∂b = mean of (P − Y) (Murphy §10.3).",
   code='''def softmax(Z):
    Z = Z - Z.max(1, keepdims=True)                     # log-sum-exp trick (ch. 2)
    E = np.exp(Z); return E / E.sum(1, keepdims=True)
def loss_grad(W, b, X, y):
    N = len(y); P = softmax(X @ W + b)
    loss = -np.mean(np.log(P[np.arange(N), y] + 1e-12))
    Y = np.eye(10)[y]
    dZ = (P - Y) / N                                    ## prediction minus truth, averaged
    return loss, X.T @ dZ, dZ.sum(0)
W0, b0 = np.zeros((64, 10)), np.zeros(10)
L0, gW, gb = loss_grad(W0, b0, Xtr, ytr)
print(f"loss at zero weights {L0:.4f}  (log 10 = {np.log(10):.4f})")'''),
  dict(title="Gradient check", kind="code",
   q="Compare your gradient for 5 random weights against finite differences. They should agree to about 6 digits.",
   answer="If they disagree, the derivation or the code has a bug. This check is how you verify any hand-written backward pass before trusting it (station 4).",
   code='''rng = np.random.default_rng(1)
W = rng.normal(0, 0.1, (64, 10)); b = np.zeros(10)
_, gW, _ = loss_grad(W, b, Xtr, ytr)
for _ in range(5):
    i, j = rng.integers(64), rng.integers(10); h = 1e-5
    Wp = W.copy(); Wp[i, j] += h; Wm = W.copy(); Wm[i, j] -= h
    num = (loss_grad(Wp, b, Xtr, ytr)[0] - loss_grad(Wm, b, Xtr, ytr)[0]) / (2 * h)  ## central difference
    print(f"W[{i:2d},{j}]  analytic {gW[i, j]: .7f}  numeric {num: .7f}")'''),
  dict(title="Race the optimisers", kind="code",
   q="Train for 300 full-batch steps with GD (lr 0.5), momentum (lr 0.5, β 0.9) and Adam (lr 0.05). Print the training loss at steps 10, 100, 300 and the test accuracy.",
   answer="Momentum and Adam reach a low loss much sooner than plain GD. All three end with test accuracy around 95–97%, which is good for a linear model on raw pixels.",
   code='''def train(opt, steps=300):
    W, b = np.zeros((64, 10)), np.zeros(10)
    vW, vb, mW, mb, sW, sb = [np.zeros_like(a) for a in (W, b, W, b, W, b)]
    hist = []
    for t in range(1, steps + 1):
        L, gW, gb = loss_grad(W, b, Xtr, ytr); hist.append(L)
        if opt == "gd": W -= 0.5 * gW; b -= 0.5 * gb
        elif opt == "momentum":
            vW = 0.9 * vW + gW; vb = 0.9 * vb + gb      ## keep 90% of the previous velocity
            W -= 0.5 * vW; b -= 0.5 * vb
        else:
            for p, g, m, s in ((W, gW, mW, sW), (b, gb, mb, sb)):
                m[:] = 0.9 * m + 0.1 * g; s[:] = 0.999 * s + 0.001 * g * g
                p -= 0.05 * (m / (1 - 0.9 ** t)) / (np.sqrt(s / (1 - 0.999 ** t)) + 1e-8)
    acc = np.mean(np.argmax(Xte @ W + b, 1) == yte)
    return W, b, hist, acc
models = {}
for opt in ["gd", "momentum", "adam"]:
    W, b, h, acc = train(opt); models[opt] = (W, b)
    print(f"{opt:8s} loss@10 {h[9]:.3f}  @100 {h[99]:.3f}  @300 {h[-1]:.3f}  test acc {acc:.3f}")'''),
  dict(title="Which digits is it unsure about?", kind="code",
   q="Using the Adam model, compute the entropy (in bits) of each test prediction. Print the 5 most uncertain test digits with their true label, predicted label and top-2 probabilities. What's the maximum possible entropy?",
   answer="Maximum entropy for 10 classes is log₂ 10 ≈ 3.32 bits (completely unsure). The most uncertain digits are genuinely ambiguous shapes. Here: a 9 that looks like a 5, a 2 torn between 2 and 8, a 3 that looks like a 5. Several of them are the model's mistakes. Entropy turns a probability vector into one 'how unsure' number (Murphy §6.1), and sorting by it is a cheap way to find the cases a human should check.",
   code='''W, b = models["adam"]
P = softmax(Xte @ W + b)
H = -np.sum(P * np.log2(P + 1e-12), axis=1)               ## entropy of each prediction
for i in np.argsort(-H)[:5]:
    top = np.argsort(-P[i])[:2]
    print(f"true {yte[i]}  pred {top[0]}  H {H[i]:.2f} bits  p={P[i, top[0]]:.2f}/{P[i, top[1]]:.2f} (for {top[0]}/{top[1]})")
print("max possible entropy:", round(np.log2(10), 3))'''),
  dict(title="Write-up", kind="think",
   q="What did PCA tell you about the data, what does the gradient check guarantee, and why did Adam win the race?",
   answer="PCA showed the 64 pixels really vary along about 20 directions, so the data is far simpler than its raw size. The gradient check guarantees the backward pass matches the loss you wrote, not that the model is good. Adam won early because it scales each weight's step by that weight's typical gradient, so rarely active pixels and busy pixels both get sensible steps from the first iteration.")
 ])
]

PROJECTS.append(dict(id="p3", title="A neural network from scratch: beat the linear model",
 chapters=["M13", "M14", "M8"],
 blurb="Same handwritten digits as Project 2, but now with a hidden layer you build by hand: He initialisation, ReLU, softmax, a backward pass you derive and gradient-check, minibatch SGD with momentum, then dropout and weight decay. The goal is to beat Project 2's linear softmax model and understand exactly why the hidden layer helps. Uses Murphy ch. 13 (and 8, 14).",
 steps=[
  dict(title="Data and one-hot labels", kind="code",
   q="Load the digits, scale to 0–1, use the same 1,400/397 split as Project 2, and build one-hot label matrices.",
   answer="One-hot labels make the softmax gradient a clean matrix expression, P − Y. Using the same split as Project 2 makes the comparison fair.",
   code='''import numpy as np
from sklearn.datasets import load_digits
d = load_digits(); X, y = d.data / 16.0, d.target
idx = np.random.default_rng(0).permutation(len(y))
Xtr, ytr, Xte, yte = X[idx[:1400]], y[idx[:1400]], X[idx[1400:]], y[idx[1400:]]
Ytr = np.eye(10)[ytr]                            ## one-hot rows
print(Xtr.shape, Ytr.shape, Ytr[0])'''),
  dict(title="Initialise and run the forward pass", kind="code",
   q="Create a 64 → 128 → 10 network with He initialisation (std √(2/fan_in)), ReLU hidden units and softmax output. Check that the loss at initialisation is close to log 10 ≈ 2.30. Why should it be?",
   answer="With small random weights the network has no preference, so each class gets about 1/10 and the loss is −log(1/10) = 2.30. A starting loss far from that usually means a bug or a badly scaled initialisation. It's a free sanity check (Murphy §13.4.5).",
   code='''rng = np.random.default_rng(1)
def init(h=128):
    return {"W1": rng.normal(0, np.sqrt(2 / 64), (64, h)), "b1": np.zeros(h),
            "W2": rng.normal(0, np.sqrt(2 / h), (h, 10)) * 0.1, "b2": np.zeros(10)}
def softmax(Z):
    Z = Z - Z.max(1, keepdims=True); E = np.exp(Z); return E / E.sum(1, keepdims=True)
def forward(P, X):
    Z1 = X @ P["W1"] + P["b1"]; H = np.maximum(Z1, 0)        ## hidden layer: ReLU
    return Z1, H, softmax(H @ P["W2"] + P["b2"])
P = init(); _, _, out = forward(P, Xtr)
print(f"initial loss {-np.mean(np.log(out[np.arange(1400), ytr])):.4f}   log(10) = {np.log(10):.4f}")'''),
  dict(title="Backward pass and gradient check", kind="code",
   q="Write the backward pass (with an optional weight-decay term λ‖W‖²/2) and check 6 random weights against central differences.",
   answer="Output blame is (P − Y)/N, exactly as in Project 2. It flows back through W₂, is zeroed wherever the ReLU was off, then gives W₁'s gradient as Xᵀ(blame). The analytic and numeric values agree to about 7 digits, so the derivation and the code match (Murphy §13.3).",
   code='''def loss_grads(P, X, Y, lam=0.0):
    N = len(X); Z1, H, Pr = forward(P, X)
    loss = -np.mean(np.log((Pr * Y).sum(1) + 1e-12)) + lam / 2 * (np.sum(P["W1"]**2) + np.sum(P["W2"]**2))
    d2 = (Pr - Y) / N
    g = {"W2": H.T @ d2 + lam * P["W2"], "b2": d2.sum(0)}
    d1 = (d2 @ P["W2"].T) * (Z1 > 0)                  ## blame back through W2, then through ReLU
    g["W1"] = X.T @ d1 + lam * P["W1"]; g["b1"] = d1.sum(0)
    return loss, g
_, g = loss_grads(P, Xtr[:200], Ytr[:200], lam=1e-3)
for k in ["W1", "W2", "W1", "W2", "b1", "b2"]:
    i = tuple(int(rng.integers(0, s)) for s in P[k].shape); h = 1e-5
    P[k][i] += h; lp = loss_grads(P, Xtr[:200], Ytr[:200], 1e-3)[0]; P[k][i] -= 2 * h
    lm = loss_grads(P, Xtr[:200], Ytr[:200], 1e-3)[0]; P[k][i] += h
    print(f"{k}{list(i)}  analytic {g[k][i]: .8f}  numeric {(lp - lm) / (2 * h): .8f}")'''),
  dict(title="Train with minibatch SGD + momentum", kind="code",
   q="Train for 40 epochs with batch size 64, learning rate 0.1, momentum 0.9 and no regularisation. Print train and test accuracy every 10 epochs. Does it beat Project 2's 97.7%?",
   answer="Test accuracy reaches ≈ 98.5%, beating the linear model's 97.7%, while training accuracy hits 100% by epoch 30. The hidden layer can carve curved boundaries; on only 1,400 images it also memorises the training set completely, which is the train–test gap.",
   code='''def accuracy(P, X, y): return np.mean(np.argmax(forward(P, X)[2], 1) == y)
def train(lam=0.0, drop=0.0, epochs=40, seed=2, verbose=True):
    r = np.random.default_rng(seed); P = init(); V = {k: np.zeros_like(v) for k, v in P.items()}
    for ep in range(1, epochs + 1):
        for b in np.array_split(r.permutation(1400), 1400 // 64):
            Xb = Xtr[b]
            if drop: Xb = Xb * (r.random(Xb.shape) > drop) / (1 - drop)   # input dropout (inverted)
            _, g = loss_grads(P, Xb, Ytr[b], lam)
            for k in P:
                V[k] = 0.9 * V[k] + g[k]                ## momentum
                P[k] -= 0.1 * V[k]
        if verbose and ep % 10 == 0: print(f"epoch {ep}: train {accuracy(P, Xtr, ytr):.3f}  test {accuracy(P, Xte, yte):.3f}")
    return P
P = train()'''),
  dict(title="Regularise: weight decay and dropout", kind="code",
   q="Train three more models: weight decay λ = 1e−3, input dropout 0.2, and both. Compare test accuracy across 3 seeds each.",
   answer="Weight decay helps a little (≈ 98.7% vs 98.3%). Input dropout hurts here (≈ 97.3%), and both together hurt more (≈ 96%). The reason: dropping 20% of only 64 pixels throws away real information on images this small, and 40 epochs isn't enough to recover. Regularisation is a dial, not a free win: it helps when the model overfits more than it starves for signal. Always compare averages over seeds, because single runs differ by a few tenths of a percent (Murphy §13.5).",
   code='''for name, kw in [("none", {}), ("weight decay", {"lam": 1e-3}), ("dropout 0.2", {"drop": 0.2}), ("both", {"lam": 1e-3, "drop": 0.2})]:
    accs = [accuracy(train(verbose=False, seed=s, **kw), Xte, yte) for s in (2, 3, 4)]
    print(f"{name:13s} test accuracy {np.mean(accs):.4f} ± {np.std(accs):.4f}")'''),
  dict(title="Where does it still fail?", kind="code",
   q="Build the 10×10 confusion matrix on the test set for the unregularised model and list the three most-confused (true, predicted) pairs.",
   answer="The remaining errors cluster in a few look-alike pairs (often 1↔8, 3↔8, 9↔5 or 4↔9 in this dataset), rather than being spread at random. A confusion matrix tells you where to look next: more data for those classes, augmentation, or a convolutional layer that sees strokes instead of raw pixels (ch. 14).",
   code='''pred = np.argmax(forward(P, Xte)[2], 1)
Cm = np.zeros((10, 10), int)
for t, p in zip(yte, pred): Cm[t, p] += 1        ## rows = truth, columns = prediction
off = [(Cm[i, j], i, j) for i in range(10) for j in range(10) if i != j and Cm[i, j]]
print("errors:", len(yte) - np.trace(Cm), "of", len(yte))
for c, i, j in sorted(off, reverse=True)[:3]: print(f"true {i} predicted as {j}: {c} times")'''),
  dict(title="Write-up", kind="think",
   q="Why did the hidden layer help, why didn't it help more, and what would you try next?",
   answer="It helped because 128 ReLU units let the model combine pixel evidence non-linearly (e.g. 'a loop at the top and a stroke at the right'), which a single linear score per class can't express. It didn't help more because 1,400 small images give little room: the linear model was already at 97.7%, and the MLP memorises its training set. Next: a small CNN (ch. 14) that shares stroke detectors across positions, plus data augmentation (shifts and small rotations) to create more training variety.")
 ]))
