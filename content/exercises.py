"""Single source of truth for practice exercises (Murphy 1, ch. 1–8).
Each exercise: id, ch (book+chapter), sec, kind (think | derive | code), title, q, hint, answer, code.
In `code`, a line ending with `## hint` becomes a TODO in the starter version shown to the learner.
build.py runs every code solution, records its real output, and writes the site JSON + Colab notebooks."""

EX = []
def ex(**k): EX.append(k)

# ---------------- Chapter 1 ----------------
ex(id="1.1", ch="M1", sec="1.2", kind="think", title="Zero training error",
   q="You fit a degree-9 polynomial to 10 points and the training error is exactly 0. Is this a good model? What would you measure to find out?",
   hint="How many knobs does a degree-9 polynomial have? How many points must it pass through?",
   answer="Not necessarily. A degree-9 polynomial has 10 coefficients, so it can pass through any 10 points exactly. Zero training error is guaranteed, which means it tells you nothing about the pattern. Measure the error on points the model never saw (a held-out test set, or cross-validation). If test error is much larger than training error, the model memorised the noise: that gap is overfitting (Murphy §1.2.3).")
ex(id="1.2", ch="M1", sec="1.2", kind="code", title="Draw the overfitting curve yourself",
   q="Generate 15 noisy points from y = sin(2πx) + noise and 200 test points. Fit polynomials of degree 0 to 12 with np.polyfit. Print the train and test mean squared error for each degree and report which degree has the lowest test error.",
   hint="np.polyfit(x, y, d) returns coefficients; np.polyval(coef, x) evaluates them.",
   answer="Training error falls every time the degree goes up, because more knobs can always fit at least as well. Test error falls at first (the model can now bend like a sine), bottoms out around degree 3–6, then rises sharply as the curve starts chasing noise.",
   code='''import numpy as np
rng = np.random.default_rng(0)
f = lambda x: np.sin(2 * np.pi * x)
x_tr = rng.random(15); y_tr = f(x_tr) + rng.normal(0, 0.2, 15)
x_te = rng.random(200); y_te = f(x_te) + rng.normal(0, 0.2, 200)

best = None
for d in range(13):
    coef = np.polyfit(x_tr, y_tr, d)                    ## fit a degree-d polynomial to the training points
    tr = np.mean((np.polyval(coef, x_tr) - y_tr) ** 2)  ## training mean squared error
    te = np.mean((np.polyval(coef, x_te) - y_te) ** 2)  ## test mean squared error
    print(f"degree {d:2d}  train {tr:8.4f}  test {te:10.4f}")
    if best is None or te < best[1]:
        best = (d, te)
print("best degree on test data:", best[0])''')
ex(id="1.3", ch="M1", sec="1.5", kind="code", title="Turn categories and text into numbers",
   q="(a) One-hot encode the colours ['red', 'green', 'blue', 'green']. (b) Build a bag-of-words matrix for the three sentences 'the cat sat', 'the dog sat', 'the cat ate the fish'. Rows = sentences, columns = words in alphabetical order.",
   hint="Make a sorted vocabulary, then count. np.eye(k)[indices] gives one-hot rows.",
   answer="One-hot gives each category its own column with a single 1, so a weighted sum can give each category its own weight without implying an order. Bag-of-words throws away word order and keeps counts: 'the cat ate the fish' has a 2 in the 'the' column.",
   code='''import numpy as np
colours = ["red", "green", "blue", "green"]
cats = sorted(set(colours))                       # ['blue', 'green', 'red']
idx = [cats.index(c) for c in colours]
onehot = np.eye(len(cats))[idx]                   ## pick rows of the identity matrix
print(cats); print(onehot)

docs = ["the cat sat", "the dog sat", "the cat ate the fish"]
vocab = sorted({w for d in docs for w in d.split()})
bow = np.array([[d.split().count(w) for w in vocab] for d in docs])  ## count each word in each sentence
print(vocab); print(bow)''')
ex(id="1.4", ch="M1", sec="1.3", kind="think", title="Which kind of learning?",
   q="Name the setting (classification, regression, clustering, reinforcement) for: (a) predicting tomorrow's temperature, (b) grouping customers by shopping habits with no labels, (c) deciding if an email is spam, (d) a robot learning to walk from a reward for distance travelled.",
   hint="Is there a label? Is it a number or a category? Is feedback given per step or only as a reward?",
   answer="(a) Regression: the target is a number. (b) Clustering: no labels, find groups. (c) Classification: the label is one of two categories. (d) Reinforcement learning: no correct action is given, only a reward signal that may arrive late.")

# ---------------- Chapter 2 ----------------
ex(id="2.1", ch="M2", sec="2.3", kind="derive", title="The COVID test by hand",
   q="A test has sensitivity P(+|sick) = 0.875 and specificity P(−|healthy) = 0.975. In a population where 10% are infected, what is P(sick | +)? Repeat for 1% infected.",
   hint="P(+) = P(+|sick)P(sick) + P(+|healthy)P(healthy), and P(+|healthy) = 1 − specificity.",
   answer="With 10%: numerator = 0.875 × 0.1 = 0.0875. False positives = 0.025 × 0.9 = 0.0225. P(+) = 0.0875 + 0.0225 = 0.11. P(sick|+) = 0.0875 / 0.11 ≈ 0.795. With 1%: numerator = 0.00875, false positives = 0.025 × 0.99 = 0.02475, P(+) = 0.0335, P(sick|+) ≈ 0.261. Same test, very different meaning: when the disease is rare, most positives come from the large healthy group (Murphy §2.3.1).")
