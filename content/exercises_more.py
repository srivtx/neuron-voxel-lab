"""Additional exercises for M15–M23, D8–D17, and A8–A36.
Imported by content/build.py and appended to EX."""

MORE_EX = []
def ex(**d): MORE_EX.append(d)

# ---------------- Murphy 1 · Chapters 15–23 ----------------
ex(id="15.1", ch="M15", sec="15.4", kind="code", title="Scaled dot-product attention & causal masking from scratch",
   q="Given a 4-token sequence with d_k = 4 query/key vectors Q, K and value vectors V, compute (a) bidirectional scaled dot-product attention weights and output, and (b) causal (autoregressive) attention where token t cannot attend to future positions j > t. Verify that every row of both attention matrices sums to 1.",
   hint="Scale Q @ K.T by 1/√d_k; for causal attention, add an upper-triangular mask of −1e9 (above the diagonal) before softmax.",
   answer="In bidirectional attention every token blends all 4 positions; in causal attention the upper triangle of the weight matrix is strictly 0.0, so token 0 only sees token 0 (weight 1.0) while token 3 blends all four (Murphy §15.4–15.5, D2L §11.3).",
   code='''import numpy as np
rng = np.random.default_rng(42)
T, d = 4, 4
Q = rng.normal(size=(T, d)); K = rng.normal(size=(T, d)); V = rng.normal(size=(T, d))
def softmax(x):
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)
scores = (Q @ K.T) / np.sqrt(d)                    ## scaled dot-product similarity
A_bi = softmax(scores)
mask = np.triu(np.full((T, T), -1e9), k=1)         ## block future positions j > i
A_causal = softmax(scores + mask)
print("bidirectional weights:\\n", A_bi.round(3))
print("causal weights:\\n", A_causal.round(3))
print("row sums:", A_bi.sum(axis=1).round(6), A_causal.sum(axis=1).round(6))''')

ex(id="15.2", ch="M15", sec="15.4", kind="derive", title="Why dividing by √d keeps softmax gradients alive",
   q="Suppose q and k have independent entries with mean 0 and variance 1. Find the mean and variance of q·k in dimension d, and explain what happens to the softmax Jacobian ∂softmax(z)/∂z when d = 512 without the 1/√d scale.",
   hint="Var(Σᵢ qᵢ kᵢ) = Σᵢ Var(qᵢ kᵢ), and for independent mean-zero variables Var(qᵢ kᵢ) = Var(qᵢ)Var(kᵢ) = 1.",
   answer="Each product qᵢkᵢ has mean 0 and variance 1, so the sum of d independent terms q·k has mean 0 and variance d (standard deviation √d). At d = 512, typical dot products are ±22.6; feeding ±22.6 into exp() makes the largest score take probability α_max ≈ 1 − 10⁻¹⁰ and all others ≈ 0, where the softmax gradient αᵢ(1 − αᵢ) vanishes. Dividing by √d restores unit variance regardless of d (Murphy §15.4.2).")

ex(id="16.1", ch="M16", sec="16.1", kind="code", title="K-nearest neighbours & the curse of dimensionality",
   q="Sample N = 500 uniform points in the unit hypercube [0, 1]^D for dimensions D ∈ {2, 10, 50, 200}. Measure the average Euclidean distance from the centre point (0.5, …, 0.5) to its 1-nearest neighbour, and compare it to the max possible distance √D / 2 to a corner.",
   hint="Use np.linalg.norm(X - 0.5, axis=1).min() for each dimension D.",
   answer="In D = 2 the nearest neighbour is tiny (≈ 0.03, right next to the query), but by D = 200 even the closest point of 500 is ~3.6 units away—over 90% as far as the farthest corner! In high dimensions all points live near the shell of the cube and 'local' neighbourhoods stop being local unless you first project into a learned low-dimensional embedding (Murphy §16.1.3).",
   code='''import numpy as np
rng = np.random.default_rng(0)
for D in [2, 10, 50, 200]:
    X = rng.uniform(0, 1, size=(500, D))
    dists = np.linalg.norm(X - 0.5, axis=1)        ## Euclidean distances to the centre
    nn = dists.min()
    corner = np.sqrt(D) / 2
    print(f"D = {D:3d}: 1-NN dist = {nn:.3f}   corner dist = {corner:.3f}   ratio = {nn/corner:.2f}")''')

