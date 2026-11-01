/* ================= chapter intros and section explanations (written so far: Murphy 1, ch. 1–8) ================= */
const CHI = {
M1: { why: "Before any maths: what does it mean for a computer to 'learn'? You choose a function with adjustable knobs, and data sets the knobs. This chapter names the three settings (supervised, unsupervised, reinforcement) and the central danger, overfitting. Everything after this is a precise version of one of these ideas.", builds: "nothing", sims: ["m1fit", "s1"] },
M2: { why: "Machine learning predictions are uncertain, so we need a language for uncertainty. This chapter builds it for one quantity at a time: what a probability is, Bayes' rule for updating beliefs, and the handful of distributions (coin, die, bell curve) that almost every model's output is made of.", builds: "ch. 1, school algebra", sims: ["m2bayes", "m2monty", "m2dist", "m2clt"] },
M3: { why: "Real data has many numbers per example that move together. This chapter extends chapter 2 to several variables: covariance, the multivariate Gaussian (a tilted bell), conditioning, and mixtures. It's the shape behind PCA, Gaussian classifiers and Kalman filters.", builds: "ch. 2", sims: ["m3gauss"] },
M4: { why: "Given data, how do you choose the knobs? This chapter is the bridge from probability to learning: maximum likelihood (pick knobs that make the data least surprising), regularisation (don't believe tiny datasets), the Bayesian view (keep a distribution over knobs), and the frequentist view (how much would my answer change with new data?).", builds: "ch. 2–3", sims: ["m4coin", "m1fit", "m4boot"] },
M5: { why: "A probability isn't an action. This chapter turns beliefs into decisions when mistakes have different costs, and asks how to choose between models fairly (cross-validation, Bayesian model selection, hypothesis tests).", builds: "ch. 2, 4", sims: ["m5roc", "m1fit", "m4boot"] },
M6: { why: "How do you measure information or surprise in bits? Entropy, cross-entropy and KL divergence. The loss you minimise for almost every classifier and language model is a cross-entropy, and this chapter explains why that's the right thing to minimise.", builds: "ch. 2", sims: ["m6info", "s2"] },
M7: { why: "The bookkeeping language for everything else. A matrix is a whole layer of neurons, a dataset, a covariance or a transformation of space. Eigenvectors and SVD find the directions a matrix cares about; matrix calculus gives gradients of whole layers at once.", builds: "school algebra", sims: ["m7mat", "s6", "s4"] },
M8: { why: "Every learning problem ends as 'minimise this function'. This chapter covers how: gradient descent and its fixes (momentum, Newton, Adam), stochastic gradients on minibatches, constraints, and EM.", builds: "ch. 7 (gradients)", sims: ["m8opt", "s3"] }
};
const SEC = {
"M1.1": { t: "Mitchell's definition: a program learns if its performance at a task improves with experience. In practice that means fitting a function f(x; θ) with knobs θ to examples.", eq: ["f(x; θ) ≈ y", "a function with knobs θ, set so its outputs match the examples"] },
"M1.2": { t: "Learning from labelled pairs (x, y). Classification predicts a category; regression predicts a number. The training loss measures error on the data you have, but the goal is error on data you haven't seen. Overfitting is the gap between the two. 'No free lunch' says no single model is best for every problem, so assumptions are unavoidable.", eq: ["L(θ) = (1/N) Σₙ ℓ(yₙ, f(xₙ; θ))", "average mistake over the training set. Small training loss doesn't guarantee small test loss"], sim: "m1fit", also: ["s1"], ex: "Fitting a degree-9 polynomial to N = 10 noisy points on a curve gives training MSE = 0.00 (passes through every point) but test MSE = 4.8, whereas a degree-2 quadratic gives training MSE = 0.04 and test MSE = 0.05.", code: "# Polynomial regression train vs test MSE:\nw = np.polyfit(x_train, y_train, deg=3)\nmse_test = np.mean((y_test - np.polyval(w, x_test)) ** 2)" },
"M1.3": { t: "No labels, only x. Find structure: clusters, a few hidden 'factors of variation', or labels you make up yourself (self-supervised: hide part of the input and predict it). Your autoencoder is unsupervised: the image is its own target.", eq: ["p(x) or x ≈ dec(enc(x))", "model the data itself, not a label"], also: ["s7", "s8"] },
"M1.4": { t: "Learning by acting and getting rewards, with no correct answer given for each step. Mentioned here, covered in Murphy 2 ch. 35 and D2L ch. 17.", eq: ["maximise E[Σₜ γᵗ rₜ]", "maximise the total discounted reward you collect"] },
"M1.5": { t: "Where data comes from and how it's prepared: standard image and text datasets, one-hot encoding of categories, turning text into tokens or bag-of-words counts, and what to do with missing values.", eq: ["one-hot(c) = [0, …, 1, …, 0]", "a category becomes a vector with a single 1, so a weighted sum can use it"] },
"M1.6": { t: "How ML relates to statistics, AI and data mining, and a map of the rest of the book. Read it once for orientation." },
"M2.1": { t: "Probability as a degree of belief (Bayesian) or as a long-run frequency (frequentist). Two kinds of uncertainty: epistemic (you lack knowledge; more data helps) and aleatoric (the world is noisy; more data won't remove it). Probability is logic extended to 'how likely' instead of only true/false.", eq: ["p(A ∨ B) = p(A) + p(B) − p(A ∧ B)", "add the chances, then remove the overlap you counted twice"] },
"M2.2": { t: "A random variable is a quantity whose value is uncertain. Discrete ones have a probability for each value (pmf); continuous ones have a density whose area gives probability (pdf). Independence means knowing one tells you nothing about the other. Mean and variance summarise a distribution, but §2.2.6 shows datasets with identical summaries that look completely different.", eq: ["E[X] = Σₓ x p(x),  Var[X] = E[(X − E[X])²]", "the balance point, and the average squared distance from it"], sim: "m2dist" },
"M2.3": { t: "How to update a belief after seeing evidence. The COVID-test example shows why a positive test for a rare disease is often a false alarm. Monty Hall shows that what the host chooses to reveal is itself evidence. 'Inverse problems' means reasoning from effects back to causes.", eq: ["p(H | Y) = p(Y | H) p(H) / p(Y)", "belief after = how well H explains Y × belief before, rescaled so beliefs sum to 1. The bottom is the total chance of seeing Y by any route"], sim: "m2bayes", also: ["m2monty"], ex: "If a disease affects 1% of people (p(H=1) = 0.01) and a test has 99% sensitivity and 5% false-positive rate, then P(H=1 | +) = (0.99×0.01) / (0.99×0.01 + 0.05×0.99) = 0.0099 / 0.0594 = 16.7%." },
"M2.4": { t: "The coin: one outcome with probability θ (Bernoulli), or the count of heads in N flips (binomial). To let θ depend on an input, squash a score into (0, 1) with the sigmoid. That gives binary logistic regression, which is exactly station 1's neuron.", eq: ["Ber(y | θ) = θʸ (1 − θ)¹⁻ʸ,  θ = σ(wᵀx + b)", "a coin whose bias is set by a neuron"], sim: "m2dist", also: ["s1"] },
"M2.5": { t: "The die: one of C outcomes. Softmax turns C scores into C probabilities. The log-sum-exp trick (§2.5.4) subtracts the largest score before exponentiating, so e^1000 doesn't overflow; the answer is unchanged.", eq: ["softmax(a)_c = e^{a_c} / Σ_c′ e^{a_c′}", "make every score positive with exp, then divide so they sum to 1"], sim: "m2dist", code: "# Numerically stable log-sum-exp and softmax:\nm = np.max(a, axis=-1, keepdims=True)\nlse = m + np.log(np.sum(np.exp(a - m), axis=-1, keepdims=True))\nprobs = np.exp(a - lse)" },
"M2.6": { t: "The bell curve. The CDF gives P(X ≤ x); the pdf is its slope. Using a Gaussian for the noise in regression is what makes squared error the right loss. It's everywhere because it has the most uncertainty for a given mean and variance, and because of the central limit theorem.", eq: ["N(x | μ, σ²) = (1 / √(2πσ²)) exp(−(x − μ)² / 2σ²)", "penalty grows with squared distance from μ in units of σ; the front factor makes the area 1"], sim: "m2dist", also: ["m2clt"] },
"M2.7": { t: "Other shapes you'll meet: Student t and Cauchy (heavy tails, robust to outliers), Laplace (absolute-value penalty, gives lasso), Beta (a distribution over probabilities), Gamma (positive numbers), and the empirical distribution (just your data points).", sim: "m2dist" },
"M2.8": { t: "If y = f(x), what's the distribution of y? For an invertible f, you rescale by how much f stretches space (the Jacobian). Adding independent variables convolves their distributions, and averaging many of them gives a Gaussian: the central limit theorem. Monte Carlo approximates any average by sampling.", eq: ["p_y(y) = p_x(f⁻¹(y)) · |d f⁻¹/dy|", "probability is conserved: where f squeezes space, density piles up"], sim: "m2clt" },
"M3.1": { t: "Two variables at once. Covariance measures whether they rise and fall together; correlation is covariance rescaled to −1…+1. Two warnings with examples: zero correlation doesn't mean independent, and correlation doesn't mean causation. Simpson's paradox shows a trend can reverse when you split the data into groups.", eq: ["Cov[X, Y] = E[(X − E X)(Y − E Y)],  ρ = Cov / (σ_X σ_Y)", "average product of deviations: positive if both tend to be above their means together"], sim: "m3gauss" },
"M3.2": { t: "The bell curve in D dimensions, shaped by a mean vector μ and a covariance matrix Σ. The Mahalanobis distance measures distance in units of the spread along each direction. Conditioning on some coordinates gives another Gaussian over the rest, with a shifted mean and smaller variance. That's also how missing values can be filled in.", eq: ["N(x | μ, Σ) ∝ exp(−½ (x − μ)ᵀ Σ⁻¹ (x − μ))", "(x−μ)ᵀΣ⁻¹(x−μ) is squared distance after undoing the stretch and tilt of Σ"], sim: "m3gauss", ex: "For a 2D unit-variance Gaussian with μ = [0, 0] and correlation ρ = 0.8, observing x₂ = 2.0 shifts the conditional mean of x₁ to μ_{1|2} = 0 + 0.8(2.0) = 1.6 and shrinks its variance from 1.0 to 1 − 0.8² = 0.36.", code: "# Conditional Gaussian p(x1 | x2) from block covariance:\nmu_1g2 = mu1 + S12 @ np.linalg.solve(S22, x2 - mu2)\nS_1g2 = S11 - S12 @ np.linalg.solve(S22, S21)" },
"M3.3": { t: "If a hidden x is Gaussian and you observe y = Ax + b + Gaussian noise, the posterior over x is Gaussian too, with a formula. Used for sensor fusion (combining two noisy measurements) and as the core of the Kalman filter.", eq: ["posterior precision = prior precision + Aᵀ (noise precision) A", "information adds: each measurement makes you more certain"] },
"M3.4": { t: "Gaussian, Bernoulli, categorical, Poisson, Beta and Gamma are all one family with one formula. That's why their maximum-likelihood gradients all come out as 'observed minus expected'. It's also the most spread-out distribution that matches given averages.", eq: ["p(x | η) = h(x) exp(ηᵀ T(x) − A(η))", "one template; each distribution is a choice of T and h. A(η) makes it sum to 1"] },
"M3.5": { t: "Build a complicated distribution by first picking one of K simple ones (with probabilities π), then sampling from it. A Gaussian mixture can make any lumpy shape; it's the model behind soft clustering (ch. 21).", eq: ["p(x) = Σₖ πₖ N(x | μₖ, Σₖ)", "a weighted sum of bells"], sim: "m3gauss" },
"M3.6": { t: "Draw which variables directly depend on which as a graph; the joint distribution factorises along the graph. Murphy 2 ch. 4 goes deep on this.", eq: ["p(x₁…x_D) = Π p(x_d | parents(x_d))", "a big table replaced by small local ones"] },
"M4.1": { t: "Learning = estimating parameters θ from data D. This chapter compares the ways of doing that." },
"M4.2": { t: "Choose the θ under which the observed data is most probable. For independent examples the probabilities multiply; take logs to get a sum. Worked examples: the MLE of a coin's bias is heads/flips; a Gaussian's is the sample mean and variance; linear regression's is least squares. §4.2.2 shows MLE also minimises KL from the data's distribution to the model.", eq: ["θ̂ = argmax_θ Σₙ log p(yₙ | xₙ, θ)", "sum of log-probabilities of what actually happened. Maximising it is the same as minimising the negative log-likelihood loss"], sim: "m4coin", also: ["s2"] },
"M4.3": { t: "Generalise MLE: minimise the average of any loss. The loss you care about (misclassification) often has no slope, so you minimise a smooth 'surrogate' (log loss, hinge) that tracks it.", eq: ["R(θ) = (1/N) Σ ℓ(yₙ, f(xₙ; θ))", "empirical risk: average loss on the data"], also: ["s2", "m1fit"] },
"M4.4": { t: "Alternatives to MLE: the method of moments (match the data's mean and variance) and online estimation (update the estimate one example at a time, e.g. a running average).", eq: ["μₜ = μₜ₋₁ + (xₜ − μₜ₋₁)/t", "a running mean: nudge the estimate toward each new point by 1/t"] },
"M4.5": { t: "MLE trusts the data completely, so with little data it overfits (one coin flip of heads gives θ̂ = 1). Regularisation adds a penalty or prior. MAP estimation, weight decay, validation sets, cross-validation, early stopping and simply collecting more data are all ways to control it.", eq: ["θ̂ = argmin [NLL(θ) + λ ‖θ‖²]", "fit the data, but pay for big knobs. λ sets the price; pick it on held-out data"], sim: "m1fit", also: ["m4coin"] },
"M4.6": { t: "Keep a whole distribution over θ instead of one value. With a conjugate prior the posterior has the same form as the prior (beta + coin flips = beta). Credible intervals read straight off the posterior. Predictions average over every plausible θ, which handles uncertainty properly. The hard part is computing it (§4.6.8).", eq: ["p(θ | D) ∝ p(D | θ) p(θ)", "posterior ∝ likelihood × prior. For a coin with a Beta(a, b) prior: Beta(a + heads, b + tails)"], sim: "m4coin", ex: "With a Beta(2, 2) prior (1 virtual head, 1 virtual tail) and N = 4 flips yielding 4 heads, MLE predicts θ̂_MLE = 4/4 = 1.00 (tails impossible!), whereas the Bayesian posterior is Beta(6, 2) with posterior predictive mean E[θ|D] = 6/8 = 0.75.", code: "# Beta-Binomial conjugate update & 95% bootstrap CI:\npost_a, post_b = prior_a + heads, prior_b + tails\npost_mean = post_a / (post_a + post_b)" },
"M4.7": { t: "The other view: θ is fixed, the data is random. If you reran the experiment, how much would your estimate move? That spread is the sampling distribution. Its width (standard error) can be approximated with a Gaussian or by the bootstrap. A 95% confidence interval is not a 95% probability that θ is inside it. The bias–variance trade-off splits error into 'systematically off' and 'jumpy'.", eq: ["MSE = bias² + variance", "an estimator can be wrong on average (bias) or unstable across datasets (variance); total error is both"], sim: "m4boot", also: ["m1fit"] },
"M5.1": { t: "Pick the action with the lowest expected loss under your beliefs. For classification with unequal costs that gives a threshold. ROC curves show every threshold's trade-off between catching positives and false alarms; precision–recall curves are better when positives are rare.", eq: ["a* = argmin_a Σ_y ℓ(y, a) p(y | x)", "for each action, weight each possible truth's cost by its probability; take the cheapest"], sim: "m5roc", ex: "If missing a tumour (FN) costs c_FN = 9 and a false alarm biopsy (FP) costs c_FP = 1, the Bayes optimal decision rule predicts positive whenever P(y = 1 | x) ≥ c_FP / (c_FP + c_FN) = 1 / (1 + 9) = 0.10.", code: "# Bayes optimal decision under cost matrix C (C[true, pred]):\nexpected_cost = probs @ C\naction = np.argmin(expected_cost, axis=-1)" },
"M5.2": { t: "Choosing between models. Bayesian model selection compares how well each model predicted the data before fitting (the marginal likelihood), which automatically penalises needless complexity: Occam's razor. Information criteria (AIC, BIC) approximate this with 'fit minus a penalty per parameter'.", eq: ["p(D | m) = ∫ p(D | θ, m) p(θ | m) dθ", "average fit over all knob settings the model allows. Flexible models spread their bets thin and score lower"], also: ["m1fit"] },
"M5.3": { t: "Judge an estimator by its average loss over hypothetical datasets (its risk). Consistent estimators converge to the truth with infinite data; admissible ones aren't beaten everywhere by another.", eq: ["R(θ, δ) = E_{D~θ}[ℓ(θ, δ(D))]", "risk: expected loss of the estimator δ if θ were the truth"], also: ["m4boot"] },
"M5.4": { t: "Back to minimising training loss, and why it's not enough. Structural risk adds a complexity penalty; cross-validation estimates test error directly by holding data out; learning theory bounds the gap between train and test error.", eq: ["test error ≤ train error + complexity term", "the shape of every generalisation bound"], sim: "m1fit" },
"M5.5": { t: "Classical hypothesis testing: likelihood ratio tests, type I and II errors, p-values, and why p-values are so often misread (a p-value isn't the probability the hypothesis is true).", eq: ["p-value = P(statistic at least this extreme | H₀ true)", "how surprising the data would be if nothing were going on"], also: ["m4boot"] },
"M6.1": { t: "Entropy is average surprise, where an outcome's surprise is −log p. Cross-entropy is the average surprise when you use a model q but outcomes come from p; it's the classification loss. Joint and conditional entropy extend this to pairs. Perplexity is 2^entropy, the 'effective number of choices'.", eq: ["H(p) = −Σ p(x) log₂ p(x)", "average number of yes/no questions needed to identify the outcome"], sim: "m6info", also: ["s2"], ex: "For a 4-outcome weather distribution p = [0.5, 0.25, 0.125, 0.125], the entropy is H(p) = 0.5(1) + 0.25(2) + 2×0.125(3) = 1.75 bits (perplexity 2^{1.75} ≈ 3.36, less than 2 bits for a uniform 4-sided die)." },
"M6.2": { t: "KL divergence measures how different q is from p: the extra bits from using q's code for p's data. It's never negative and is zero only when q = p. Minimising KL from the data to a model is the same as maximum likelihood. Forward and reverse KL behave differently: one covers all modes, the other picks one.", eq: ["KL(p ‖ q) = Σ p(x) log (p(x) / q(x))", "cross-entropy minus entropy"], sim: "m6info", code: "# Entropy, cross-entropy, and KL divergence (in nats):\nH_p = -np.sum(p * np.log(p + 1e-12))\nH_pq = -np.sum(p * np.log(q + 1e-12))\nkl_pq = H_pq - H_p" },
"M6.3": { t: "Mutual information: how much knowing X reduces your uncertainty about Y. Zero if and only if they're independent, so it catches dependence that correlation misses. The data processing inequality says processing can't create information about the source.", eq: ["I(X; Y) = H(Y) − H(Y | X)", "uncertainty about Y before, minus uncertainty left after seeing X"], sim: "m6info" },
"M7.1": { t: "Notation and basic objects: vectors, matrices, vector spaces, norms (ways to measure size, such as ‖x‖₂ and ‖x‖₁), rank, trace, determinant, and special matrices (symmetric, orthogonal, positive definite).", eq: ["‖x‖₂ = √(Σ xᵢ²),  ‖x‖₁ = Σ |xᵢ|", "straight-line length and city-block length"], sim: "m7mat" },
"M7.2": { t: "The dot product measures overlap; a matrix–vector product is many dot products (one layer of neurons); a matrix–matrix product chains transformations. §7.2.4 shows centring and scaling a data matrix with matrix products; einsum is a compact way to write any of these.", eq: ["(AB)ᵢⱼ = Σₖ Aᵢₖ Bₖⱼ", "row i of A dotted with column j of B"], sim: "m7mat", also: ["s6"] },
"M7.3": { t: "The inverse undoes a matrix, when it can (det ≠ 0). Schur complements, the matrix inversion lemma and the determinant lemma are tools for inverting big structured matrices cheaply; §7.3.5 uses them to derive the Gaussian conditional of §3.2.", eq: ["A⁻¹A = I", "do A, then A⁻¹, and nothing has changed"], sim: "m7mat" },
"M7.4": { t: "Eigenvectors are directions a matrix only stretches, never turns; eigenvalues are the stretch factors. Symmetric matrices (like covariances) have perpendicular eigenvectors, which gives the axes of a Gaussian, whitening, and the power method for finding the top eigenvector (used in station 7's PCA).", eq: ["A v = λ v", "applying A to v gives back v, scaled by λ"], sim: "m7mat", also: ["m3gauss"] },
"M7.5": { t: "Any matrix is a rotation, then a stretch along the axes, then another rotation. The stretch factors are the singular values. SVD gives the pseudo-inverse, the matrix's range and null space, and the best low-rank approximation (truncated SVD = PCA).", eq: ["A = U Σ Vᵀ", "rotate (Vᵀ), stretch (Σ), rotate (U)"], sim: "m7mat", ex: "If a matrix A has singular values σ₁ = 10, σ₂ = 2, σ₃ = 1, its squared Frobenius norm is 10² + 2² + 1² = 105, and its rank-1 SVD approximation σ₁ u₁ v₁ᵀ captures 100 / 105 = 95.2% of the total energy.", code: "# Rank-k truncated SVD reconstruction:\nU, s, Vt = np.linalg.svd(A, full_matrices=False)\nA_k = (U[:, :k] * s[:k]) @ Vt[:k, :]" },
"M7.6": { t: "Other ways to factor a matrix: LU (for solving equations), QR (orthogonal × triangular, used for stable least squares) and Cholesky (a 'square root' of a positive definite matrix, used to sample Gaussians).", eq: ["Σ = L Lᵀ, x = μ + L z", "to sample N(μ, Σ), stretch standard normal noise z by Cholesky's L"] },
"M7.7": { t: "Solving Ax = b: exactly when A is square, the smallest solution when there are more unknowns than equations, and least squares when there are more equations than unknowns.", eq: ["x̂ = (AᵀA)⁻¹ Aᵀ b", "least squares: the x whose Ax is closest to b"], also: ["m1fit"] },
"M7.8": { t: "Derivatives for vectors and matrices. The gradient collects all partial derivatives; the Jacobian does it for a vector output; the Hessian holds second derivatives (curvature). §7.8.7 lists the gradients you'll use most.", eq: ["∇ₓ (aᵀx) = a,  ∇ₓ (xᵀAx) = (A + Aᵀ) x", "the school rules d(ax)/dx = a and d(ax²)/dx = 2ax, for vectors"], also: ["s4", "s3"] },
"M8.1": { t: "Kinds of optimisation problem: local vs global minima, with or without constraints, convex (one bowl, any minimum is the global one) vs non-convex (neural nets), smooth vs with corners (like |x|).", eq: ["θ* = argmin_θ L(θ)", "find the knobs with the lowest loss"], sim: "m8opt" },
"M8.2": { t: "Use only the slope. Step downhill; choose the step size carefully (too big diverges, too small crawls). Convergence speed depends on how stretched the valley is (the condition number). Momentum remembers past steps and runs along narrow valleys instead of bouncing across them.", eq: ["θ ← θ − η ∇L;  momentum: v ← βv + ∇L, θ ← θ − ηv", "step against the slope; with momentum, keep a fraction β of the previous velocity"], sim: "m8opt", also: ["s3"], ex: "On a narrow quadratic valley L(w₁, w₂) = ½(w₁² + 25 w₂²), the condition number is κ = 25/1 = 25; plain gradient descent diverges if η > 2/25 = 0.08, whereas momentum damps the w₂ oscillations while accelerating along w₁." },
"M8.3": { t: "Also use the curvature. Newton's method jumps to the bottom of the local quadratic bowl in one step; BFGS approximates the curvature cheaply; trust regions limit how far you trust the local model.", eq: ["θ ← θ − H⁻¹ ∇L", "divide the slope by the curvature: big steps where it's flat, small where it's sharp"], sim: "m8opt" },
"M8.4": { t: "When the loss is a sum over millions of examples, estimate the gradient from a random minibatch. It's noisy but cheap and unbiased. Step-size schedules, averaging the iterates, variance reduction and preconditioning (Adam, RMSProp, AdaGrad) make it work well.", eq: ["θ ← θ − ηₜ (1/B) Σ_{n∈batch} ∇ℓₙ(θ)", "a minibatch's average slope estimates the full slope; its noise shrinks like 1/√B (the CLT lab)"], sim: "m8opt", also: ["m2clt"] },
"M8.5": { t: "Minimise subject to constraints. Lagrange multipliers turn a constraint into an extra term; the KKT conditions say when you're at a constrained optimum. Linear and quadratic programs are standard special cases (the SVM is a quadratic program).", eq: ["L(θ, λ) = f(θ) + λ g(θ)", "at the optimum, the loss's slope is balanced by the constraint's push"] },
"M8.6": { t: "For losses with a non-smooth part (like ‖θ‖₁), take a gradient step on the smooth part, then apply a 'proximal' fix-up. For the ℓ₁ penalty the fix-up is soft thresholding, which sets small weights to exactly zero. Projected gradient descent is the special case for constraints.", eq: ["prox(θ) = sign(θ) · max(|θ| − λη, 0)", "shrink every weight toward zero; the ones that cross zero stay at zero"], code: "# Proximal gradient (ISTA) step for L1-regularised least squares:\nw_half = w - lr * (X.T @ (X @ w - y)) / len(y)\nw = np.sign(w_half) * np.maximum(np.abs(w_half) - lr * lam, 0.0)" },
"M8.7": { t: "Minimise a hard function by repeatedly minimising an easy upper bound that touches it at the current point. EM is the famous case: guess which cluster each point belongs to (E step), refit the clusters (M step), repeat. The loss never goes up.", eq: ["θₜ₊₁ = argmin Q(θ | θₜ),  Q ≥ L, touching at θₜ", "each step can only go down, because you minimise a ceiling that touches the floor"], also: ["m3gauss"] },
"M8.8": { t: "When you can't get gradients at all (a simulator, hyperparameters): grid and random search, Bayesian optimisation, evolution strategies.", eq: ["try θ, observe L(θ), choose the next θ", "search by asking questions, no slopes"] }
};