ex(id="2.2", ch="M2", sec="2.3", kind="code", title="Prove Monty Hall by simulation",
   q="Simulate 100,000 games of Monty Hall with 3 doors. Report the win rate if you always stay and if you always switch.",
   hint="If your first pick is the car, switching loses; otherwise switching wins. You don't even need to simulate the host's choice explicitly.",
   answer="Stay wins about 1/3 of the time, switch about 2/3. Your first pick is right 1/3 of the time; in the other 2/3 the host is forced to leave the car behind the one other closed door.",
   code='''import numpy as np
rng = np.random.default_rng(1)
n = 100_000
car = rng.integers(0, 3, n)
pick = rng.integers(0, 3, n)
stay_wins = np.mean(pick == car)      ## staying wins only if the first pick was the car
switch_wins = np.mean(pick != car)    ## switching wins exactly when the first pick was wrong
print(f"stay   {stay_wins:.3f}")
print(f"switch {switch_wins:.3f}")''')
ex(id="2.3", ch="M2", sec="2.5", kind="code", title="Softmax that doesn't explode",
   q="Implement softmax and log-sum-exp naively and in the stable way (subtract the max). Try both on scores [1000, 1001, 1002].",
   hint="softmax(z) = softmax(z − c) for any constant c, because e^(−c) cancels top and bottom.",
   answer="The naive version computes e^1000 = inf, and inf/inf = nan. The stable version subtracts 1002 first, so it computes e^−2, e^−1, e^0 and gets [0.090, 0.245, 0.665]. Log-sum-exp = 1002 + log(e^−2 + e^−1 + 1) ≈ 1002.41.",
   code='''import numpy as np
z = np.array([1000.0, 1001.0, 1002.0])
with np.errstate(over="ignore", invalid="ignore"):
    naive = np.exp(z) / np.exp(z).sum()
print("naive :", naive)

def softmax(z):
    e = np.exp(z - z.max())               ## subtract the largest score before exponentiating
    return e / e.sum()

def logsumexp(z):
    m = z.max()
    return m + np.log(np.exp(z - m).sum())  ## pull the max out of the log
print("stable:", softmax(z).round(3))
print("logsumexp:", round(logsumexp(z), 4))''')
ex(id="2.4", ch="M2", sec="2.8", kind="code", title="Measure the central limit theorem",
   q="Average n draws from an exponential distribution (σ = 1), repeat 20,000 times, and measure the standard deviation of the averages for n = 1, 4, 16, 64. Compare with 1/√n.",
   hint="rng.exponential(1, size=(20000, n)).mean(axis=1)",
   answer="The measured spreads come out ≈ 1, 0.5, 0.25, 0.125: each 4× more data halves the spread, exactly 1/√n. The histogram of averages also loses its skew and becomes a bell as n grows.",
   code='''import numpy as np
rng = np.random.default_rng(2)
for n in [1, 4, 16, 64]:
    means = rng.exponential(1.0, size=(20000, n)).mean(axis=1)  ## 20,000 averages of n draws
    print(f"n={n:3d}  measured std {means.std():.4f}   1/sqrt(n) {1/np.sqrt(n):.4f}")''')
ex(id="2.5", ch="M2", sec="2.4", kind="derive", title="Why σ′(z) = σ(z)(1 − σ(z))",
   q="Differentiate σ(z) = 1 / (1 + e^−z) and show the result can be written as σ(z)(1 − σ(z)).",
   hint="Write σ = (1 + e^−z)^−1 and use the chain rule. Then notice 1 − σ = e^−z / (1 + e^−z).",
   answer="σ′(z) = −(1 + e^−z)^−2 · (−e^−z) = e^−z / (1 + e^−z)². Split it: [1 / (1 + e^−z)] · [e^−z / (1 + e^−z)] = σ(z) · (1 − σ(z)), because 1 − σ = (1 + e^−z − 1)/(1 + e^−z) = e^−z/(1 + e^−z). So the slope can be computed from the output alone, which is why backprop through a sigmoid is cheap (station 4).")