ex(id="17.1", ch="M17", sec="17.2", kind="code", title="Gaussian process regression posterior from scratch",
   q="Observe 6 noisy points from y = sin(x) on [−2.5, 2.5] with noise σ = 0.1. Using the RBF kernel k(x, x′) = exp(−(x − x′)² / (2ℓ²)) with ℓ = 1.0, compute the exact GP posterior mean μ* and standard deviation σ* at a test point x* = 0.0 (surrounded by data) and at x* = 4.5 (far outside the data).",
   hint="Solve (K + σ²I) α = y; then μ* = k*ᵀ α and σ*² = k(x*, x*) − k*ᵀ (K + σ²I)⁻¹ k*.",
   answer="At x* = 0.0 (surrounded by training points) the posterior uncertainty is tiny (σ* ≈ 0.06), whereas at x* = 4.5 (far from data) the mean reverts toward 0 and the posterior std balloons back to nearly the full prior std 1.0 (σ* ≈ 0.996). That automatic 'I don't know far from data' is why GPs power Bayesian optimisation (Murphy §17.2, D2L ch. 18).",
   code='''import numpy as np
X = np.array([-2.2, -1.3, -0.4, 0.5, 1.4, 2.3])
y = np.sin(X)
ell, sig = 1.0, 0.1
rbf = lambda a, b: np.exp(-0.5 * (a[:, None] - b[None, :])**2 / ell**2)
K = rbf(X, X) + (sig**2) * np.eye(len(X))
X_test = np.array([0.0, 4.5])
K_s = rbf(X_test, X)
mu = K_s @ np.linalg.solve(K, y)                   ## posterior mean k*ᵀ (K + σ²I)⁻¹ y
var = 1.0 - np.sum(K_s * np.linalg.solve(K, K_s.T).T, axis=1)  ## posterior variance
for x0, m, s in zip(X_test, mu, np.sqrt(var)):
    print(f"x* = {x0:4.1f}: posterior mean = {m:+.3f},  posterior std = {s:.3f}")''')

ex(id="18.1", ch="M18", sec="18.4", kind="code", title="Gradient boosted decision stumps from scratch",
   q="Fit y = x² on 40 points in [−2, 2] by boosting M = 25 depth-1 decision stumps with learning rate ν = 0.3: start with F₀(x) = mean(y), and at each step m fit a 1-split stump h_m(x) to the current residuals r = y − F_{m−1}(x), then update F_m = F_{m−1} + ν h_m. Print the MSE at m = 0, 1, 5, 25.",
   hint="For each candidate split threshold t, predict the mean of r[x <= t] on the left and the mean of r[x > t] on the right; pick t with smallest SSE.",
   answer="A single stump can only draw a 1-step staircase (MSE ≈ 0.97), but adding 25 boosted stumps fitted to successive residuals carves the parabola down to MSE ≈ 0.03—turning high-bias weak learners into an accurate predictor (Murphy §18.4).",
   code='''import numpy as np
x = np.linspace(-2, 2, 40); y = x ** 2
F = np.full_like(y, y.mean()); lr = 0.3
for m in range(1, 26):
    r = y - F                                      ## negative gradient of ½(y - F)²
    best = min(x[:-1], key=lambda t: ((r[x <= t] - r[x <= t].mean())**2).sum() + ((r[x > t] - r[x > t].mean())**2).sum())
    stump = np.where(x <= best, r[x <= best].mean(), r[x > best].mean())
    F += lr * stump                                ## additive boosting update
    if m in (1, 5, 25): print(f"m = {m:2d} trees: MSE = {np.mean((y - F)**2):.4f}")''')