/* ================= book / chapter / section navigation ================= */
let TOC = null;   /* filled from the embedded JSON below */
const BOOKN = { M: "Murphy 1 · Introduction", D: "Dive into Deep Learning", A: "Murphy 2 · Advanced Topics" };
let curChap = null, labOwner = null;
function chapters(b) { return TOC[b].filter(x => !x[0].includes(".")); }
function chInfo(b, n) { return CH.find(c => c[0] === b && c[1] === +n); }
function chapterKey(b, n) { return b + n; }

function goChapter(key, sectionNum) {
  const b = key[0], n = key.slice(1), ch = chapters(b).find(x => x[0] === n); if (!ch) return go("s1");
  curChap = key; setMode("course"); $("#conceptview").hidden = true; $("#back-bar").hidden = true;
  $("#crumb").innerHTML = `<span class="spine s${b}"></span><span class="ct"><small>${esc(BOOKN[b].split(" · ")[0])} · chapter ${n} of ${chapters(b).length}</small><b>${esc(ch[1].replace(/\s*\*$/, ""))}</b></span><i aria-hidden="true">▾</i>`;
  $$("[data-station]").forEach(s => s.hidden = true); $("#chapview").hidden = false;
  renderChapter(b, n, ch);
  const info = CHI[key] || {}, old = chInfo(b, n), sims = (info.sims && info.sims.length) ? info.sims : (old ? old[6] : []);
  if (cur && cur.exit) cur.exit();
  const firstLab = (sims || []).find(x => ST[x] && ST[x].isLab);
  if (firstLab) startSim(firstLab, false); else startSkyline(b, n);
  if (location.hash !== "#" + key) history.replaceState(null, "", "#" + key);
  try { localStorage.setItem("nvl-where", key); } catch (e) { }
  $("#panel").scrollTop = 0;
  if (sectionNum) setTimeout(() => { const el = document.getElementById("sec-" + sectionNum.replace(/\./g, "-")); if (el) { el.open = true; el.scrollIntoView({ block: "start" }); } }, 30);
}
function startSim(id, scroll = true) {
  const s = ST[id]; if (!s) return;
  if (cur && cur !== s && cur.exit) cur.exit();
  if (!s.isLab) { goStation(id, curChap); return; }
  cur = s; cur.id = id; labOwner = curChap;
  if (!s._inited) { s.init && s.init(); s._inited = true; }
  renderLab(s); $("#legend").innerHTML = s.legend ? s.legend() : ""; flyTo(s.cam[0], s.cam[1]);
  $$("#chapview [data-sim]").forEach(b => b.setAttribute("aria-pressed", b.dataset.sim === id));
  if (scroll) $("#lab").scrollIntoView({ block: "start", behavior: "smooth" });
}
function startSkyline(b, n) { const s = ST.sky; s.b = b; s.n = n; s.secs = TOC[b].filter(x => x[0].split(".")[0] === n && x[0].split(".").length === 2); cur = s; cur.id = "sky"; $("#lab").hidden = true; $("#legend").innerHTML = s.legend(); flyTo(s.cam[0], s.cam[1]); }
ST.sky = {
  tab: "Contents", cam: [[0, 12, 18], [0, 1.5, 0]],
  legend() { return `<b>${esc(BOOKN[this.b] || "")} · ch. ${this.n}</b><div class="row"><span>one tower per section · height = pages</span><span><i class="sw" style="background:var(--c3)"></i>explained</span><span><i class="sw" style="background:var(--c5)"></i>not yet</span></div>`; },
  draw() { const s = this.secs || [], n = s.length, all = TOC[this.b]; s.forEach((x, i) => { const nx = all[all.indexOf(x) + 1], pages = nx ? Math.max(1, nx[2] - x[2]) : 4, xx = (i - (n - 1) / 2) * 1.5, h = Math.min(pages * 0.35, 7) + 0.1, done = !!SEC[this.b + x[0]]; V.box(xx, 0, 0, 1.1, h, 1.1, done ? C.c3 : C.c5, { sec: x[0] }); pin(xx, h + 0.4, 0, "§" + x[0], ""); }); },
  onPick(t) { if (t && t.sec) { const el = document.getElementById("sec-" + t.sec.replace(/\./g, "-")); if (el) { el.open = true; el.scrollIntoView({ block: "start", behavior: "smooth" }); } } },
  onHover(t) { if (t && t.sec) { const x = TOC[this.b].find(y => y[0] === t.sec); return `§${x[0]} ${x[1]}\np. ${x[2]} · tap to open`; } },
  state() { return `contents view of ${BOOKN[this.b]} chapter ${this.n}`; }
};