# ---------------- Chapter 3 ----------------
ex(id="3.1", ch="M3", sec="3.1", kind="code", title="Covariance by hand, and a trap",
   q="(a) For x = [1,2,3,4,5] and y = [2,4,5,4,5], compute the covariance and correlation by hand in NumPy and check against np.cov / np.corrcoef. (b) Let x be 10,000 standard normals and y = x². Show the correlation is ≈ 0 even though y is a function of x.",
   hint="cov = mean((x − x̄)(y − ȳ)); np.cov uses n − 1 in the denominator by default.",
   answer="(a) Covariance (n − 1 version) = 1.5, correlation ≈ 0.775. (b) Correlation ≈ 0, because for every positive x there's a matching negative x with the same y, so the linear trend cancels. Correlation only measures straight-line relationships; zero correlation does not mean independence (Murphy §3.1.3).",
   code='''import numpy as np
x = np.array([1, 2, 3, 4, 5.]); y = np.array([2, 4, 5, 4, 5.])
cov = np.sum((x - x.mean()) * (y - y.mean())) / (len(x) - 1)   ## average product of deviations (n-1)
corr = cov / (x.std(ddof=1) * y.std(ddof=1))                   ## rescale to -1..1
print("by hand :", round(cov, 4), round(corr, 4))
print("numpy   :", round(np.cov(x, y)[0, 1], 4), round(np.corrcoef(x, y)[0, 1], 4))

rng = np.random.default_rng(3)
a = rng.normal(size=10000); b = a ** 2
print("corr(x, x^2) =", round(np.corrcoef(a, b)[0, 1], 4))''')
ex(id="3.2", ch="M3", sec="3.2", kind="code", title="Sample a tilted Gaussian with Cholesky",
   q="Draw 50,000 samples from N(μ, Σ) with μ = [1, −2] and Σ = [[2, 1.2], [1.2, 1]] using only standard normal draws and the Cholesky factor L (Σ = L Lᵀ). Check the sample mean and covariance.",
   hint="If z ~ N(0, I) then μ + L z ~ N(μ, L Lᵀ).",
   answer="Because Cov(Lz) = L Cov(z) Lᵀ = L I Lᵀ = Σ, stretching standard noise by L produces exactly the covariance you want. The sample covariance comes out within about 0.01–0.02 of Σ.",
   code='''import numpy as np
rng = np.random.default_rng(4)
mu = np.array([1., -2.]); Sigma = np.array([[2., 1.2], [1.2, 1.]])
L = np.linalg.cholesky(Sigma)
z = rng.normal(size=(50000, 2))
x = mu + z @ L.T                        ## stretch and tilt the standard noise, then shift
print("L =", L.round(3).tolist())
print("sample mean:", x.mean(0).round(3))
print("sample cov :", np.cov(x.T).round(3).tolist())''')
ex(id="3.3", ch="M3", sec="3.2", kind="derive", title="Condition a 2-D Gaussian",
   q="Heights and weights are jointly Gaussian with μ_h = 170 cm, σ_h = 10, μ_w = 70 kg, σ_w = 12, correlation ρ = 0.6. What are the mean and standard deviation of weight for someone 190 cm tall?",
   hint="E[w|h] = μ_w + ρ(σ_w/σ_h)(h − μ_h);  Var[w|h] = σ_w²(1 − ρ²).",
   answer="E[w | h=190] = 70 + 0.6 × (12/10) × 20 = 70 + 14.4 = 84.4 kg. Var = 144 × (1 − 0.36) = 92.16, so σ ≈ 9.6 kg. Knowing the height shifts your guess and makes you more certain (12 → 9.6 kg). Murphy §3.2.3.")
ex(id="3.4", ch="M3", sec="3.1", kind="think", title="Simpson's paradox in one table",
   q="Treatment A cures 81/87 small stones and 192/263 large stones. Treatment B cures 234/270 small and 55/80 large. Which is better within each group? Which looks better overall? Why?",
   hint="Compute four percentages, then the two overall percentages. Who got the hard cases?",
   answer="Small: A 93% vs B 87%. Large: A 73% vs B 69%. A wins in both groups. Overall: A 273/350 = 78%, B 289/350 = 83%, so B looks better. The reversal happens because A was given most of the hard (large-stone) cases. The group variable confounds the comparison; you have to condition on it (Murphy §3.1.5).")

# ---------------- Chapter 4 ----------------
ex(id="4.1", ch="M4", sec="4.2", kind="derive", title="The coin's MLE from scratch",
   q="You flip a coin n times and see h heads. Write the log-likelihood of θ and find the θ that maximises it.",
   hint="log L = h log θ + (n − h) log(1 − θ). Set its derivative to zero.",
   answer="d/dθ log L = h/θ − (n − h)/(1 − θ) = 0 ⇒ h(1 − θ) = (n − h)θ ⇒ h = nθ ⇒ θ̂ = h/n. The second derivative, −h/θ² − (n−h)/(1−θ)², is negative, so it's a maximum. The 'obvious' answer, heads over flips, is exactly what maximum likelihood gives (Murphy §4.2.3).")