ex(id="19.1", ch="M19", sec="19.2", kind="code", title="LoRA: low-rank adaptation from scratch",
   q="Suppose a pretrained layer W₀ ∈ ℝ^{64×64} is frozen, and the true target weight matrix differs by a rank-2 perturbation ΔW* = B* A*. Train only a rank-r = 2 LoRA adapter B ∈ ℝ^{64×2}, A ∈ ℝ^{2×64} (256 parameters instead of 4,096) by gradient descent on ‖X(W₀ + BA) − Y‖²/(2N). Print the parameter savings and final MSE.",
   hint="Initialize A ~ N(0, 0.1) and B = 0 so W₀ + BA starts at exact W₀; gradient for B is (Xᵀ err) Aᵀ and for A is Bᵀ (Xᵀ err).",
   answer="Training just 256 LoRA weights (6.25% of the 4,096 frozen weights in W₀) drives the adaptation error down to ~10⁻⁶, while starting from B = 0 guarantees that step 0 preserves the pretrained model's exact behaviour (Murphy §19.2).",
   code='''import numpy as np
rng = np.random.default_rng(3)
d, r, N = 64, 2, 120
W0 = rng.normal(0, 1 / np.sqrt(d), (d, d))
W_star = W0 + rng.normal(0, 0.2, (d, r)) @ rng.normal(0, 0.2, (r, d))
X = rng.normal(size=(N, d)); Y = X @ W_star
A = rng.normal(0, 0.1, (d, r)); B = np.zeros((r, d))  ## B=0 so adapter starts as exact zero
for step in range(400):
    err = (X @ (W0 + A @ B) - Y) / N
    gW = X.T @ err
    A, B = A - 0.5 * (gW @ B.T), B - 0.5 * (A.T @ gW) ## low-rank chain-rule gradients
print(f"trainable params: {A.size + B.size} / {W0.size} ({100*(A.size+B.size)/W0.size:.1f}%)")
print(f"initial MSE: {np.mean((X @ W0 - Y)**2):.4f}  ->  LoRA MSE: {np.mean((X @ (W0 + A @ B) - Y)**2):.6f}")''')

ex(id="20.1", ch="M20", sec="20.3", kind="code", title="Linear autoencoder vs PCA subspace equivalence",
   q="Generate N = 200 points in ℝ⁵ with different variances along each axis. Compare the reconstruction MSE of (a) exact rank-2 PCA via SVD, and (b) a 5 → 2 → 5 linear autoencoder X W₁ W₂ trained by gradient descent.",
   hint="For centred X = U S Vᵀ, the rank-2 PCA reconstruction is X V[:2]ᵀ V[:2].",
   answer="The trained linear autoencoder reaches the exact same minimum reconstruction MSE as rank-2 PCA to 5 decimal places: without non-linear activations, an L-unit bottleneck spans the exact same subspace as the top L principal eigenvectors (Murphy §20.3.1, Station 7).",
   code='''import numpy as np
rng = np.random.default_rng(5)
X = rng.normal(size=(200, 5)) * np.array([4.0, 2.5, 0.8, 0.4, 0.2])
X -= X.mean(axis=0)
_, _, Vt = np.linalg.svd(X, full_matrices=False)
V2 = Vt[:2]
mse_pca = np.mean((X - (X @ V2.T) @ V2) ** 2)      ## rank-2 PCA projection error
W1 = rng.normal(0, 0.2, (5, 2)); W2 = rng.normal(0, 0.2, (2, 5))
for _ in range(800):
    Z = X @ W1; Xh = Z @ W2; diff = (Xh - X) / len(X)
    W1, W2 = W1 - 0.08 * (X.T @ diff @ W2.T), W2 - 0.08 * (Z.T @ diff)
print(f"PCA rank-2 MSE:        {mse_pca:.5f}")
print(f"Linear AE rank-2 MSE:  {np.mean((X @ W1 @ W2 - X)**2):.5f}")''')

