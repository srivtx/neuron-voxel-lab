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