ex(id="4.2", ch="M4", sec="4.2", kind="code", title="The MLE of variance is biased",
   q="Draw 100,000 samples of size n = 5 from N(0, 4). For each, compute the MLE variance (divide by n) and the unbiased version (divide by n − 1). Average each over all samples and compare with the true 4.",
   hint="x.var(axis=1, ddof=0) vs ddof=1.",
   answer="The MLE averages ≈ 3.2 = 4 × (n−1)/n: it underestimates, because measuring spread around the sample mean (which sits in the middle of your own points) always looks tighter than around the true mean. Dividing by n − 1 corrects this and averages ≈ 4.",
   code='''import numpy as np
rng = np.random.default_rng(5)
x = rng.normal(0, 2, size=(100000, 5))
mle = x.var(axis=1, ddof=0).mean()       ## divide by n
unb = x.var(axis=1, ddof=1).mean()       ## divide by n - 1
print(f"MLE average {mle:.3f}   unbiased average {unb:.3f}   theory for MLE {4*4/5:.3f}")''')
ex(id="4.3", ch="M4", sec="4.6", kind="code", title="Beta-binomial updating on a grid",
   q="Start with a Beta(2, 2) prior on a coin's bias. Observe 7 heads in 10 flips. On a grid of 1,001 θ values, compute the posterior, its mean, its MAP, and a 95% credible interval. Check the mean against the formula (a + h)/(a + b + n).",
   hint="posterior ∝ θ^(a−1+h) (1−θ)^(b−1+n−h). Normalise by dividing by the sum; use the cumulative sum for the interval.",
   answer="Posterior = Beta(9, 5). Mean = 9/14 ≈ 0.643, MAP = 8/12 ≈ 0.667, 95% interval ≈ [0.39, 0.86]. The MLE would be 0.7; the prior pulls slightly toward 0.5, as if you'd already seen 1 head and 1 tail.",
   code='''import numpy as np
a, b, h, n = 2, 2, 7, 10
th = np.linspace(0, 1, 1001)
post = th ** (a - 1 + h) * (1 - th) ** (b - 1 + n - h)   ## prior x likelihood (unnormalised)
post /= post.sum()                                       ## normalise on the grid
mean = (th * post).sum()
cdf = np.cumsum(post)
lo, hi = th[np.searchsorted(cdf, 0.025)], th[np.searchsorted(cdf, 0.975)]
print(f"mean {mean:.3f} (formula {(a+h)/(a+b+n):.3f})  MAP {th[post.argmax()]:.3f}  95% CI [{lo:.2f}, {hi:.2f}]")''')
ex(id="4.4", ch="M4", sec="4.7", kind="code", title="Bootstrap a confidence interval",
   q="You have 40 skewed measurements (exponential, scale 3). Use 5,000 bootstrap resamples to estimate the standard error of the median and a 95% percentile interval.",
   hint="rng.choice(data, size=len(data), replace=True), then take the median, repeated.",
   answer="The bootstrap treats your sample as a stand-in for the population and reruns the experiment by resampling. The spread of the 5,000 medians approximates how much the median would change if you collected new data. No formula for the median's standard error is needed.",
   code='''import numpy as np
rng = np.random.default_rng(6)
data = rng.exponential(3.0, 40)
meds = np.array([np.median(rng.choice(data, size=len(data), replace=True)) for _ in range(5000)])  ## resample and recompute
print(f"sample median {np.median(data):.3f}")
print(f"bootstrap SE  {meds.std():.3f}")
print(f"95% interval  [{np.percentile(meds, 2.5):.3f}, {np.percentile(meds, 97.5):.3f}]   true median {3*np.log(2):.3f}")''')
ex(id="4.5", ch="M4", sec="4.5", kind="code", title="Ridge tames a wild polynomial",
   q="Fit a degree-12 polynomial to 15 noisy sine points with ridge regression w = (ΦᵀΦ + λI)⁻¹Φᵀy, for λ = 0, 1e−6, 1e−3, 1. Print the largest |weight| and the test error for each.",
   hint="Build Φ with np.vander(x, 13, increasing=True). Scale x to [−1, 1] first for numerical sanity.",
   answer="With λ = 0 the weights are huge (thousands or more) and test error is bad: the curve is a fragile balance of giant terms. A small λ shrinks the weights by orders of magnitude and test error improves. Too much λ (1) flattens the curve and error goes up again: bias. λ is a dial between variance and bias.",
   code='''import numpy as np
rng = np.random.default_rng(0)
f = lambda x: np.sin(2 * np.pi * x)
xtr = rng.random(15); ytr = f(xtr) + rng.normal(0, 0.2, 15)
xte = rng.random(200); yte = f(xte) + rng.normal(0, 0.2, 200)
P = lambda x: np.vander(2 * x - 1, 13, increasing=True)
for lam in [0, 1e-6, 1e-3, 1]:
    A = P(xtr).T @ P(xtr) + lam * np.eye(13)
    w = np.linalg.solve(A, P(xtr).T @ ytr)                ## ridge closed form
    te = np.mean((P(xte) @ w - yte) ** 2)
    print(f"lambda {lam:<6}  max|w| {np.abs(w).max():12.1f}   test MSE {te:.4f}")''')