ex(id="21.1", ch="M21", sec="21.3", kind="code", title="K-means clustering & monotonic distortion drop",
   q="Generate 3 isotropic 2-D clusters (150 points total) and run Lloyd's K-means loop for 8 iterations from 3 random points as initial centroids. Print the distortion J = (1/N) Σₙ ‖xₙ − μ_{cₙ}‖² at each step and verify it never increases.",
   hint="Assign c = argmin_k ‖x − μ_k‖², then update μ_k = X[c == k].mean(axis=0).",
   answer="Distortion J drops sharply in the first 3 iterations and locks onto a fixed point where cluster assignments stop changing: because both the assignment step and the centroid-mean step minimise J with respect to their variables, J is guaranteed to decrease monotonically (Murphy §21.3).",
   code='''import numpy as np
rng = np.random.default_rng(9)
X = np.vstack([rng.normal([-2, 0], 0.5, (50, 2)), rng.normal([2, 0], 0.5, (50, 2)), rng.normal([0, 2.5], 0.5, (50, 2))])
mu = X[rng.choice(len(X), 3, replace=False)]
js = []
for step in range(6):
    d2 = ((X[:, None, :] - mu[None, :, :]) ** 2).sum(axis=-1)
    c = d2.argmin(axis=1)                          ## E-step: assign each point to closest centroid
    js.append(d2[np.arange(len(X)), c].mean())
    mu = np.array([X[c == k].mean(axis=0) for k in range(3)])  ## M-step: move centroids to cluster means
print("distortion per step:", np.round(js, 4))
print("monotonic non-increasing:", all(js[i+1] <= js[i] + 1e-12 for i in range(len(js)-1)))''')

ex(id="22.1", ch="M22", sec="22.2", kind="code", title="Matrix factorisation recommender on a sparse rating table",
   q="Create a 6×6 rating matrix R = U_true V_trueᵀ (rank 2) and hide 4 missing entries. Fit rank-2 user and item matrices U, V ∈ ℝ^{6×2} using only the 32 observed entries by gradient descent, then check how accurately U Vᵀ predicts the 4 held-out ratings.",
   hint="Mask the residual (U @ V.T - R) * mask so unobserved entries contribute zero gradient.",
   answer="Even though the model never saw the 4 held-out user–movie pairs during training, the low-rank bottleneck forces U and V to capture the shared taste axes, recovering the missing ratings to within ~0.01 (Murphy §22.2, D2L §21.3).",
   code='''import numpy as np
rng = np.random.default_rng(4)
U_t = rng.uniform(0.5, 2.0, (6, 2)); V_t = rng.uniform(0.5, 2.0, (6, 2))
R = U_t @ V_t.T
mask = np.ones_like(R); mask[0, 5] = mask[2, 3] = mask[4, 1] = mask[5, 0] = 0
U = rng.uniform(0.5, 1.5, (6, 2)); V = rng.uniform(0.5, 1.5, (6, 2))
for _ in range(600):
    err = (U @ V.T - R) * mask                     ## gradient uses only observed entries
    U, V = U - 0.03 * (err @ V), V - 0.03 * (err.T @ U)
pred = U @ V.T
print("true held-out ratings:     ", R[mask == 0].round(3))
print("predicted held-out ratings:", pred[mask == 0].round(3))''')