function stepChapter(d) { const b = curChap ? curChap[0] : "M", list = chapters(b), i = list.findIndex(c => b + c[0] === curChap), j = clamp(i + d, 0, list.length - 1); goChapter(b + list[j][0]); }

const SUBS = {};
function renderChapter(b, n, ch) {
  const key = b + n, info = CHI[key], old = chInfo(b, n), rows = TOC[b].filter(x => x[0].split(".")[0] === n && x[0].includes(".")), secs = rows.filter(x => x[0].split(".").length === 2);
  const sims = (info && info.sims && info.sims.length) ? info.sims : old ? old[6] : [], explained = secs.filter(s => SEC[b + s[0]]).length;
  const why = info ? info.why : old ? old[5] : "This chapter's sections are listed below. Explanations and labs are coming in a later pass; you can already ask about any section.";
  const nonExSecs = secs.filter(x => !/^(Exercises|Summary)$/.test(x[1].trim()));
  const exCount = secs.filter(s => SEC[b + s[0]] && SEC[b + s[0]].ex).length;
  const codeCount = secs.filter(s => SEC[b + s[0]] && SEC[b + s[0]].code).length;
  const liveCount = secs.reduce((acc, s) => acc + ((LIVE_SEC[b + s[0]] || []).length), 0);
  const status = explained ? `<span class="pill ok">${explained} of ${nonExSecs.length} sections explained</span>` : (!nonExSecs.length && info) ? `<span class="pill ok">chapter overview explained</span>` : `<span class="pill">sections listed · explanations coming</span>`;
  const eqs = [...((info && info.eqs) || []), ...((old && old[7]) || []).filter(e => e[0] !== "—")];
  const seenEq = new Set(eqs.map(e => e[0]));
  for (const s of secs) { const se = SEC[b + s[0]]; if (se && se.eq && !seenEq.has(se.eq[0]) && eqs.length < 4) { eqs.push(se.eq); seenEq.add(se.eq[0]); } }
  const v = $("#chapview");
  v.innerHTML = `<div><p class="eyebrow">${esc(BOOKN[b])} · chapter ${n} · p. ${ch[2]}</p><h2>${esc(ch[1].replace(/\s*\*$/, ""))}</h2>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px">${status}${sims.length ? `<span class="pill">${sims.length} lab${sims.length > 1 ? "s" : ""}</span>` : ""}${liveCount ? `<span class="pill">${liveCount} live eq${liveCount > 1 ? "s" : ""}</span>` : ""}${exCount ? `<span class="pill">${exCount} worked ex</span>` : ""}${codeCount ? `<span class="pill">${codeCount} code</span>` : ""}${/\*$/.test(ch[1]) ? `<span class="pill">* advanced chapter</span>` : ""}</div>
    <p class="lede"><b>Why this chapter exists.</b> ${esc(why)}</p>${info ? `<p class="note">Builds on: ${esc(info.builds)}.</p>` : ""}
    ${eqs.length ? `<div class="block" style="margin-top:12px"><h3>The key equations, in words</h3>${eqs.map(([e, w]) => `<div class="eq" style="font-size:15px;padding:6px 10px;margin-top:6px">${esc(e)}</div><p class="note" style="margin:4px 0 0;color:var(--ink)">${esc(w)}</p>`).join("")}</div>` : ""}</div>
    ${sims.length ? `<div class="block"><h3>Labs for this chapter</h3><div class="btns" style="margin:0">${sims.map(s => `<button type="button" class="btn" data-sim="${s}" aria-pressed="false">${esc(ST[s].isLab ? ST[s].tab : "Station " + s.slice(1) + ": " + ST[s].tab)}</button>`).join("")}</div></div>` : ""}
    <div class="block" id="lab" hidden></div>
    ${secs.length ? `<div><div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 8px"><h3 style="font:700 18px var(--f-display);margin:0">Sections</h3><button type="button" class="btn small" data-expand-all>Expand all</button></div><div class="secs">${secs.map(s => secCard(b, s, rows)).join("")}</div></div>` : ""}
    ${quizHTML(key)}
    <div class="block ask" id="chap-ask"></div>
    <div class="btns" style="justify-content:space-between"><button class="btn" type="button" data-step="-1">← Previous chapter</button><button class="btn primary" type="button" data-step="1">Next chapter →</button></div>`;
  bindQuiz(v);
  const expBtn = v.querySelector("[data-expand-all]");
  if (expBtn) expBtn.onclick = () => {
    const details = [...v.querySelectorAll("details.sec:not(.ex)")];
    const anyClosed = details.some(d => !d.open);
    details.forEach(d => { d.open = anyClosed; });
    expBtn.textContent = anyClosed ? "Collapse all" : "Expand all";
  };
  v.querySelectorAll("[data-sim]").forEach(x => x.onclick = () => startSim(x.dataset.sim));
  v.querySelectorAll("details.sec").forEach(d => d.addEventListener("toggle", () => {
    if (!d.open || d.dataset.ai) return; d.dataset.ai = 1; bindLive(d); if (typeof bindCopy === "function") bindCopy(d);
    const slot = d.querySelector(".sec-ai"); if (!slot) return; const sn = slot.dataset.s, sx = rows.find(r => r[0] === sn), subs = rows.filter(r => r[0].startsWith(sn + ".")), e = SEC[b + sn];
    explainButton(slot, b + sn, () => `${EASY_RULES}\n\nBook: ${BOOKN[b]}, chapter ${n} "${ch[1]}", section §${sn} "${sx[1]}" (p. ${sx[2]}). Subsections: ${subs.map(x => x[0] + " " + x[1]).join("; ") || "none"}.${e ? " Short summary already on the site: " + e.t : ""} Explain what this section is trying to do and its key ideas and equations, from the ground up.`, e ? "Explain more simply (AI)" : "Explain this section simply (AI)");
  }));
  v.querySelectorAll("[data-step]").forEach(x => x.onclick = () => stepChapter(+x.dataset.step));
  v.querySelectorAll("[data-ask]").forEach(x => x.onclick = () => {
    chapAskSection = x.dataset.ask;
    const row = rows.find(r => r[0] === x.dataset.ask);
    const ta = $("#chap-ask textarea"); $("#chap-ask").scrollIntoView({ block: "center", behavior: "smooth" });
    if (ta) { ta.value = `Explain §${x.dataset.ask}${row ? ' "' + row[1].replace(/\s*\*\s*$/, "") + '"' : ""} from first principles: what problem is it solving, how does a concrete numerical example work, and what do its equations mean?`; ta.focus(); }
  });
  chapAskSection = null;
  makeAsk($("#chap-ask"), () => {
    const s = chapAskSection ? rows.find(r => r[0] === chapAskSection) : null, subs = s ? rows.filter(r => r[0].startsWith(s[0] + ".")) : [], e = s ? (SEC[b + s[0]] || SEC[b + s[0].split(".").slice(0, 2).join(".")]) : null;
    return `He is reading ${BOOKN[b]}, chapter ${n} "${ch[1]}". ${s ? `Section §${s[0]} "${s[1]}" (p. ${s[2]}). Its subsections: ${subs.map(x => x[0] + " " + x[1]).join("; ") || "none"}.${e ? " The site's explanation: " + e.t + (e.eq ? " Key equation: " + e.eq[0] + " — " + e.eq[1] : "") : ""}` : `Sections: ${secs.map(x => x[0] + " " + x[1]).join("; ")}.`}\nCurrent lab state: ${cur && cur.state ? cur.state() : "none"}`;
  }, ["What is this chapter really trying to do?", "Which sections are essential on a first pass?", "Give me a tiny NumPy experiment for the main idea"]);
  afterChapter(b, n, v);
}
let chapAskSection = null;
/* self-check quizzes: QUIZ[key] = [[question, [options], correctIndex, explanation], ...] (files in src/quiz/) */
const QUIZ = {};
const QUIZ_N = {};
/* rotate each question's options by a fixed per-question amount so the right answer isn't always first */
function quizGet(key) {
  const q = QUIZ[key]; if (!q || QUIZ_N[key]) return q;
  const h = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  q.forEach((x, i) => { const n = x[1].length, r = (h + i * 3 + 1) % n; x[1] = x[1].map((_, k) => x[1][(k - r + n) % n]); x[2] = (x[2] + r) % n; });
  QUIZ_N[key] = 1; return q;
}
function quizHTML(key) {
  const q = quizGet(key); if (!q || !q.length) return "";
  return `<div class="block quiz" data-quiz="${key}"><h3>Self-check (${q.length} questions)</h3><p class="note" style="margin:0 0 6px">Answer from memory first; tap an option to see why it is right or wrong. Your score is saved in this browser.</p>${q.map((x, i) => `<div class="qz" data-i="${i}" style="margin:10px 0"><p style="margin:0 0 4px"><b>${i + 1}.</b> ${esc(x[0])}</p><div class="btns" style="margin:0;flex-direction:column;align-items:stretch">${x[1].map((o, j) => `<button type="button" class="btn small" data-j="${j}" style="text-align:left">${esc(o)}</button>`).join("")}</div><p class="note qz-fb" style="margin:4px 0 0;color:var(--ink)" hidden></p></div>`).join("")}<p class="note qz-score" style="margin:8px 0 0"></p></div>`;
}
function bindQuiz(root) {
  const box = root.querySelector(".quiz"); if (!box) return;
  const key = box.dataset.quiz, q = quizGet(key), sk = "nvl-quiz-" + key; let done = {};
  try { done = JSON.parse(localStorage.getItem(sk) || "{}"); } catch (e) { }
  const score = () => { const n = Object.keys(done).length, r = Object.values(done).filter(Boolean).length; box.querySelector(".qz-score").textContent = n ? `Score: ${r} / ${q.length}${n === q.length ? (r === q.length ? " · perfect, move on" : " · revisit the sections you missed") : ""}` : ""; };
  const mark = (el, j, auto) => {
    const i = +el.dataset.i, x = q[i], ok = j === x[2]; if (!auto) { done[i] = ok; try { localStorage.setItem(sk, JSON.stringify(done)); } catch (e) { } }
    el.querySelectorAll("button").forEach((b, k) => { b.disabled = true; b.style.outline = k === x[2] ? "2px solid var(--c3)" : k === j ? "2px solid var(--c4)" : ""; });
    const fb = el.querySelector(".qz-fb"); fb.hidden = false; fb.textContent = (ok ? "Correct. " : "Not quite. ") + x[3]; score();
  };
  box.querySelectorAll(".qz").forEach(el => { el.querySelectorAll("button").forEach(b => b.onclick = () => mark(el, +b.dataset.j)); });
  score();
}
function secCard(b, s, rows) {
  const e = SEC[b + s[0]], subs = rows.filter(r => r[0].startsWith(s[0] + ".") && r[0].split(".").length === 3), star = /\*\s*$/.test(s[1]), title = s[1].replace(/\s*\*\s*$/, "");
  const ex = /^Exercises|^Summary/.test(title), hasLive = (LIVE_SEC[b + s[0]] || []).length > 0;
  const tags = [e && e.sim ? "3D" : "", hasLive ? "live" : "", e && e.ex ? "ex" : "", e && e.code ? "code" : ""].filter(Boolean).join(" · ");
  return `<details class="sec" id="sec-${s[0].replace(/\./g, "-")}"${e && !ex ? "" : ""}><summary><span class="sn">§${s[0]}</span><span class="st">${esc(title)}</span><span class="sp">${tags ? `<em style="color:var(--c3);font-style:normal;margin-right:6px">${tags}</em>` : ""}p. ${s[2]}${star ? " · *" : ""}</span>${e ? `<i class="dot ok" title="explained"></i>` : ex ? "" : `<i class="dot" title="not explained yet"></i>`}</summary>
    <div class="sec-body">${EASY[b + s[0]] ? `<p class="easy"><span class="tag">Easy</span>${esc(EASY[b + s[0]])}</p>` : ""}${e ? `<p>${esc(e.t)}</p>${e.eq ? `<div class="eq" style="font-size:15px;padding:6px 10px">${esc(e.eq[0])}</div><p class="note" style="margin:4px 0 0;color:var(--ink)">${esc(e.eq[1])}</p>` : ""}${e.ex ? `<div class="callout" style="margin-top:4px"><span class="eyebrow" style="color:var(--c4);display:block;margin-bottom:2px">Worked example</span>${esc(e.ex)}</div>` : ""}${e.code && typeof codeBlock === "function" ? codeBlock(e.code, e.codeLabel || "In code (NumPy / PyTorch)") : ""}` : ex ? `<p class="note" style="margin:0">Exercises: try them after the labs; ask below if you get stuck.</p>` : `<p class="note" style="margin:0">Not explained on the site yet. Use <b>Ask</b> for a from-scratch explanation now.</p>`}
    <p class="note" style="margin:6px 0 0">First pass: <b>${star ? "skip for now (marked * in the book)" : ex ? "after the chapter" : "read"}</b></p>
    ${(LIVE_SEC[b + s[0]] || []).map(liveHTML).join("")}
    ${subs.length ? `<ul class="subs">${subs.map(x => `<li><span>§${x[0]}</span> ${esc(x[1].replace(/\s*\*\s*$/, ""))}${/\*\s*$/.test(x[1]) ? " *" : ""} <em>p. ${x[2]}</em><button type="button" class="sub-ask" data-ask="${x[0]}">Ask §${x[0]}</button>${SUBS[b + x[0]] ? `<div class="sub-note">${esc(SUBS[b + x[0]])}</div>` : ""}</li>`).join("")}</ul>` : ""}
    <div class="btns">${e && e.sim ? `<button type="button" class="btn primary" data-sim="${e.sim}">Simulate: ${esc(ST[e.sim].tab)}</button>` : ""}${e && e.also ? e.also.map(a => `<button type="button" class="btn" data-sim="${a}">${esc(ST[a].isLab ? ST[a].tab : "Station " + a.slice(1) + ": " + ST[a].tab)}</button>`).join("") : ""}${ex ? "" : `<button type="button" class="btn" data-ask="${s[0]}">Ask about §${s[0]}</button>`}</div>${ex ? "" : `<div class="sec-ai" data-s="${s[0]}"></div>`}</div></details>`;
}

/* station mode (the original 10 stations), reached from their chapters */
let stationBack = null;
function goStation(id, fromChap) {
  stationBack = fromChap || stationBack; $("#chapview").hidden = true; $("#conceptview").hidden = true; setMode("course");
  go(id);
  const bar = $("#back-bar"); bar.hidden = !stationBack; if (stationBack) { const [b, n] = [stationBack[0], stationBack.slice(1)], c = chapters(b).find(x => x[0] === n); bar.innerHTML = `<button class="btn" type="button">← Back to ${esc(BOOKN[b].split(" · ")[0])} ch. ${n}: ${esc(c ? c[1] : "")}</button>`; bar.querySelector("button").onclick = () => goChapter(stationBack); }
}