# ---------------- Chapter 5 ----------------
ex(id="5.1", ch="M5", sec="5.1", kind="code", title="ROC and AUC from scratch",
   q="Simulate 1,000 negative scores ~ N(0,1) and 1,000 positive scores ~ N(1.5,1). Sweep thresholds to build the ROC curve, compute its area with the trapezoid rule, and compare with the fraction of (positive, negative) pairs where the positive scores higher.",
   hint="For each threshold t: TPR = mean(pos ≥ t), FPR = mean(neg ≥ t). Sort by FPR before integrating.",
   answer="Both numbers come out ≈ 0.87 (theory Φ(1.5/√2) ≈ 0.856; the gap is sampling noise). The area under the ROC curve equals the probability that a random positive outranks a random negative, which is why it doesn't depend on any threshold.",
   code='''import numpy as np
rng = np.random.default_rng(7)
neg = rng.normal(0, 1, 1000); pos = rng.normal(1.5, 1, 1000)
ts = np.linspace(-5, 7, 400)
tpr = np.array([(pos >= t).mean() for t in ts])   ## hit rate at each threshold
fpr = np.array([(neg >= t).mean() for t in ts])   ## false-alarm rate at each threshold
o = np.argsort(fpr)
auc = np.trapezoid(tpr[o], fpr[o]) if hasattr(np, "trapezoid") else np.trapz(tpr[o], fpr[o])
pairs = (pos[:, None] > neg[None, :]).mean()     ## P(random positive > random negative)
print(f"AUC (trapezoid) {auc:.4f}   P(pos > neg) {pairs:.4f}")''')
ex(id="5.2", ch="M5", sec="5.1", kind="derive", title="The cost-optimal threshold",
   q="A false negative costs c_FN and a false positive costs c_FP. Given p = P(y = 1 | x), when should you predict 1? Work out the threshold for c_FN = 9, c_FP = 1.",
   hint="Expected cost of predicting 1 is (1 − p)·c_FP; of predicting 0 is p·c_FN.",
   answer="Predict 1 when (1 − p)c_FP < p·c_FN ⇔ p > c_FP / (c_FP + c_FN). With c_FN = 9 and c_FP = 1, the threshold is 1/10 = 0.1: if missing a positive is 9× worse, you flag anything with more than a 10% chance. 0.5 is only right when the costs are equal (Murphy §5.1.2).")
ex(id="5.3", ch="M5", sec="5.4", kind="code", title="Cross-validation from scratch",
   q="Using the noisy-sine data (30 points), implement 5-fold cross-validation by hand to pick the polynomial degree from 0–10. Print the CV error for each degree.",
   hint="Shuffle indices once, split into 5 folds; for each fold train on the other 4.",
   answer="CV error is high for degree 0 (too simple), lowest at degree 3 on this data, bumpy in the middle (30 points make CV noisy) and explodes for degree 7+. Unlike training error, CV error is measured on held-out points, so it can choose a degree without touching a test set.",
   code='''import numpy as np
rng = np.random.default_rng(8)
x = rng.random(30); y = np.sin(2 * np.pi * x) + rng.normal(0, 0.2, 30)
folds = np.array_split(rng.permutation(30), 5)
for d in range(11):
    errs = []
    for k in range(5):
        te = folds[k]; tr = np.concatenate([folds[j] for j in range(5) if j != k])  ## all other folds
        c = np.polyfit(x[tr], y[tr], d)
        errs.append(np.mean((np.polyval(c, x[te]) - y[te]) ** 2))
    print(f"degree {d:2d}  CV error {np.mean(errs):8.4f}")''')
ex(id="5.4", ch="M5", sec="5.5", kind="think", title="What a p-value is not",
   q="A study reports p = 0.03 for 'the drug works'. Which statements are true? (a) There's a 3% chance the drug doesn't work. (b) If the drug did nothing, results at least this extreme would happen about 3% of the time. (c) The effect is large. (d) There's a 97% chance the result will replicate.",
   hint="A p-value is computed assuming the null hypothesis is true.",
   answer="Only (b). A p-value is P(data at least this extreme | no effect). It isn't P(no effect | data); that would need a prior, i.e. Bayes' rule. It says nothing about effect size, and doesn't give a replication probability (Murphy §5.5.4).")

# ---------------- Chapter 6 ----------------
ex(id="6.1", ch="M6", sec="6.1", kind="code", title="Entropy, cross-entropy, KL",
   q="Write functions H(p), H(p, q) and KL(p‖q) in bits. For p = [0.7, 0.1, 0.1, 0.1] and q = uniform over 4, check that H(p, q) = H(p) + KL(p‖q), and compare KL(p‖q) with KL(q‖p).",
   hint="Use np.log2. KL = Σ p log(p/q).",
   answer="H(p) ≈ 1.357 bits and H(p, q) = 2 bits (a uniform code over 4 outcomes always costs 2 bits), so KL(p‖q) ≈ 0.643 = 2 − 1.357. Swapping the arguments gives KL(q‖p) ≈ 0.620: a different number. KL is not a distance, so which distribution is 'the truth' matters (Murphy §6.2.6).",
   code='''import numpy as np
def H(p):       return -np.sum(p * np.log2(p))           ## average surprise
def CE(p, q):   return -np.sum(p * np.log2(q))           ## surprise of p's outcomes under q
def KL(p, q):   return np.sum(p * np.log2(p / q))        ## extra surprise
p = np.array([0.7, 0.1, 0.1, 0.1]); q = np.full(4, 0.25)
print(f"H(p) {H(p):.4f}  H(p,q) {CE(p,q):.4f}  H(p)+KL {H(p)+KL(p,q):.4f}")
print(f"KL(p||q) {KL(p,q):.4f}   KL(q||p) {KL(q,p):.4f}")''')
ex(id="6.2", ch="M6", sec="6.2", kind="derive", title="KL between two coins",
   q="Compute KL(p‖q) in bits for two coins with P(heads) = 0.9 and 0.5. Then explain why KL can never be negative.",
   hint="KL = 0.9 log₂(0.9/0.5) + 0.1 log₂(0.1/0.5).",
   answer="0.9 × log₂ 1.8 + 0.1 × log₂ 0.2 = 0.9 × 0.848 + 0.1 × (−2.322) = 0.763 − 0.232 = 0.531 bits. Non-negativity: −KL = Σ p log(q/p) ≤ log Σ p (q/p) = log Σ q = log 1 = 0, by Jensen's inequality (log is concave, so the average of logs ≤ log of the average). Equality only when q = p (Murphy §6.2.4).")