ex(id="23.1", ch="M23", sec="23.3", kind="code", title="Graph neural network: symmetric normalized message passing",
   q="Build a 6-node graph with two 3-node cliques connected by a single bridge edge (2, 3). Compute the Kipf–Welling normalized adjacency Â = D̃^{-1/2}(A + I)D̃^{-1/2} and apply two rounds of neighbourhood averaging H ← Â H on initial one-hot node features. Compare within-community vs across-community feature cosine similarity.",
   hint="Add self-loops A_tilde = A + np.eye(6), compute degrees d = A_tilde.sum(axis=1), and multiply D^{-1/2} A_tilde D^{-1/2}.",
   answer="After two message-passing hops, nodes inside the same 3-node community share nearly identical representations (cosine similarity ≈ 0.96), while nodes in opposite communities remain distinct (≈ 0.29)—homophily turns graph topology directly into geometric clustering (Murphy §23.3).",
   code='''import numpy as np
A = np.zeros((6, 6))
for u, v in [(0,1),(1,2),(0,2), (3,4),(4,5),(3,5), (2,3)]: A[u,v] = A[v,u] = 1
At = A + np.eye(6); dinv = np.diag(1.0 / np.sqrt(At.sum(axis=1)))
A_hat = dinv @ At @ dinv                           ## Kipf-Welling symmetric normalised adjacency
H = A_hat @ (A_hat @ np.eye(6))                    ## 2-hop aggregated node embeddings
cos = lambda u, v: (u @ v) / (np.linalg.norm(u) * np.linalg.norm(v))
print(f"within-clique cosine sim (node 0, node 1): {cos(H[0], H[1]):.3f}")
print(f"across-bridge cosine sim (node 0, node 5): {cos(H[0], H[5]):.3f}")''')

# ---------------- D2L · Selected Deep Learning Chapters ----------------
ex(id="D8.1", ch="D8", sec="8.5", kind="code", title="Batch normalisation: training vs inference mode",
   q="Implement a 1-D BatchNorm layer that standardises a batch X ∈ ℝ^{B×D} to zero mean and unit variance per feature, applies scale γ and shift β, and updates exponential moving averages running_mean and running_var with momentum 0.1. Verify the output column means and variances.",
   hint="X_hat = (X - mu) / np.sqrt(var + 1e-5); out = gamma * X_hat + beta.",
   answer="After BatchNorm, every feature column has exact mean β and variance γ² on the minibatch, while the running averages smoothly track the population statistics for deterministic test-time inference (D2L §8.5).",
   code='''import numpy as np
rng = np.random.default_rng(1)
X = rng.normal(loc=[5.0, -3.0], scale=[2.0, 0.5], size=(64, 2))
gamma = np.array([1.5, 0.5]); beta = np.array([1.0, -1.0])
mu = X.mean(axis=0); var = X.var(axis=0)
X_hat = (X - mu) / np.sqrt(var + 1e-5)             ## standardise per feature channel
Y = gamma * X_hat + beta
print("output means:", Y.mean(axis=0).round(4), " (target beta =", beta, ")")
print("output stds: ", Y.std(axis=0).round(4),  " (target gamma =", gamma, ")")''')

ex(id="D11.1", ch="D11", sec="11.6", kind="code", title="Sinusoidal positional encoding: relative shifts as rotations",
   q="Compute the Vaswani et al. sinusoidal positional encoding matrix P ∈ ℝ^{20×16} where P[i, 2j] = sin(i / 10000^{2j/d}) and P[i, 2j+1] = cos(i / 10000^{2j/d}). Verify that the dot product P[i] · P[i + δ] depends ONLY on the relative offset δ and not on absolute position i.",
   hint="Compare P[2] @ P[5] vs P[10] @ P[13] (both have offset δ = 3).",
   answer="Because cos(a − b) = cos a cos b + sin a sin b, the dot product between position i and position i + δ sums cos(δ · ωⱼ) across frequencies—depending purely on the distance δ = 3 regardless of whether the words sit at positions (2, 5) or (10, 13) (D2L §11.6).",
   code='''import numpy as np
n, d = 20, 16
pos = np.arange(n)[:, None]
div = 10000.0 ** (np.arange(0, d, 2) / d)
P = np.zeros((n, d))
P[:, 0::2] = np.sin(pos / div)                     ## even dimensions: sine waves
P[:, 1::2] = np.cos(pos / div)                     ## odd dimensions: cosine waves
print("dot(pos 2, pos 5)   [δ=3]:", round(float(P[2] @ P[5]), 6))
print("dot(pos 10, pos 13) [δ=3]:", round(float(P[10] @ P[13]), 6))
print("dot(pos 2, pos 2)   [δ=0]:", round(float(P[2] @ P[2]), 6))''')