ex(id="6.3", ch="M6", sec="6.3", kind="code", title="Mutual information catches what correlation misses",
   q="Let X be uniform on {−2, −1, 0, 1, 2} and Y = X². Build the joint table, compute the correlation and the mutual information I(X; Y) in bits.",
   hint="I = Σ p(x,y) log₂ [p(x,y) / (p(x)p(y))]. Skip cells where p(x,y) = 0.",
   answer="Correlation is exactly 0, but I(X; Y) = H(Y) ≈ 1.52 bits: knowing X tells you Y completely. Mutual information detects any dependence, not just straight-line ones (Murphy §6.3.5).",
   code='''import numpy as np
xs = np.array([-2, -1, 0, 1, 2]); ys = np.unique(xs ** 2)
J = np.zeros((5, len(ys)))
for i, x in enumerate(xs):
    J[i, list(ys).index(x ** 2)] = 1 / 5
px, py = J.sum(1), J.sum(0)
mi = sum(J[i, j] * np.log2(J[i, j] / (px[i] * py[j])) for i in range(5) for j in range(len(ys)) if J[i, j] > 0)  ## sum over non-zero cells
corr = np.corrcoef(xs, xs ** 2)[0, 1]
print(f"correlation {corr:.4f}   mutual information {mi:.4f} bits   H(Y) {-(py*np.log2(py)).sum():.4f}")''')
ex(id="6.4", ch="M6", sec="6.2", kind="think", title="Why classifiers minimise cross-entropy",
   q="Training a classifier minimises the average −log q(true label). Explain in two sentences why this is the same as making the model's distribution q match the data's distribution p.",
   hint="Cross-entropy = entropy + KL. Which part can the model change?",
   answer="The average −log q over the data is the cross-entropy H(p, q) = H(p) + KL(p‖q). H(p) depends only on the data, so the only part training can lower is KL(p‖q), which is zero exactly when q = p. That's also maximum likelihood (Murphy §6.2.5).")

# ---------------- Chapter 7 ----------------
ex(id="7.1", ch="M7", sec="7.4", kind="code", title="Power iteration finds the top eigenvector",
   q="For A = [[4, 1], [2, 3]], start with a random vector and repeat v ← Av / ‖Av‖ fifty times. Estimate the top eigenvalue with vᵀAv / vᵀv and compare with np.linalg.eig.",
   hint="Each multiplication grows the top eigenvector's share by λ₁/λ₂.",
   answer="Eigenvalues are 5 and 2. Every multiply scales the λ = 5 direction 2.5× faster than the λ = 2 one, so after a few dozen steps only the top direction is left: v ≈ [0.707, 0.707], estimate ≈ 5. Station 7's PCA uses this method.",
   code='''import numpy as np
A = np.array([[4., 1.], [2., 3.]])
v = np.random.default_rng(9).normal(size=2)
for _ in range(50):
    v = A @ v
    v = v / np.linalg.norm(v)            ## keep it unit length
lam = v @ A @ v / (v @ v)                ## Rayleigh quotient
print("power iteration:", v.round(4), round(lam, 4))
print("numpy eig      :", np.linalg.eig(A)[0])''')
ex(id="7.2", ch="M7", sec="7.5", kind="code", title="Compress an image with truncated SVD",
   q="Build a 64×64 'image' (sum of a few smooth patterns plus noise). Compute its SVD and reconstruct it from the top k singular values for k = 1, 2, 5, 10, 20. Print the relative error and the fraction of numbers stored.",
   hint="U[:, :k] * s[:k] @ Vt[:k] rebuilds the rank-k approximation. Storage = k(64 + 64 + 1).",
   answer="The error drops fast for the first few k (the smooth structure) and then flattens at the noise level. Rank 5 stores about 16% of the numbers with a small error: truncated SVD keeps the strongest directions, which is the same idea as PCA (Murphy §7.5.5).",
   code='''import numpy as np
rng = np.random.default_rng(10)
u = np.linspace(0, 1, 64)
img = np.outer(np.sin(3*u), np.cos(2*u)) + 0.5*np.outer(u, u**2) + 0.3*np.outer(np.cos(7*u), np.sin(5*u)) + 0.02*rng.normal(size=(64, 64))
U, s, Vt = np.linalg.svd(img)
for k in [1, 2, 5, 10, 20]:
    approx = U[:, :k] * s[:k] @ Vt[:k]   ## keep the k strongest directions
    err = np.linalg.norm(img - approx) / np.linalg.norm(img)
    print(f"k={k:2d}  relative error {err:.4f}   stored {k*(64+64+1)/64**2:.1%}")''')