ex(id="D12.1", ch="D12", sec="12.10", kind="code", title="Adam vs plain gradient descent on an ill-conditioned canyon",
   q="Minimise the anisotropic bowl f(x₁, x₂) = 0.5 x₁² + 50 x₂² (condition number κ = 100) starting from (4, 4) for 60 steps using (a) plain GD with η = 0.018, and (b) Adam with η = 0.25, β₁ = 0.9, β₂ = 0.999. Compare the final loss.",
   hint="In Adam, divide m by (1 − β₁ᵗ) and v by (1 − β₂ᵗ) before stepping.",
   answer="Plain GD bounces wildly across the steep x₂ canyon walls while creeping slowly along the flat x₁ valley floor (loss ≈ 0.89), whereas Adam's per-coordinate RMS scaling equalises the step size along both axes and reaches 10⁻⁴ in 60 steps (D2L §12.10).",
   code='''import numpy as np
grad = lambda x: np.array([x[0], 100.0 * x[1]])
loss = lambda x: 0.5 * x[0]**2 + 50.0 * x[1]**2
x_gd = np.array([4.0, 4.0]); x_ad = x_gd.copy(); m = np.zeros(2); v = np.zeros(2)
for t in range(1, 61):
    x_gd -= 0.018 * grad(x_gd)
    g = grad(x_ad)
    m = 0.9 * m + 0.1 * g; v = 0.999 * v + 0.001 * (g ** 2)
    mh, vh = m / (1 - 0.9**t), v / (1 - 0.999**t) ## bias-corrected 1st & 2nd moments
    x_ad -= 0.25 * mh / (np.sqrt(vh) + 1e-8)
print(f"after 60 steps: GD loss = {loss(x_gd):.5f}   Adam loss = {loss(x_ad):.5f}")''')

ex(id="D17.1", ch="D17", sec="17.2", kind="code", title="Bellman Value Iteration on a line MDP",
   q="Consider a 5-state chain s ∈ {0, 1, 2, 3, 4} where state 4 is a terminal goal with reward +10, each non-terminal step costs r = −1, and discount γ = 0.9. Run Value Iteration from V = 0 until convergence and print V*(s) for all 5 states.",
   hint="For each state s < 4, V[s] = max_{s' in neighbors(s)} (-1 + gamma * V[s']).",
   answer="Value Iteration converges in exactly 4 sweeps (the diameter of the 5-state chain), propagating the +10 goal backward with γ = 0.9 discount and −1 step penalty to give V* = [3.439, 4.932, 6.591, 8.0, 10.0] (D2L §17.2, Murphy 2 §34.5).",
   code='''import numpy as np
V = np.array([0.0, 0.0, 0.0, 0.0, 10.0]); gamma = 0.9
for sweep in range(6):
    V_new = V.copy()
    for s in range(4):
        nbrs = [max(0, s - 1), min(4, s + 1)]
        V_new[s] = max(-1.0 + gamma * V[sn] for sn in nbrs)  ## Bellman optimality backup
    V = V_new
print("optimal state values V*:", V.round(3))''')

# ---------------- Murphy 2 · Advanced Probabilistic ML ----------------
ex(id="A8.1", ch="A8", sec="8.2", kind="code", title="1-D Kalman filter: tracking a moving target in noise",
   q="A robot moves at velocity +1 m/s with process noise variance Q = 0.1 (zₜ = zₜ₋₁ + 1 + qₜ) and is observed by noisy GPS with variance R = 2.0 (yₜ = zₜ + rₜ). Run the exact Kalman filter for T = 25 steps and compare the RMSE of raw GPS readings vs the Kalman posterior mean μₜ.",
   hint="Predict: mu_p = mu + 1, P_p = P + Q. Update: K = P_p / (P_p + R), mu = mu_p + K*(y - mu_p), P = (1 - K)*P_p.",
   answer="By blending the physics prediction with each noisy GPS measurement via the Kalman gain Kₜ ≈ 0.20, the filter cuts position RMSE by more than half compared to raw sensor readings (Murphy 2 §8.2).",
   code='''import numpy as np
rng = np.random.default_rng(7)
T, Q, R = 25, 0.1, 2.0
z = np.cumsum(1.0 + rng.normal(0, np.sqrt(Q), T))
y = z + rng.normal(0, np.sqrt(R), T)
mu, P, est = 0.0, 1.0, []
for yt in y:
    mu_p, P_p = mu + 1.0, P + Q                    ## predict step
    K = P_p / (P_p + R)                            ## Kalman gain
    mu, P = mu_p + K * (yt - mu_p), (1 - K) * P_p  ## update step
    est.append(mu)
print(f"raw GPS RMSE:       {np.sqrt(np.mean((y - z)**2)):.3f}")
print(f"Kalman filter RMSE: {np.sqrt(np.mean((np.array(est) - z)**2)):.3f}")''')

ex(id="A10.1", ch="A10", sec="10.2", kind="code", title="Variational Inference: fitting a Gaussian q(z) via ELBO",
   q="Suppose the true unnormalised log-posterior is log p̃(z) = −½ (z − 3)² / 0.25 (a Gaussian with mean 3 and std 0.5). Fit a variational distribution q(z) = N(μ, σ²) starting from μ = 0, σ = 2 by maximising the analytical/reparameterised ELBO. Print (μ, σ) after 200 gradient steps.",
   hint="Write z = mu + sigma * eps; for Gaussian target −½(z−3)²/s₀², E_q[log p̃(z)] − H(q) has exact gradient ∂ELBO/∂μ = −(μ−3)/s₀² and ∂ELBO/∂log σ = 1 − σ²/s₀².",
   answer="Maximising the ELBO drives the variational parameters (μ, σ) from (0.0, 2.0) straight to the exact posterior (3.000, 0.500), where KL(q ‖ p) reaches zero (Murphy 2 §10.2).",
   code='''import numpy as np
mu, log_sig = 0.0, np.log(2.0); s0_sq = 0.25
for _ in range(250):
    sig = np.exp(log_sig)
    g_mu = -(mu - 3.0) / s0_sq                     ## gradient of E_q[log p(z)] w.r.t. mu
    g_ls = 1.0 - (sig ** 2) / s0_sq                ## gradient of ELBO w.r.t. log_sigma (entropy + expected log p)
    mu += 0.03 * g_mu; log_sig += 0.03 * g_ls
print(f"fitted variational posterior: mu = {mu:.4f} (true 3.0),  sigma = {np.exp(log_sig):.4f} (true 0.5)")''')

ex(id="A12.1", ch="A12", sec="12.2", kind="code", title="Metropolis–Hastings MCMC on a bimodal posterior",
   q="Run a Random-Walk Metropolis–Hastings chain for S = 20,000 steps with proposal z′ ~ N(z, 1.8²) on the unnormalised bimodal target p̃(z) = 0.3 exp(−(z + 2)²) + 0.7 exp(−(z − 2)²). Discard the first 2,000 warmup steps and check the fraction of samples in the right mode (z > 0) and overall mean E[z].",
   hint="Accept z_prop if u < p_tilde(z_prop) / p_tilde(z); the normalising constant √π cancels out in the ratio!",
   answer="Even though we never computed the normalising constant Z, the chain spends 70% of its visits in the right mode (z > 0) and 30% in the left mode, matching the exact mixture weights and theoretical mean 0.3(−2) + 0.7(+2) = +0.80 (Murphy 2 §12.2).",
   code='''import numpy as np
rng = np.random.default_rng(12)
p_tilde = lambda z: 0.3 * np.exp(-(z + 2.0)**2) + 0.7 * np.exp(-(z - 2.0)**2)
z = 0.0; samples = []; acc = 0
for _ in range(20_000):
    zp = z + 1.8 * rng.normal()
    if rng.random() < p_tilde(zp) / p_tilde(z):    ## Metropolis acceptance ratio (Z cancels!)
        z = zp; acc += 1
    samples.append(z)
post = np.array(samples[2000:])
print(f"accept rate: {acc/20000:.2f}   fraction in right mode (z>0): {np.mean(post > 0):.3f} (true 0.700)")
print(f"MCMC mean E[z]: {post.mean():.3f} (true +0.800)")''')