ex(id="7.3", ch="M7", sec="7.8", kind="derive", title="Gradient of the squared error",
   q="Show that the gradient of f(w) = ‖Xw − y‖² is 2Xᵀ(Xw − y), and set it to zero to get the normal equations.",
   hint="Write f = (Xw − y)ᵀ(Xw − y) = wᵀXᵀXw − 2yᵀXw + yᵀy, then use ∇(wᵀAw) = (A + Aᵀ)w and ∇(bᵀw) = b.",
   answer="∇f = (XᵀX + (XᵀX)ᵀ)w − 2Xᵀy = 2XᵀXw − 2Xᵀy = 2Xᵀ(Xw − y). Setting it to 0: XᵀXw = Xᵀy, so ŵ = (XᵀX)⁻¹Xᵀy when XᵀX is invertible. Geometrically, the residual Xw − y must be perpendicular to every column of X (Murphy §7.7.3, §11.2.2).")
ex(id="7.4", ch="M7", sec="7.7", kind="code", title="Three ways to solve least squares",
   q="With X random 100×3 and y = X[1, −2, 0.5] + noise, solve for w with (a) the normal equations, (b) np.linalg.lstsq, (c) the pseudo-inverse. Then make two columns nearly identical and compare the condition number and the answers.",
   hint="np.linalg.cond(X.T @ X) measures how close to singular the system is.",
   answer="On well-conditioned data all three agree to 3 decimals. With two nearly identical columns the problem itself is ill-posed: the data only pins down the sum of their two weights (≈ 1), so every method returns huge weights of opposite sign that cancel. The normal equations also disagree with the others from the 4th digit on, because forming XᵀX squares the condition number and throws away precision. The real fix is to change the problem: ridge (a small λ makes the weights small and stable) or dropping one of the duplicate columns.",
   code='''import numpy as np
rng = np.random.default_rng(11)
X = rng.normal(size=(100, 3)); w_true = np.array([1., -2., 0.5])
y = X @ w_true + 0.1 * rng.normal(size=100)
for name, M in [("good", X), ("collinear", np.column_stack([X[:, 0], X[:, 0] + 1e-6 * rng.normal(size=100), X[:, 2]]))]:
    a = np.linalg.solve(M.T @ M, M.T @ y)        ## normal equations
    b = np.linalg.lstsq(M, y, rcond=None)[0]
    c = np.linalg.pinv(M) @ y
    print(f"{name:9s} cond(XtX)={np.linalg.cond(M.T @ M):.2e}")
    print("  normal", a.round(3), " lstsq", b.round(3), " pinv", c.round(3))''')

# ---------------- Chapter 8 ----------------
ex(id="8.1", ch="M8", sec="8.2", kind="code", title="When does gradient descent blow up?",
   q="Minimise f(w) = ½(w₁² + 10w₂²) from w = [5, 5] with gradient descent for 100 steps, for step sizes 0.05, 0.15, 0.19, 0.21. Print the final loss for each. Predict the critical step size first.",
   hint="The curvatures are 1 and 10. Along a direction with curvature c, each step multiplies the error by (1 − ηc).",
   answer="Along the steep direction the error is multiplied by (1 − 10η) each step. That shrinks only if |1 − 10η| < 1, i.e. η < 0.2. At 0.19 it converges slowly with zig-zags; at 0.21 it explodes. The steep direction sets the speed limit, while the flat direction (curvature 1) is what makes convergence slow (Murphy §8.2.2–8.2.3).",
   code='''import numpy as np
c = np.array([1., 10.])
for eta in [0.05, 0.15, 0.19, 0.21]:
    w = np.array([5., 5.])
    for _ in range(100):
        w = w - eta * c * w                 ## gradient of 0.5*sum(c*w^2) is c*w
    print(f"eta {eta}: final loss {0.5 * np.sum(c * w**2):.3e}")''')