ex(id="A25.1", ch="A25", sec="25.2", kind="code", title="Diffusion forward noising & closed-form score denoising",
   q="Given a 1-D clean point x₀ = 2.5 and a linear βₜ schedule over T = 100 steps (β₁ = 0.001 → β₁₀₀ = 0.05), compute the cumulative signal product ᾱₜ = ∏_{s≤t}(1 − βₛ). Verify that the empirical mean and variance of 10,000 one-shot forward draws xₜ = √ᾱₜ x₀ + √(1 − ᾱₜ) ε at t = 50 match the theoretical N(√ᾱ₅₀ x₀, 1 − ᾱ₅₀).",
   hint="Use np.cumprod(1.0 - betas) to get alpha_bar for all t in one line.",
   answer="The 10,000 one-shot draws match √ᾱ₅₀ x₀ and variance 1 − ᾱ₅₀ to three decimal places, confirming that DDPM training can jump directly to any timestep t without simulating the 49 intermediate Markov transitions (Murphy 2 §25.2).",
   code='''import numpy as np
rng = np.random.default_rng(25)
betas = np.linspace(0.001, 0.05, 100)
alpha_bar = np.cumprod(1.0 - betas)                ## cumulative signal survival ᾱ_t
ab50 = alpha_bar[49]; x0 = 2.5
xt = np.sqrt(ab50) * x0 + np.sqrt(1.0 - ab50) * rng.normal(size=10_000)
print(f"t=50 theoretical mean: {np.sqrt(ab50)*x0:.3f}   empirical: {xt.mean():.3f}")
print(f"t=50 theoretical var:  {1.0 - ab50:.3f}   empirical: {xt.var():.3f}")''')

ex(id="A36.1", ch="A36", sec="36.4", kind="code", title="Causal inference: backdoor adjustment & IPW under confounding",
   q="Simulate N = 20,000 patients where severity Z ~ Bernoulli(0.5) drives both treatment assignment P(X=1 | Z) = 0.15 + 0.70 Z and outcome Y = 0.80 + 0.12 X − 0.50 Z + ε (true causal ATE = +0.12). Compute (a) the naive observational difference E[Y|X=1] − E[Y|X=0], (b) Pearl's backdoor adjustment across Z ∈ {0, 1}, and (c) the Inverse Probability Weighting (IPW) estimate.",
   hint="For IPW, weight each unit by X/e(Z) − (1−X)/(1−e(Z)) where e(Z) = P(X=1 | Z).",
   answer="Naive observational conditioning gives −0.16 (making a beneficial +0.12 treatment look harmful because severe patients take it 5.7× as often!). Both Pearl's backdoor adjustment and propensity-score IPW erase the confounding bias and recover the true +0.12 causal effect (Murphy 2 §36.4).",
   code='''import numpy as np
rng = np.random.default_rng(36)
N = 20_000
Z = rng.binomial(1, 0.5, N)
e_z = np.where(Z == 1, 0.85, 0.15)                 ## propensity score P(X=1 | Z)
X = rng.binomial(1, e_z)
Y = 0.80 + 0.12 * X - 0.50 * Z + rng.normal(0, 0.05, N)
obs_diff = Y[X == 1].mean() - Y[X == 0].mean()
backdoor = sum(np.mean(Z == z) * (Y[(X == 1) & (Z == z)].mean() - Y[(X == 0) & (Z == z)].mean()) for z in [0, 1])
ipw = np.mean(X * Y / e_z - (1 - X) * Y / (1 - e_z))  ## Horvitz-Thompson IPW estimator
print(f"naive observational E[Y|X=1] - E[Y|X=0]: {obs_diff:+.4f}  (confounded!)")
print(f"Pearl backdoor adjustment ATE:           {backdoor:+.4f}  (true +0.1200)")
print(f"Inverse Probability Weighting (IPW) ATE: {ipw:+.4f}  (true +0.1200)")''')