ex(id="8.2", ch="M8", sec="8.2", kind="code", title="Momentum and Adam on the banana",
   q="Implement plain GD, momentum (β = 0.9) and Adam on the Rosenbrock function f = (1 − x)² + 100(y − x²)² starting at (−1.5, 2). Run 5,000 steps each and report the final point and loss.",
   hint="Gradient: ∂f/∂x = −2(1 − x) − 400x(y − x²), ∂f/∂y = 200(y − x²).",
   answer="The minimum is at (1, 1). GD with a safe small step crawls along the curved valley floor and is still far away after 5,000 steps. Momentum builds speed along the valley and gets much closer. Adam's per-direction scaling handles the steep walls and the flat floor at the same time.",
   code='''import numpy as np
f = lambda p: (1 - p[0])**2 + 100 * (p[1] - p[0]**2)**2
g = lambda p: np.array([-2*(1 - p[0]) - 400*p[0]*(p[1] - p[0]**2), 200*(p[1] - p[0]**2)])
start = np.array([-1.5, 2.0])
p = start.copy()
for _ in range(5000): p -= 1e-4 * g(p)
print("GD       ", p.round(4), f"{f(p):.2e}")
p, v = start.copy(), np.zeros(2)
for _ in range(5000):
    v = 0.9 * v + g(p)                      ## keep 90% of the previous velocity
    p -= 1e-4 * v
print("momentum ", p.round(4), f"{f(p):.2e}")
p, m, s = start.copy(), np.zeros(2), np.zeros(2)
for t in range(1, 5001):
    gr = g(p); m = 0.9*m + 0.1*gr; s = 0.999*s + 0.001*gr**2
    p -= 0.01 * (m / (1 - 0.9**t)) / (np.sqrt(s / (1 - 0.999**t)) + 1e-8)  ## averaged slope / its typical size
print("Adam     ", p.round(4), f"{f(p):.2e}")''')
ex(id="8.3", ch="M8", sec="8.4", kind="code", title="SGD with different batch sizes",
   q="Fit linear regression (10,000 points, 5 features) with minibatch SGD for one fixed budget of 20,000 gradient evaluations, using batch sizes 1, 10, 100. Compare the final distance to the true weights.",
   hint="Steps = budget / batch size. Use the same learning rate 0.01.",
   answer="Batch 1 takes 20,000 very noisy steps: it gets near the answer fast but keeps rattling around it (error ≈ 0.11). Batch 100 takes clean steps but only 200 of them, so it hasn't finished (≈ 0.05). Batch 10 is the sweet spot here (≈ 0.03). Gradient noise shrinks like 1/√B (the CLT lab), so bigger batches buy smoothness with fewer steps. That trade-off is why typical batch sizes are in the tens to hundreds.",
   code='''import numpy as np
rng = np.random.default_rng(12)
X = rng.normal(size=(10000, 5)); w_true = rng.normal(size=5)
y = X @ w_true + 0.5 * rng.normal(size=10000)
for B in [1, 10, 100]:
    w = np.zeros(5)
    for _ in range(20000 // B):
        i = rng.integers(0, 10000, B)
        grad = 2 * X[i].T @ (X[i] @ w - y[i]) / B     ## minibatch gradient of the squared error
        w -= 0.01 * grad
    print(f"batch {B:3d}: steps {20000//B:5d}  |w - w_true| = {np.linalg.norm(w - w_true):.4f}")''')
ex(id="8.4", ch="M8", sec="8.7", kind="code", title="EM for a two-bump mixture",
   q="Generate 600 points: 40% from N(−2, 0.7²) and 60% from N(3, 1.2²). Fit a 2-component Gaussian mixture with EM, starting from means [−1, 1], σ = [1, 1], weights [0.5, 0.5]. Print the parameters after 50 iterations.",
   hint="E step: r_ik ∝ π_k N(x_i | μ_k, σ_k). M step: π_k = mean_i r_ik, μ_k = Σ r_ik x_i / Σ r_ik, σ_k² = Σ r_ik (x_i − μ_k)² / Σ r_ik.",
   answer="EM recovers weights ≈ [0.4, 0.6], means ≈ [−2, 3], σ ≈ [0.7, 1.2]. The E step makes soft guesses of which bump each point came from; the M step refits each bump to the points weighted by those guesses. The log-likelihood never decreases.",
   code='''import numpy as np
rng = np.random.default_rng(13)
x = np.concatenate([rng.normal(-2, 0.7, 240), rng.normal(3, 1.2, 360)])
pi, mu, sd = np.array([.5, .5]), np.array([-1., 1.]), np.array([1., 1.])
N = lambda x, m, s: np.exp(-(x - m)**2 / (2 * s**2)) / (s * np.sqrt(2 * np.pi))
for _ in range(50):
    r = pi * N(x[:, None], mu, sd)          # E step: unnormalised responsibilities
    r /= r.sum(1, keepdims=True)            ## normalise each row to sum to 1
    nk = r.sum(0)
    pi = nk / len(x)                        ## M step: new weights
    mu = (r * x[:, None]).sum(0) / nk       ## new means
    sd = np.sqrt((r * (x[:, None] - mu)**2).sum(0) / nk)   ## new spreads
print("weights", pi.round(3), " means", mu.round(3), " sds", sd.round(3))''')
ex(id="8.5", ch="M8", sec="8.3", kind="derive", title="Newton's method by hand",
   q="Minimise f(x) = x⁴ − 3x² + 2 with Newton's method starting at x₀ = 2. Do two steps by hand.",
   hint="x ← x − f′(x)/f″(x), with f′ = 4x³ − 6x and f″ = 12x² − 6.",
   answer="x₀ = 2: f′ = 32 − 12 = 20, f″ = 48 − 6 = 42, x₁ = 2 − 20/42 ≈ 1.524. x₁: f′ = 4(3.540) − 9.143 ≈ 5.016, f″ = 12(2.322) − 6 ≈ 21.87, x₂ ≈ 1.524 − 0.229 ≈ 1.294. The true minimum is √1.5 ≈ 1.225, and Newton converges quadratically: the number of correct digits roughly doubles each step once close.")
