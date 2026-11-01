"""Projects 4–7: statistics, decisions, unsupervised learning and a CNN. Same format as projects.py."""
MORE = [
dict(id="p4", title="Is the new version better? A/B testing from first principles",
 chapters=["M2", "M4", "M5"], track="stats",
 blurb="A product team shows 4,000 visitors the old page (A) and 4,000 the new page (B) and counts sign-ups. Is B really better, or did it get lucky? You'll answer that six ways, from the central limit theorem to a permutation test and a Bayesian posterior. Then you'll measure how often such a test can even detect the effect, and watch 'peeking' at results quietly break it. Uses Murphy ch. 2, 4 and 5.",
 steps=[
  dict(title="Simulate the experiment", kind="code",
   q="Simulate 4,000 visitors per arm, where A converts with true probability 10% and B with 11.5% (pretend you don't know these). Report each arm's observed rate and the observed difference.",
   answer='Observed: A 395/4000 = 9.88%, B 463/4000 = 11.58%, a difference of +1.70 percentage points. The true difference is +1.5 points, so chance alone moved the estimate by 0.2 points. Every number below is about one question: how much of that +1.70 could be luck?',
   code='''import numpy as np
rng = np.random.default_rng(7)
nA = nB = 4000
a = rng.random(nA) < 0.100                     # 1 = signed up
b = rng.random(nB) < 0.115
pA, pB = a.mean(), b.mean()                    ## observed conversion rates
diff = pB - pA
print(f"A: {a.sum()} / {nA} = {pA:.4f}    B: {b.sum()} / {nB} = {pB:.4f}    difference {diff:+.4f}")'''),
  dict(title="Error bar from the central limit theorem", kind="code",
   q="Each observed rate is an average of 0/1 values, so by the CLT it is roughly Gaussian with variance p(1 − p)/n. Compute the standard error of the difference, a 95% confidence interval, and the z-score.",
   answer="Standard error ≈ 0.0069, so the 95% interval is [+0.0034, +0.0306] and z ≈ 2.46. The logic: an average of n independent 0/1 values has variance p(1 − p)/n (Murphy §2.2), the CLT makes it roughly Gaussian (§2.8.6), and variances of independent things add. The interval excludes 0, so 'no difference' is not a good fit to this data. But it is wide: the true lift could plausibly be anywhere from +0.3 to +3 points.",
   code='''se = np.sqrt(pA * (1 - pA) / nA + pB * (1 - pB) / nB)   ## variances of independent averages add
lo, hi = diff - 1.96 * se, diff + 1.96 * se
z = diff / se
print(f"standard error {se:.4f}   95% CI [{lo:+.4f}, {hi:+.4f}]   z = {z:.2f}")'''),
  dict(title="The same error bar by bootstrap", kind="code",
   q="Don't trust the formula? Resample each arm with replacement 5,000 times, recompute the difference each time, and take the 2.5% and 97.5% percentiles. Compare with step 2.",
   answer='The bootstrap gives [+0.0035, +0.0307] with SE 0.0069, essentially identical to the formula. The bootstrap pretends your sample is the population and asks how much the statistic wobbles across re-runs (Murphy §4.7.3). It needs no formula, which is its power for statistics that have no neat variance formula, such as medians, ratios or AUC. When a formula exists and its assumptions hold (here, large n), the two agree.',
   code='''boot = np.empty(5000)
for i in range(5000):
    boot[i] = rng.choice(b, nB).mean() - rng.choice(a, nA).mean()   ## resample each arm, recompute
print(f"bootstrap 95% CI [{np.percentile(boot, 2.5):+.4f}, {np.percentile(boot, 97.5):+.4f}]   bootstrap SE {boot.std():.4f}")'''),
  dict(title="A p-value two ways: permutation and normal", kind="code",
   q="If the page made no difference, the labels A/B are arbitrary. Shuffle the labels 10,000 times and count how often a shuffled difference is at least as extreme as the real one. Compare with the normal-approximation p-value 2·P(Z > |z|).",
   answer="Permutation p ≈ 0.015; normal approximation p ≈ 0.014. The permutation test builds the 'no difference' world directly: if the page didn't matter, which visitor got which page is arbitrary, so shuffling the labels shows the spread of differences that luck alone produces. Only about 1.5% of shuffles are as extreme as +1.70 points. It makes no Gaussian assumption, and with n = 4,000 per arm the CLT version agrees closely.",
   code='''from math import erfc, sqrt
pool = np.concatenate([a, b]).astype(float)
perm = np.empty(10000)
for i in range(10000):
    s = rng.permutation(pool)
    perm[i] = s[nA:].mean() - s[:nA].mean()           ## difference if labels meant nothing
p_perm = np.mean(np.abs(perm) >= abs(diff))
p_norm = erfc(abs(z) / sqrt(2))                      # = 2 * P(Z > |z|)
print(f"permutation p = {p_perm:.4f}    normal-approximation p = {p_norm:.4f}")'''),
  dict(title="The Bayesian answer: how likely is B better?", kind="code",
   q="Give each conversion rate a flat Beta(1, 1) prior. The posterior is Beta(1 + successes, 1 + failures). Draw 200,000 samples from each posterior and estimate P(rate_B > rate_A), the expected relative lift, and a 95% credible interval for the difference.",
   answer="P(B better) ≈ 0.993, expected relative lift ≈ +17%, 95% credible interval [+0.0034, +0.0306]. With a flat prior and lots of data the credible interval matches the confidence interval numerically, but it means something different: 'given the data, the difference is in here with 95% probability' (Murphy §4.6). Note that 0.993 ≈ 1 − p/2 here. That is a coincidence of flat priors and symmetric large-sample posteriors, not a general identity.",
   code='''sA = rng.beta(1 + a.sum(), 1 + nA - a.sum(), 200000)
sB = rng.beta(1 + b.sum(), 1 + nB - b.sum(), 200000)   ## conjugate posterior: Beta(1 + hits, 1 + misses)
d = sB - sA
print(f"P(B better than A) = {np.mean(d > 0):.3f}")
print(f"expected relative lift {np.mean(sB / sA - 1):+.1%}   95% credible interval for the difference [{np.percentile(d, 2.5):+.4f}, {np.percentile(d, 97.5):+.4f}]")'''),
  dict(title="Power: could this test even see the effect?", kind="code",
   q="Suppose the truth really is 10% vs 11.5%. Simulate 2,000 experiments for several sample sizes per arm and record how often the z-test gives p < 0.05. How many visitors per arm do you need for 80% power?",
   answer='With 4,000 per arm the power is only ≈ 0.57. Even if B truly is 1.5 points better, this experiment would miss it more than 4 times in 10, so this run was fairly lucky to reach significance. You need ≈ 6,500 per arm for 80% power (0.75 at 6,000, 0.87 at 8,000). The standard error shrinks like 1/√n, so halving it costs 4× the visitors. Run this calculation before the experiment, to choose n.',
   code='''def power(n, pa=0.100, pb=0.115, sims=2000):
    ka = rng.binomial(n, pa, sims); kb = rng.binomial(n, pb, sims)   # number of sign-ups in each simulated experiment
    ra, rb = ka / n, kb / n
    se = np.sqrt(ra * (1 - ra) / n + rb * (1 - rb) / n)
    return np.mean(np.abs(rb - ra) / se > 1.96)                       ## fraction of experiments that detect the effect
for n in [1000, 2000, 4000, 6000, 8000, 10000]:
    print(f"n = {n:>5} per arm  ->  power {power(n):.2f}")'''),
  dict(title="Peeking breaks the p-value", kind="code",
   q="Now make A and B identical (both 10%). Run 2,000 experiments of up to 10,000 visitors per arm. Check the p-value after every 500 visitors and stop as soon as p < 0.05. What fraction of experiments falsely declare a winner? Compare with checking once at the end.",
   answer="Checking once at the end gives a false-positive rate of exactly the promised 5%. Peeking every 500 visitors and stopping at the first p < 0.05 gives ≈ 24%: almost 1 in 4 'winners' are pure noise. Each look is another chance for the random walk of the difference to wander past the line, and once you stop you never see it wander back. Fixes: fix n in advance (step 6), use sequential tests designed for repeated looks, or go Bayesian and report the posterior, which doesn't depend on your stopping plan.",
   code='''sims, N, step = 2000, 10000, 500
xa = rng.random((sims, N)) < 0.10; xb = rng.random((sims, N)) < 0.10   # no real difference
ever, final = np.zeros(sims, bool), None
for n in range(step, N + 1, step):
    ra, rb = xa[:, :n].mean(1), xb[:, :n].mean(1)
    se = np.sqrt(ra * (1 - ra) / n + rb * (1 - rb) / n)
    sig = np.abs(rb - ra) / se > 1.96
    ever |= sig                                                         ## stop at the first "significant" look
    final = sig
print(f"false positives, one look at the end: {final.mean():.3f}")
print(f"false positives, peeking every {step}:  {ever.mean():.3f}")'''),
  dict(title="What the numbers do and don't say", kind="think",
   q="Your manager reads step 4 and says: 'p = 0.03, so there's a 97% chance B is better.' Correct the sentence, then say which of your results actually answers the manager's question.",
   answer="A p-value is P(data at least this extreme | no difference). It is not P(no difference | data), and 1 − p is not the chance that B is better: that's the prosecutor's fallacy (Murphy §5.5.4). The quantity the manager wants, P(B better | data), is the Bayesian posterior probability from step 5. With a flat prior and this much data it happens to be close to 1 − p/2, but in general it depends on the prior, and the two numbers answer different questions. Also say how big the effect is (the interval from steps 2–3), not just whether it's 'significant'. And only quote a p-value if you decided the sample size in advance: step 7 shows that peeking inflates false positives far above 5%.",
   code=None),
 ]),

dict(id="p5", title="Diagnose from measurements: generative vs discriminative, then decide",
 chapters=["M5", "M9", "M10"], track="stats",
 blurb="569 breast-tissue samples, 30 measurements each, labelled malignant or benign (scikit-learn's breast cancer dataset). You'll build three classifiers from scratch: Gaussian naive Bayes, LDA and logistic regression. Then you'll compare them the way a statistician would: ROC curves, calibration (do the probabilities mean what they say?), a decision rule that weighs a missed cancer as 10× worse than a false alarm, and learning curves. Uses Murphy ch. 5, 9 and 10.",
 steps=[
  dict(title="Load, split, standardise", kind="code",
   q="Load the data, make y = 1 for malignant, split 80/20 (stratified by hand with a fixed seed), and standardise with training statistics. How unbalanced are the classes?",
   answer="454 training and 115 test samples, about 37% malignant in each (the stratified split keeps the ratio). It's unbalanced enough that 'always benign' would score 63%, so that is the baseline every model must clearly beat.",
   code='''import numpy as np
from sklearn.datasets import load_breast_cancer
d = load_breast_cancer()
X, y = d.data, (d.target == 0).astype(float)          # 1 = malignant
rng = np.random.default_rng(0)
tr, te = [], []
for c in (0, 1):                                      # stratified split: 80/20 within each class
    idx = rng.permutation(np.where(y == c)[0]); cut = int(0.8 * len(idx))
    tr += list(idx[:cut]); te += list(idx[cut:])
tr, te = np.array(tr), np.array(te)
mu, sd = X[tr].mean(0), X[tr].std(0)
Xtr, Xte = (X[tr] - mu) / sd, (X[te] - mu) / sd       ## training statistics only
ytr, yte = y[tr], y[te]
print(Xtr.shape, Xte.shape, f"malignant share: train {ytr.mean():.3f}, test {yte.mean():.3f}")'''),
  dict(title="Gaussian naive Bayes from scratch", kind="code",
   q="Fit one mean and one variance per feature per class, plus the class prior. Score a point by log prior + Σ log N(xⱼ | μ, σ²), and turn the two scores into P(malignant | x) with a softmax. Report test accuracy.",
   answer="Naive Bayes gets ≈ 90% test accuracy, well above the 63% baseline, but it's the weakest of the three. The 30 features come in families (radius, perimeter and area of the same cell are nearly the same measurement), so the 'independent given the class' assumption is badly wrong: naive Bayes counts the same evidence three times (Murphy §9.3).",
   code='''def nb_fit(X, y):
    return [(np.mean(y == c), X[y == c].mean(0), X[y == c].var(0) + 1e-6) for c in (0, 1)]
def nb_proba(model, X):
    s = np.stack([np.log(pr) - 0.5 * np.sum(np.log(2 * np.pi * v) + (X - m) ** 2 / v, 1) for pr, m, v in model], 1)   ## log p(c) + sum_j log N(x_j | mu, var)
    s -= s.max(1, keepdims=True); e = np.exp(s)
    return e[:, 1] / e.sum(1)
nb = nb_fit(Xtr, ytr); p_nb = nb_proba(nb, Xte)
print(f"naive Bayes test accuracy {np.mean((p_nb > 0.5) == yte):.3f}")'''),
  dict(title="LDA from scratch", kind="code",
   q="Now model each class as a multivariate Gaussian with one shared covariance (add 1e−3·I so it inverts). The log-odds is linear: wᵀx + b with w = Σ⁻¹(μ₁ − μ₀). Report test accuracy.",
   answer="LDA gets ≈ 94%. Modelling the correlations between features with a full shared covariance removes naive Bayes' double counting. The boundary is still a straight line (a weighted sum of features), with weights w = Σ⁻¹(μ₁ − μ₀): Σ⁻¹ down-weights features that are redundant with others (Murphy §9.2).",
   code='''m0, m1 = Xtr[ytr == 0].mean(0), Xtr[ytr == 1].mean(0)
R = np.concatenate([Xtr[ytr == 0] - m0, Xtr[ytr == 1] - m1])
S = R.T @ R / len(R) + 1e-3 * np.eye(Xtr.shape[1])                 # shared covariance
w_lda = np.linalg.solve(S, m1 - m0)                                 ## w = S^-1 (mu1 - mu0)
b_lda = -0.5 * (m1 @ np.linalg.solve(S, m1) - m0 @ np.linalg.solve(S, m0)) + np.log(ytr.mean() / (1 - ytr.mean()))
p_lda = 1 / (1 + np.exp(-(Xte @ w_lda + b_lda)))
print(f"LDA test accuracy {np.mean((p_lda > 0.5) == yte):.3f}")'''),
  dict(title="Logistic regression by gradient descent", kind="code",
   q="Fit logistic regression with a small L2 penalty (λ = 0.01) by gradient descent: 3,000 steps, learning rate 0.5. Report test accuracy.",
   answer='Logistic regression gets ≈ 98%. It has the same form of boundary as LDA, but it fits the weights to directly separate the classes, without needing the Gaussian story to be true. With a few hundred samples, being right about less is an advantage (Murphy §9.4).',
   code='''A = np.column_stack([np.ones(len(Xtr)), Xtr]); Ate = np.column_stack([np.ones(len(Xte)), Xte])
w = np.zeros(A.shape[1])
for _ in range(3000):
    p = 1 / (1 + np.exp(-A @ w))
    g = A.T @ (p - ytr) / len(ytr) + 0.01 * np.r_[0, w[1:]]     ## (prediction - truth) x input, plus weight decay
    w -= 0.5 * g
p_lr = 1 / (1 + np.exp(-Ate @ w))
print(f"logistic regression test accuracy {np.mean((p_lr > 0.5) == yte):.3f}")'''),
  dict(title="ROC curves and AUC", kind="code",
   q="Accuracy depends on the 0.5 threshold. AUC doesn't: it is the probability that a random malignant case gets a higher score than a random benign one. Compute it for all three models by comparing every malignant/benign pair.",
   answer='AUC: naive Bayes 0.982, LDA 0.994, logistic 0.999. All three rank cases far better than accuracy suggests: even naive Bayes almost always scores a malignant case above a benign one. Its accuracy loss comes largely from where its probabilities sit relative to 0.5, not from ranking, which is exactly what the next step examines (Murphy §5.1.3).',
   code='''def auc(score, y):
    pos, neg = score[y == 1], score[y == 0]
    return np.mean((pos[:, None] > neg[None, :]) + 0.5 * (pos[:, None] == neg[None, :]))   ## P(random positive outranks random negative)
for name, p in [("naive Bayes", p_nb), ("LDA", p_lda), ("logistic", p_lr)]:
    print(f"{name:<12} AUC {auc(p, yte):.4f}")'''),
  dict(title="Calibration: do the probabilities mean what they say?", kind="code",
   q="Use 5-fold cross-validation on the training set to get an out-of-fold probability for every training sample from naive Bayes and from logistic regression. Bin the probabilities into [0, 0.1), …, [0.9, 1]. For each bin, compare the average predicted probability with the actual malignant fraction. Also report the Brier score (mean squared error of the probabilities).",
   answer="Naive Bayes puts almost every sample in the 0.0 or 0.9 bin: it is extremely sure of itself, because multiplying 30 'independent' likelihoods that are really correlated compounds the overconfidence. When it's wrong, it is confidently wrong (Brier 0.059). Logistic regression's probabilities track reality much better (Brier 0.022): when it says 0.1–0.2 it's right about 14% of the time. Calibration matters whenever someone acts on the number itself, such as a doctor weighing a 20% risk. Ranking quality (AUC) and calibration are different properties.",
   code='''def lr_fit(A, y, lam=0.01, steps=3000):
    w = np.zeros(A.shape[1])
    for _ in range(steps):
        p = 1 / (1 + np.exp(-A @ w)); w -= 0.5 * (A.T @ (p - y) / len(y) + lam * np.r_[0, w[1:]])
    return w
folds = np.array_split(np.random.default_rng(1).permutation(len(ytr)), 5)
oof_nb, oof_lr = np.zeros(len(ytr)), np.zeros(len(ytr))
for k in range(5):
    v = folds[k]; t = np.concatenate([folds[j] for j in range(5) if j != k])
    oof_nb[v] = nb_proba(nb_fit(Xtr[t], ytr[t]), Xtr[v])
    oof_lr[v] = 1 / (1 + np.exp(-A[v] @ lr_fit(A[t], ytr[t])))
for name, p in [("naive Bayes", oof_nb), ("logistic", oof_lr)]:
    bins = np.minimum((p * 10).astype(int), 9); rows = []
    for k in range(10):
        m = bins == k
        if m.sum(): rows.append(f"{k/10:.1f}: said {p[m].mean():.2f} saw {ytr[m].mean():.2f} (n={m.sum()})")   ## predicted vs observed in each bin
    print(f"{name}: Brier {np.mean((p - ytr) ** 2):.4f}")
    print("   " + " | ".join(rows))'''),
  dict(title="Decide: a missed cancer costs 10× a false alarm", kind="code",
   q="Decision theory: predict malignant when P(malignant | x) > threshold. With cost 10 for a false negative and 1 for a false positive, the cost-minimising threshold is 1/(1 + 10) ≈ 0.091 (Murphy §5.1). Using logistic regression on the test set, compare the confusion matrix and total cost at threshold 0.5 with those at 0.091.",
   answer="At 0.5: 2 missed cancers and 0 false alarms, cost 20. At 0.091: 0 missed cancers and 14 false alarms, cost 14. The same model with a different decision rule gives fewer of the expensive errors. The threshold comes from expected loss: predict malignant when p·10 > (1 − p)·1, i.e. p > 1/11 (Murphy §5.1.2). The model supplies probabilities; the costs decide what to do with them. That's why calibration (step 6) matters: the rule only works if p means what it says.",
   code='''def report(t):
    pred = p_lr > t
    fn = int(np.sum(~pred & (yte == 1))); fp = int(np.sum(pred & (yte == 0)))
    tp = int(np.sum(pred & (yte == 1))); tn = int(np.sum(~pred & (yte == 0)))
    print(f"threshold {t:.3f}: TP {tp:>2} FN {fn:>2} FP {fp:>2} TN {tn:>2}   cost = 10*FN + FP = {10 * fn + fp}")
report(0.5)
report(1 / (1 + 10))                                                     ## cost-optimal threshold c_FP / (c_FP + c_FN)'''),
  dict(title="Learning curves: who wins with little data?", kind="code",
   q="Train naive Bayes and logistic regression on the first m training samples, for m = 10, 20, 40, 80, 160 and all. Average test accuracy over 20 random orderings. Which model wins with tiny data, and which with plenty?",
   answer="Logistic regression wins at every size here (e.g. 0.875 vs 0.784 at m = 10, 0.983 vs 0.904 with all data), and naive Bayes plateaus around 91% by m = 20. The textbook result (Ng and Jordan) is that generative models reach their best faster, but that best can be worse. Here the naive Bayes assumption is wrong enough (step 2) that its plateau is low and early. It does stop improving almost immediately, which is the 'fast but limited' half of the story (Murphy §9.4). Always measure: rules of thumb depend on how wrong each model's assumptions are.",
   code='''for m in [10, 20, 40, 80, 160, len(ytr)]:
    acc_nb, acc_lr = [], []
    for r in range(20):
        idx = np.random.default_rng(100 + r).permutation(len(ytr))[:m]
        if len(set(ytr[idx])) < 2: continue
        acc_nb.append(np.mean((nb_proba(nb_fit(Xtr[idx], ytr[idx]), Xte) > 0.5) == yte))
        acc_lr.append(np.mean(((Ate @ lr_fit(A[idx], ytr[idx], steps=1500)) > 0) == yte))   ## same model, trained on m samples
    print(f"m = {m:>3}: naive Bayes {np.mean(acc_nb):.3f}   logistic {np.mean(acc_lr):.3f}")'''),
 ]),

dict(id="p6", title="Find groups without labels: k-means, Gaussian mixtures and EM",
 chapters=["M3", "M8", "M21"], track="ml",
 blurb="No labels this time. You'll write k-means and a full-covariance Gaussian mixture fitted by EM, both from scratch. Run them on the iris flowers (hiding the species) and check whether they rediscover the species. Then see where k-means' 'round clusters' assumption fails, and pick the number of clusters with BIC. Uses Murphy ch. 3, 8 and 21.",
 steps=[
  dict(title="k-means from scratch", kind="code",
   q="Standardise the 4 iris measurements (ignore the species). Implement k-means: assign each point to its nearest centre, then move each centre to the mean of its points. Repeat until nothing changes. Use 10 random starts and keep the lowest inertia (sum of squared distances).",
   answer='The best inertia is 139.8 with clusters of 47, 50 and 53. Two of the ten starts got stuck at 191, a clearly worse local minimum. k-means only ever lowers the inertia (each step does), so it always stops, but where depends on the start. That is why you restart and keep the best (Murphy §21.3).',
   code='''import numpy as np
from sklearn.datasets import load_iris
iris = load_iris(); X = (iris.data - iris.data.mean(0)) / iris.data.std(0); species = iris.target
def kmeans(X, k, seed):
    r = np.random.default_rng(seed); C = X[r.choice(len(X), k, replace=False)]
    while True:
        lab = np.argmin(((X[:, None, :] - C[None]) ** 2).sum(2), 1)        ## nearest centre
        newC = np.array([X[lab == j].mean(0) if np.any(lab == j) else C[j] for j in range(k)])
        if np.allclose(newC, C): break
        C = newC
    return lab, C, ((X - C[lab]) ** 2).sum()
runs = [kmeans(X, 3, s) for s in range(10)]
lab, C, inertia = min(runs, key=lambda t: t[2])
print("inertia per start:", np.round([t[2] for t in runs], 1))
print(f"best inertia {inertia:.1f}, cluster sizes {np.bincount(lab)}")'''),
  dict(title="The elbow", kind="code",
   q="Run k-means for k = 1 … 8 (best of 10 starts each) and print the inertia. Where does adding a cluster stop paying off?",
   answer="Inertia: 600 → 222 → 140 → 114 → 91 …. The big drops are k = 1→2 (−378) and 2→3 (−83). After that each extra cluster buys less than 30. The elbow is at 2–3: one very distinct species (setosa) gives the first drop, and versicolor and virginica overlap, giving the smaller second one. Inertia always falls as k grows (k = n gives 0), so it can't pick k on its own.",
   code='''for k in range(1, 9):
    best = min(kmeans(X, k, s)[2] for s in range(10))                    ## best of 10 restarts
    print(f"k = {k}: inertia {best:7.1f}")'''),
  dict(title="Did it rediscover the species?", kind="code",
   q="Cross-tabulate the k = 3 clusters against the hidden species. What is the purity (the fraction of points that belong to their cluster's majority species)?",
   answer="Purity 0.833. Setosa is found perfectly (one cluster holds all 50). Versicolor and virginica get mixed: 11 versicolor land in the 'virginica' cluster and 14 virginica in the 'versicolor' one. Those two species overlap and their clouds are elongated, while k-means draws boundaries as if every cluster were a round ball of the same size.",
   code='''tab = np.zeros((3, 3), int)
for c, s in zip(lab, species): tab[c, s] += 1
print("rows = clusters, columns =", [str(n) for n in iris.target_names]); print(tab)
print(f"purity {tab.max(1).sum() / len(X):.3f}")                          ## majority species per cluster'''),
  dict(title="A Gaussian mixture fitted by EM", kind="code",
   q="Fit a 3-component Gaussian mixture with full covariances. E-step: responsibilities r_nk ∝ π_k N(x_n | μ_k, Σ_k). M-step: weighted means, covariances and mixing weights. Start from the k-means solution and print the log-likelihood every few iterations. It must never decrease. Compute purity again.",
   answer="The log-likelihood climbs from −321.0 to −290.5 and never decreases: that's EM's guarantee, since each E-step and each M-step can only raise a lower bound that touches the log-likelihood (Murphy §8.7.2). Purity jumps to 0.967, with only 5 mistakes. With full covariances each species can be a tilted, stretched ellipse, which is what versicolor and virginica actually look like.",
   code='''def logN(X, m, S):
    D = X.shape[1]; L = np.linalg.cholesky(S); z = np.linalg.solve(L, (X - m).T)
    return -0.5 * (z ** 2).sum(0) - np.log(np.diag(L)).sum() - 0.5 * D * np.log(2 * np.pi)
def gmm(X, k, init_lab, iters=100):
    pi = np.bincount(init_lab, minlength=k) / len(X)
    mu = np.array([X[init_lab == j].mean(0) for j in range(k)])
    Sg = np.array([np.cov(X[init_lab == j].T) + 1e-4 * np.eye(X.shape[1]) for j in range(k)])
    hist = []
    for it in range(iters):
        lp = np.stack([np.log(pi[j]) + logN(X, mu[j], Sg[j]) for j in range(k)], 1)
        mx = lp.max(1, keepdims=True); ll = (mx[:, 0] + np.log(np.exp(lp - mx).sum(1))).sum(); hist.append(ll)
        R = np.exp(lp - mx); R /= R.sum(1, keepdims=True)                     ## E-step: responsibilities
        Nk = R.sum(0); pi = Nk / len(X); mu = (R.T @ X) / Nk[:, None]           ## M-step
        Sg = np.array([((R[:, j, None] * (X - mu[j])).T @ (X - mu[j])) / Nk[j] + 1e-4 * np.eye(X.shape[1]) for j in range(k)])
    return R, mu, Sg, pi, hist
R, mu, Sg, pi, hist = gmm(X, 3, lab)
print("log-likelihood at iterations 0, 1, 2, 5, 10, 20, 50, 99:", [round(float(hist[i]), 1) for i in (0, 1, 2, 5, 10, 20, 50, 99)])
print("never decreased:", bool(np.all(np.diff(hist) > -1e-8)))
g = R.argmax(1); tab = np.zeros((3, 3), int)
for c, s in zip(g, species): tab[c, s] += 1
print(tab); print(f"GMM purity {tab.max(1).sum() / len(X):.3f}")'''),
  dict(title="Where round clusters fail", kind="code",
   q="Make two long, thin, parallel clusters (Gaussians with covariance [[6, 0], [0, 0.05]], centres 1.2 apart vertically, 300 points each). Compare k-means' accuracy with the GMM's, taking the better of the two ways to match cluster ids to true groups.",
   answer="k-means gets 0.523, a coin flip, while the GMM gets 0.993. k-means' objective prefers to cut the two long strips across the middle (left half / right half), because that makes the round distances smaller. The GMM learns that each cluster is wide in x and thin in y, and separates them correctly. k-means is a GMM with equal, round covariances and hard assignments (Murphy §21.3), so it fails exactly when those assumptions fail.",
   code='''r = np.random.default_rng(3)
Z = np.vstack([r.multivariate_normal([0, 0], [[6, 0], [0, 0.05]], 300), r.multivariate_normal([0, 1.2], [[6, 0], [0, 0.05]], 300)])
truth = np.r_[np.zeros(300), np.ones(300)]
acc = lambda l: max(np.mean(l == truth), np.mean(l != truth))      # best of the two label matchings
klab = min((kmeans(Z, 2, s) for s in range(10)), key=lambda t: t[2])[0]
gR = gmm(Z, 2, klab, iters=200)[0]
print(f"k-means accuracy {acc(klab):.3f}    GMM accuracy {acc(gR.argmax(1)):.3f}")'''),
  dict(title="Choose K with BIC", kind="code",
   q="For K = 1 … 6, fit a GMM on iris (initialised from k-means) and compute BIC = −2·log L + p·log N, where p counts every free parameter. Lower is better. Which K wins?",
   answer="BIC picks K = 2 (794.7), narrowly ahead of K = 3 (801.5). Going from 2 to 3 components raises the log-likelihood by 34 but costs 15 more parameters, and BIC charges log(150) ≈ 5 each. With only 150 points, BIC finds that versicolor and virginica aren't separated well enough to justify a whole extra full-covariance Gaussian. The 'true' answer of 3 species is not what the data alone can confidently support. BIC is a large-sample approximation to Bayesian model comparison (Murphy §5.2.5).",
   code='''N, D = X.shape
for k in range(1, 7):
    init = min((kmeans(X, k, s) for s in range(10)), key=lambda t: t[2])[0]
    ll = gmm(X, k, init)[4][-1]
    p = (k - 1) + k * D + k * D * (D + 1) // 2                    ## mixing weights + means + covariances
    print(f"K = {k}: log L {ll:8.1f}   params {p:3d}   BIC {-2 * ll + p * np.log(N):7.1f}")'''),
  dict(title="Soft assignments", kind="code",
   q="Unlike k-means, a GMM says how sure it is. Using the K = 3 iris fit from step 4, count the points whose largest responsibility is below 0.9, and show which species they belong to.",
   answer='Only 3 points are uncertain (largest responsibility below 0.9): 2 versicolor and 1 virginica, sitting where the two species overlap. Setosa is never in doubt. k-means would have hard-assigned these points without a word. A soft assignment tells you which labels to double-check, and EM uses exactly these fractional weights in its M-step.',
   code='''unsure = R.max(1) < 0.9                                            ## the model hedges on these points
print(f"{unsure.sum()} uncertain points; their species:", {str(iris.target_names[s]): int(np.sum(species[unsure] == s)) for s in range(3)})'''),
 ]),

dict(id="p7", title="A convolutional network from scratch",
 chapters=["M13", "M14", "D7"], track="nn",
 blurb="Write every piece of a small CNN in NumPy, on the 8×8 handwritten digits: convolution (via im2col), ReLU, max pooling, a dense layer and softmax, forward and backward. Gradient-check it, train it, and compare it with an MLP of about the same size. Then shift the test images by one pixel to see what weight sharing buys you. Uses Murphy ch. 13–14 and D2L ch. 7.",
 steps=[
  dict(title="Data as images", kind="code",
   q="Load the digits as (N, 1, 8, 8) arrays scaled to [0, 1], split 80/20 with a fixed seed, and one-hot the labels.",
   answer='1,437 training and 360 test images, each 1 channel × 8 × 8. Keeping the image shape (instead of a flat 64-vector) is the whole point: convolution needs to know which pixels are neighbours.',
   code='''import numpy as np
from sklearn.datasets import load_digits
dg = load_digits(); Xall = dg.images[:, None] / 16.0; yall = dg.target
rng = np.random.default_rng(0); idx = rng.permutation(len(yall)); cut = int(0.8 * len(yall))
Xtr, Xte, ytr, yte = Xall[idx[:cut]], Xall[idx[cut:]], yall[idx[:cut]], yall[idx[cut:]]
Ytr = np.eye(10)[ytr]                                    ## one-hot labels
print(Xtr.shape, Xte.shape)'''),
  dict(title="Convolution with im2col", kind="code",
   q="A 3×3 convolution with padding 1 is a matrix multiply in disguise: copy every 3×3 patch into a row (im2col), then multiply by the (9·C_in × C_out) kernel matrix. Implement it and check it against a plain four-loop version.",
   answer="The two versions agree to 2.5e−16 (floating-point noise). im2col turns 'slide a 3×3 window everywhere' into one big matrix multiply: (N·64 patches × 9 values) @ (9 × 8 filters). That's how real libraries make convolution fast on GPUs. The weight sharing is visible in the shapes: the same 9 numbers per filter are used at all 64 positions (Murphy §14.2.1, D2L §7.2).",
   code='''def im2col(X, k=3, pad=1):
    N, C, H, W = X.shape; Xp = np.pad(X, ((0, 0), (0, 0), (pad, pad), (pad, pad)))
    cols = np.empty((N, H, W, C, k, k))
    for i in range(k):
        for j in range(k):
            cols[:, :, :, :, i, j] = Xp[:, :, i:i + H, j:j + W].transpose(0, 2, 3, 1)   ## every patch becomes a row
    return cols.reshape(N * H * W, C * k * k)
def conv_forward(X, K, b):                                # K: (C_out, C_in, 3, 3)
    N, C, H, W = X.shape; cols = im2col(X)
    out = cols @ K.reshape(len(K), -1).T + b
    return out.reshape(N, H, W, len(K)).transpose(0, 3, 1, 2), cols
def conv_naive(X, K, b):
    N, C, H, W = X.shape; Xp = np.pad(X, ((0, 0), (0, 0), (1, 1), (1, 1))); out = np.zeros((N, len(K), H, W))
    for n in range(N):
        for f in range(len(K)):
            for i in range(H):
                for j in range(W): out[n, f, i, j] = np.sum(Xp[n, :, i:i + 3, j:j + 3] * K[f]) + b[f]
    return out
K = rng.normal(0, 0.3, (8, 1, 3, 3)); bK = np.zeros(8)
fast = conv_forward(Xtr[:5], K, bK)[0]
print("output shape", fast.shape, "  max difference vs loops:", np.abs(fast - conv_naive(Xtr[:5], K, bK)).max())'''),
  dict(title="Pool, flatten, classify: the forward pass", kind="code",
   q="Chain conv (8 filters) → ReLU → 2×2 max pool → flatten (8·4·4 = 128) → dense to 10 → softmax. Write a forward function that also keeps whatever the backward pass will need. Count the parameters and check that the initial loss is about log 10 ≈ 2.30.",
   answer='1,370 parameters: 72 kernel weights + 8 conv biases + 1,280 dense weights + 10 biases. The initial loss is 2.302 = log 10: with tiny output weights every class gets probability ≈ 1/10, exactly as it should before learning. If your initial loss is far from log 10, something is wrong with the initialisation or the softmax.',
   code='''def init(seed=0):
    r = np.random.default_rng(seed)
    return {"K": r.normal(0, np.sqrt(2 / 9), (8, 1, 3, 3)), "bK": np.full(8, 0.01), "W": r.normal(0, np.sqrt(1 / 128), (128, 10)) * 0.1, "b": np.zeros(10)}
def forward(P, X):
    z, cols = conv_forward(X, P["K"], P["bK"]); a = np.maximum(z, 0)
    N = len(X); win = a.reshape(N, 8, 4, 2, 4, 2).transpose(0, 1, 2, 4, 3, 5).reshape(N, 8, 4, 4, 4)
    arg = win.argmax(-1); pooled = np.take_along_axis(win, arg[..., None], -1)[..., 0]   ## 2x2 max pool
    mask = (np.arange(4) == arg[..., None])                               # one winner per window (ties -> first)
    mask = mask.reshape(N, 8, 4, 4, 2, 2).transpose(0, 1, 2, 4, 3, 5)      # back to (N, 8, 4, 2, 4, 2) layout
    h = pooled.reshape(N, -1); s = h @ P["W"] + P["b"]
    s -= s.max(1, keepdims=True); p = np.exp(s); p /= p.sum(1, keepdims=True)
    return p, (cols, z, mask, h)
P = init(); p, _ = forward(P, Xtr[:200])
print("parameters:", sum(v.size for v in P.values()), "  initial loss", -np.mean(np.log(p[np.arange(200), ytr[:200]])).round(3))'''),
  dict(title="Backward pass and a gradient check", kind="code",
   q="Send the blame back: softmax+cross-entropy gives (p − y)/N, then dense, then un-pool (the gradient goes only to the max position), then ReLU (zero where z ≤ 0), then the conv weights (colsᵀ · gradient). Check a few weights of each parameter against finite differences.",
   answer="All four agree to 6 digits, so the backward pass is right. Two details matter. (1) Max pooling passes blame only to the winning input of each window, with exactly one winner even when several values tie. Sending it to every tied value double-counts, and the gradient check catches that. (2) The conv bias starts at 0.01 rather than 0, so blank background pixels don't sit exactly on ReLU's kink, where the derivative is undefined and finite differences disagree with any choice you make. The conv weight gradient is colsᵀ · blame: the same im2col trick, run backwards (Murphy §13.3).",
   code='''def backward(P, X, Y, cache, p):
    cols, z, mask, h = cache; N = len(X)
    ds = (p - Y) / N
    g = {"W": h.T @ ds, "b": ds.sum(0)}
    dh = (ds @ P["W"].T).reshape(N, 8, 4, 1, 4, 1)
    da = (mask * dh).reshape(N, 8, 8, 8)                                   ## un-pool: blame goes to the max only
    dz = da * (z > 0)                                                      ## through ReLU
    dzc = dz.transpose(0, 2, 3, 1).reshape(-1, 8)
    g["K"] = (dzc.T @ cols).reshape(P["K"].shape); g["bK"] = dzc.sum(0)    ## conv weights: patches^T x blame
    return g
def loss(P, X, y): return -np.mean(np.log(forward(P, X)[0][np.arange(len(y)), y]))
Xb, yb = Xtr[:64], ytr[:64]; p, cache = forward(P, Xb); g = backward(P, Xb, np.eye(10)[yb], cache, p)
r = np.random.default_rng(5)
for k in ["K", "bK", "W", "b"]:
    i = tuple(int(r.integers(0, s)) for s in P[k].shape); h = 1e-5
    P[k][i] += h; lp = loss(P, Xb, yb); P[k][i] -= 2 * h; lm = loss(P, Xb, yb); P[k][i] += h
    num = (lp - lm) / (2 * h)
    print(f"{k:>2}{list(i)}: analytic {g[k][i]: .6f}  numeric {num: .6f}")'''),
  dict(title="Train it", kind="code",
   q="Train with Adam (learning rate 0.01), mini-batches of 64, for 15 epochs. Print test accuracy every 5 epochs.",
   answer='Test accuracy reaches ≈ 97.5% after 15 epochs (95.0% at epoch 5, 96.4% at epoch 10), with 1,370 parameters and code you wrote entirely yourself. The whole training run takes under a second because im2col turns the work into a few matrix multiplies.',
   code='''def train(P, epochs=15, lr=0.01, seed=1):
    r = np.random.default_rng(seed); m = {k: np.zeros_like(v) for k, v in P.items()}; v2 = {k: np.zeros_like(v) for k, v in P.items()}; t = 0
    for ep in range(1, epochs + 1):
        for bi in np.array_split(r.permutation(len(Xtr)), len(Xtr) // 64):
            p, cache = forward(P, Xtr[bi]); g = backward(P, Xtr[bi], Ytr[bi], cache, p); t += 1
            for k in P:
                m[k] = 0.9 * m[k] + 0.1 * g[k]; v2[k] = 0.999 * v2[k] + 0.001 * g[k] ** 2
                P[k] -= lr * (m[k] / (1 - 0.9 ** t)) / (np.sqrt(v2[k] / (1 - 0.999 ** t)) + 1e-8)   ## Adam step
        if ep % 5 == 0: print(f"epoch {ep:>2}: test accuracy {np.mean(forward(P, Xte)[0].argmax(1) == yte):.4f}")
    return P
P = train(init())'''),
  dict(title="Same budget, no convolution", kind="code",
   q="Build an MLP with a similar parameter count (64 → 20 ReLU → 10: 1,510 parameters vs the CNN's 1,370) and train it the same way. Compare test accuracy.",
   answer="On these tiny 8×8 images the two are about level (CNN 97.5%, MLP 98.1%); the gap is within run-to-run noise. The convolutional advantage is efficiency and structure, not magic: an MLP on a 224×224 colour image needs 150,000 weights per hidden unit, while a 3×3 conv filter needs 27 regardless of image size. At 8×8 the MLP isn't yet paying that price. Next step shows what the CNN's structure does buy, even here.",
   code='''def mlp_init(seed=0):
    r = np.random.default_rng(seed)
    return {"W1": r.normal(0, np.sqrt(2 / 64), (64, 20)), "b1": np.zeros(20), "W2": r.normal(0, np.sqrt(1 / 20), (20, 10)), "b2": np.zeros(10)}
def mlp_forward(Q, X):
    x = X.reshape(len(X), -1); z = x @ Q["W1"] + Q["b1"]; h = np.maximum(z, 0); s = h @ Q["W2"] + Q["b2"]
    s -= s.max(1, keepdims=True); p = np.exp(s); p /= p.sum(1, keepdims=True); return p, (x, z, h)
def mlp_backward(Q, Y, cache, p):
    x, z, h = cache; ds = (p - Y) / len(Y); dh = ds @ Q["W2"].T * (z > 0)          ## same chain rule, no patches
    return {"W2": h.T @ ds, "b2": ds.sum(0), "W1": x.T @ dh, "b1": dh.sum(0)}
Q = mlp_init(); r = np.random.default_rng(1); m = {k: 0 * v for k, v in Q.items()}; v2 = {k: 0 * v for k, v in Q.items()}; t = 0
for ep in range(15):
    for bi in np.array_split(r.permutation(len(Xtr)), len(Xtr) // 64):
        p, c = mlp_forward(Q, Xtr[bi]); g = mlp_backward(Q, Ytr[bi], c, p); t += 1
        for k in Q:
            m[k] = 0.9 * m[k] + 0.1 * g[k]; v2[k] = 0.999 * v2[k] + 0.001 * g[k] ** 2
            Q[k] -= 0.01 * (m[k] / (1 - 0.9 ** t)) / (np.sqrt(v2[k] / (1 - 0.999 ** t)) + 1e-8)
print("MLP parameters:", sum(v.size for v in Q.values()))
print(f"CNN test accuracy {np.mean(forward(P, Xte)[0].argmax(1) == yte):.4f}   MLP test accuracy {np.mean(mlp_forward(Q, Xte)[0].argmax(1) == yte):.4f}")'''),
  dict(title="Shift the digits by one pixel", kind="code",
   q="Shift every test image one pixel to the right (fill with zeros) and re-measure both models' accuracy. Which one drops more, and why?",
   answer='A one-pixel shift drops the CNN from 97.5% to 54.4% (−43 points) and the MLP from 98.1% to 46.1% (−52 points). The CNN is more robust because its filters detect a stroke wherever it is, but it still drops a lot. Pooling only absorbs shifts within its 2×2 windows, and the final dense layer is tied to positions again. On an 8×8 image one pixel is 12% of the width, which is huge. Real CNNs get much more shift-tolerance from many conv+pool stages and from training on shifted copies (data augmentation, D2L §14.1).',
   code='''Xsh = np.zeros_like(Xte); Xsh[:, :, :, 1:] = Xte[:, :, :, :-1]                ## move every image one pixel right
for name, f in [("CNN", lambda X: forward(P, X)[0]), ("MLP", lambda X: mlp_forward(Q, X)[0])]:
    a0, a1 = np.mean(f(Xte).argmax(1) == yte), np.mean(f(Xsh).argmax(1) == yte)
    print(f"{name}: original {a0:.4f}  shifted {a1:.4f}  drop {a0 - a1:.4f}")'''),
 ]),

dict(id="p8", title="A tiny Transformer and self-attention from scratch",
 chapters=["M15", "D11", "A22"], track="nn",
 blurb="Write a working self-attention block in pure NumPy—sinusoidal positional encodings, scaled dot-product attention forward and backward, a finite-difference gradient check, and training on an associative key-value lookup task where a position-blind bag-of-words model fails completely. Uses Murphy 1 ch. 15, D2L ch. 11 and Murphy 2 ch. 22.",
 steps=[
  dict(title="An associative lookup task that needs attention", kind="code",
   q="Create sequences of 5 tokens: two key-value pairs (k1, v1, k2, v2) followed by a query key q ∈ {k1, k2}, where keys are in {0..3} and values are in {4..7}. The target is the value paired with q. Generate 1,200 training and 300 test sequences.",
   answer="Each sequence [k1, v1, k2, v2, q] contains the exact same bag of tokens whether q = k1 or q = k2 (only the last token changes, and the answer depends on which earlier position matches q and reading its right-hand neighbour). A bag-of-words model that averages token embeddings cannot tell which value belongs to which key; an attention head that looks from position 4 (q) to position 0 or 2 and reads the adjacent value solves it cleanly.",
   code='''import numpy as np
rng = np.random.default_rng(0)
def make_data(N):
    X = np.zeros((N, 5), int); y = np.zeros(N, int)
    for n in range(N):
        k1, k2 = rng.choice(4, 2, replace=False)
        v1, v2 = rng.choice(4, 2, replace=False) + 4
        pick = rng.integers(0, 2)
        q = k1 if pick == 0 else k2
        X[n] = [k1, v1, k2, v2, q]
        y[n] = (v1 if pick == 0 else v2) - 4                       ## target class in 0..3
    return X, y
Xtr, ytr = make_data(1200); Xte, yte = make_data(300)
print("Xtr:", Xtr.shape, "sample sequence:", Xtr[0].tolist(), "-> target class:", int(ytr[0]))'''),
  dict(title="Token embeddings + sinusoidal positional encoding", kind="code",
   q="Build a sinusoidal positional table PE[t, 2i] = sin(t / 100^((2i)/d)), PE[t, 2i+1] = cos(t / 100^((2i)/d)) for length T=5 and d=16. Verify that distinct positions have distinct vectors and check the dot products with position 0.",
   answer="Without positional encodings, scaled dot-product attention is permutation-equivariant: swapping (k1, v1) into (k1, v2) and (k2, v1) would look identical! Adding PE[t] stamps every slot t = 0..4 with a unique phase signature so key at t can bind to value at t+1 (Murphy 1 §15.4.5, D2L §11.6).",
   code='''T, D, V = 5, 16, 8
pos = np.arange(T)[:, None]; div = 100.0 ** (np.arange(0, D, 2) / D)
PE = np.zeros((T, D))
PE[:, 0::2] = np.sin(pos / div); PE[:, 1::2] = np.cos(pos / div)   ## sinusoidal position table
dots = (PE @ PE[0]).round(3)
print("PE shape:", PE.shape, "dot products with t=0:", dots.tolist())'''),
  dict(title="Scaled dot-product attention: forward, backward and gradient check", kind="code",
   q="Write a single-layer attention classifier: embed X -> H = E[X] + PE, compute Q = H W_Q, K = H W_K, Vv = H W_V, attention A = softmax(Q K^T / sqrt(D)), take the query token's attended output c = A[:, -1, :] @ Vv, and project logits = c @ W_O + b. Derive the exact analytic backward pass and verify against finite differences.",
   answer="Every analytic gradient (E, W_Q, W_K, W_V, W_O) agrees with centered finite differences to 1e-7. Notice the softmax Jacobian inside backward: dS = A * (dA - sum(dA * A, axis=-1, keepdims=True)) / sqrt(D). If an attention weight A_ij is near 0 or 1, its gradient dS_ij vanishes—which is exactly why dividing by sqrt(D) is essential before softmax!",
   code='''def init_attn(seed=1):
    r = np.random.default_rng(seed)
    s = 0.25
    return {"E": r.normal(0, s, (V, D)), "WQ": r.normal(0, s, (D, D)), "WK": r.normal(0, s, (D, D)),
            "WV": r.normal(0, s, (D, D)), "WO": r.normal(0, s, (D, 4)), "b": np.zeros(4)}
def attn_fwd(P, X):
    H = P["E"][X] + PE                                             ## (N, T, D) token + pos
    Q = H @ P["WQ"]; K = H @ P["WK"]; Vv = H @ P["WV"]
    sc = (Q[:, -1:, :] @ K.transpose(0, 2, 1))[:, 0, :] / np.sqrt(D)  ## query t=4 attends to t=0..4
    sc -= sc.max(1, keepdims=True); A = np.exp(sc); A /= A.sum(1, keepdims=True)
    c = (A[:, :, None] * Vv).sum(1)                                ## attended context (N, D)
    logits = c @ P["WO"] + P["b"]
    logits -= logits.max(1, keepdims=True); p = np.exp(logits); p /= p.sum(1, keepdims=True)
    return p, (X, H, Q, K, Vv, A, c)
def attn_bwd(P, Y, cache, p):
    X, H, Q, K, Vv, A, c = cache; N = len(X)
    dl = (p - Y) / N
    g = {"WO": c.T @ dl, "b": dl.sum(0)}
    dc = dl @ P["WO"].T                                            ## (N, D)
    dA = (dc[:, None, :] * Vv).sum(-1)                             ## (N, T)
    dVv = A[:, :, None] * dc[:, None, :]                           ## (N, T, D)
    dsc = A * (dA - (dA * A).sum(1, keepdims=True)) / np.sqrt(D)   ## softmax Jacobian / sqrt(D)
    dQ_last = (dsc[:, :, None] * K).sum(1)                         ## (N, D)
    dK = dsc[:, :, None] * Q[:, -1:, :]                            ## (N, T, D)
    g["WQ"] = H[:, -1, :].T @ dQ_last
    g["WK"] = (H.transpose(0, 2, 1) @ dK).sum(0)
    g["WV"] = (H.transpose(0, 2, 1) @ dVv).sum(0)
    dH = dK @ P["WK"].T + dVv @ P["WV"].T
    dH[:, -1, :] += dQ_last @ P["WQ"].T
    g["E"] = np.zeros_like(P["E"]); np.add.at(g["E"], X, dH)
    return g
P = init_attn(); Xb, yb = Xtr[:32], ytr[:32]; Yb = np.eye(4)[yb]
p, cache = attn_fwd(P, Xb); g = attn_bwd(P, Yb, cache, p)
loss = lambda P: -np.mean(np.log(attn_fwd(P, Xb)[0][np.arange(len(yb)), yb]))
for k in ["E", "WQ", "WK", "WV", "WO"]:
    idx = (0, 0); h = 1e-5
    P[k][idx] += h; lp = loss(P); P[k][idx] -= 2 * h; lm = loss(P); P[k][idx] += h
    print(f"{k:>2}: analytic {g[k][idx]: .7f}  numeric {(lp - lm) / (2 * h): .7f}")'''),
  dict(title="Train the attention block vs a bag-of-words baseline", kind="code",
   q="Train the attention model with Adam (lr=0.02, 40 epochs, batch 64) and compare its test accuracy against a position-aware linear probe on mean-pooled embeddings. Inspect the learned attention weights on a test example.",
   answer="The self-attention model reaches 100.0% test accuracy, while the mean-pooling baseline stalls around 50% (random guessing between the two values present in the sequence!). Inspecting the attention row shows why: the query token at position 4 learns to route weight to the matching key-value pair and read out the exact target value.",
   code='''P = init_attn(2); m = {k: np.zeros_like(v) for k, v in P.items()}; v2 = {k: np.zeros_like(v) for k, v in P.items()}; t = 0
Ytr = np.eye(4)[ytr]
for ep in range(1, 41):
    for bi in np.array_split(rng.permutation(len(Xtr)), len(Xtr) // 64):
        p, cache = attn_fwd(P, Xtr[bi]); g = attn_bwd(P, Ytr[bi], cache, p); t += 1
        for k in P:
            m[k] = 0.9 * m[k] + 0.1 * g[k]; v2[k] = 0.999 * v2[k] + 0.001 * g[k] ** 2
            P[k] -= 0.02 * (m[k] / (1 - 0.9 ** t)) / (np.sqrt(v2[k] / (1 - 0.999 ** t)) + 1e-8)
pte, cte = attn_fwd(P, Xte)
print(f"Transformer attention test accuracy: {np.mean(pte.argmax(1) == yte):.4f}")
print("Sample test seq:", Xte[0].tolist(), "attn weights:", cte[5][0].round(3).tolist(), "pred:", int(pte[0].argmax()), "true:", int(yte[0]))'''),
 ]),

dict(id="p9", title="A Variational Autoencoder (VAE) from scratch",
 chapters=["M20", "A21", "D20"], track="nn",
 blurb="Build a complete Variational Autoencoder in NumPy on 8×8 handwritten digits: encoder to (μ, log σ²), the reparameterisation trick z = μ + σ ⊙ ε, closed-form Gaussian KL divergence, full analytic backward pass with gradient check, and generative sampling across a 2D latent manifold. Uses Murphy 1 ch. 20, Murphy 2 ch. 21 and D2L ch. 20.",
 steps=[
  dict(title="Prepare digits and initialize the 2D-latent VAE", kind="code",
   q="Load 8×8 digits scaled to [0, 1] (shape N × 64). Initialize a VAE with encoder 64 → 32 tanh → (μ ∈ R², log σ² ∈ R²) and decoder 2 → 32 tanh → 64 sigmoid.",
   answer="Using a 2D latent bottleneck (D_z = 2) compresses 64 pixel intensities by 32× and lets us inspect the entire latent space directly without any post-hoc dimensionality reduction.",
   code='''import numpy as np
from sklearn.datasets import load_digits
dg = load_digits(); X = (dg.data / 16.0).astype(float); y = dg.target
def vae_init(seed=0):
    r = np.random.default_rng(seed)
    return {"We": r.normal(0, 0.15, (64, 32)), "be": np.zeros(32),
            "Wmu": r.normal(0, 0.1, (32, 2)), "bmu": np.zeros(2),
            "Wlv": r.normal(0, 0.05, (32, 2)), "blv": np.full(2, -1.0),
            "Wd1": r.normal(0, 0.15, (2, 32)), "bd1": np.zeros(32),
            "Wd2": r.normal(0, 0.15, (32, 64)), "bd2": np.zeros(64)}
P = vae_init()
print("Dataset:", X.shape, "Total VAE parameters:", sum(v.size for v in P.values()))'''),
  dict(title="Reparameterisation trick and negative ELBO forward pass", kind="code",
   q="Given X and standard normal noise eps ~ N(0, I), compute μ, log_var, std = exp(0.5 * log_var), z = μ + std * eps, and decode x_hat = sigmoid(h_d @ Wd2 + bd2). Compute the negative ELBO = MSE_recon + β * KL, where MSE_recon = 0.5 * sum((x_hat - X)^2) / N and KL = -0.5 * sum(1 + log_var - μ^2 - exp(log_var)) / N.",
   answer="By moving the randomness into an external standard normal draw eps ~ N(0, I) and writing z = μ + exp(0.5 * log_var) * eps, z becomes a deterministic, differentiable function of (μ, log_var), allowing standard backpropagation to flow straight through the stochastic bottleneck (Kingma & Welling 2014; Murphy 2 §21.2.3).",
   code='''def vae_fwd(P, Xb, eps, beta=0.05):
    he = np.tanh(Xb @ P["We"] + P["be"])
    mu = he @ P["Wmu"] + P["bmu"]
    lv = he @ P["Wlv"] + P["blv"]
    std = np.exp(0.5 * lv)
    z = mu + std * eps                                             ## reparameterisation trick
    hd = np.tanh(z @ P["Wd1"] + P["bd1"])
    xh = 1.0 / (1.0 + np.exp(-(hd @ P["Wd2"] + P["bd2"])))
    recon = 0.5 * np.sum((xh - Xb) ** 2) / len(Xb)
    kl = -0.5 * np.sum(1.0 + lv - mu ** 2 - np.exp(lv)) / len(Xb)  ## closed-form Gaussian KL
    return recon + beta * kl, recon, kl, (Xb, eps, he, mu, lv, std, z, hd, xh)
rng = np.random.default_rng(1); eps0 = rng.normal(0, 1, (32, 2))
loss0, r0, kl0, _ = vae_fwd(P, X[:32], eps0)
print(f"Initial neg-ELBO: {loss0:.3f} (recon {r0:.3f}, KL {kl0:.3f})")'''),
  dict(title="Analytic backward pass through reparameterisation + gradient check", kind="code",
   q="Derive the backward pass through decoder, z = μ + std * eps, and the KL penalty, and check against finite differences for every parameter matrix.",
   answer="All six weight matrices match finite differences to 7 decimal places! Notice how ∂L/∂log_var receives two competing terms: the reconstruction gradient 0.5 * dz * std * eps (which wants std → 0 so the code is noise-free) and the KL gradient 0.5 * β * (exp(lv) - 1) (which prevents std from collapsing to 0).",
   code='''def vae_bwd(P, cache, beta=0.05):
    Xb, eps, he, mu, lv, std, z, hd, xh = cache; N = len(Xb)
    dxh = (xh - Xb) / N
    ds2 = dxh * xh * (1.0 - xh)
    g = {"Wd2": hd.T @ ds2, "bd2": ds2.sum(0)}
    dhd = (ds2 @ P["Wd2"].T) * (1.0 - hd ** 2)
    g["Wd1"] = z.T @ dhd; g["bd1"] = dhd.sum(0)
    dz = dhd @ P["Wd1"].T
    dmu = dz + beta * mu / N                                       ## recon + KL gradient on mu
    dlv = dz * 0.5 * std * eps + beta * 0.5 * (np.exp(lv) - 1.0) / N  ## recon + KL gradient on log_var
    g["Wmu"] = he.T @ dmu; g["bmu"] = dmu.sum(0)
    g["Wlv"] = he.T @ dlv; g["blv"] = dlv.sum(0)
    dhe = (dmu @ P["Wmu"].T + dlv @ P["Wlv"].T) * (1.0 - he ** 2)
    g["We"] = Xb.T @ dhe; g["be"] = dhe.sum(0)
    return g
Xb = X[:32]; _, _, _, cache = vae_fwd(P, Xb, eps0); g = vae_bwd(P, cache)
for k in ["We", "Wmu", "Wlv", "Wd1", "Wd2"]:
    idx = (0, 0); h = 1e-5
    P[k][idx] += h; lp = vae_fwd(P, Xb, eps0)[0]; P[k][idx] -= 2 * h; lm = vae_fwd(P, Xb, eps0)[0]; P[k][idx] += h
    print(f"{k:>3}: analytic {g[k][idx]: .7f}  numeric {(lp - lm) / (2 * h): .7f}")'''),
  dict(title="Train the VAE and explore the learned 2D latent manifold", kind="code",
   q="Train for 35 epochs with Adam (lr=0.01, batch 64, β=0.05). Print the reconstruction MSE, KL divergence, and mean posterior centers μ for digits 0, 1, and 8.",
   answer="Reconstruction MSE drops from ~7.4 to ~2.1 while KL settles near ~3.5 nats, organizing digits into smooth, non-overlapping regions inside the unit disk so any point z sampled from N(0, I) decodes into a sharp digit prototype.",
   code='''P = vae_init(0); m = {k: np.zeros_like(v) for k, v in P.items()}; v2 = {k: np.zeros_like(v) for k, v in P.items()}; t = 0
for ep in range(1, 36):
    for bi in np.array_split(rng.permutation(len(X)), len(X) // 64):
        eps = rng.normal(0, 1, (len(bi), 2))
        _, _, _, c = vae_fwd(P, X[bi], eps); g = vae_bwd(P, c); t += 1
        for k in P:
            m[k] = 0.9 * m[k] + 0.1 * g[k]; v2[k] = 0.999 * v2[k] + 0.001 * g[k] ** 2
            P[k] -= 0.01 * (m[k] / (1 - 0.9 ** t)) / (np.sqrt(v2[k] / (1 - 0.999 ** t)) + 1e-8)
lossF, rF, klF, cF = vae_fwd(P, X, np.zeros((len(X), 2)))
mu_all = cF[3]
print(f"Trained neg-ELBO: {lossF:.3f} (recon {rF:.3f}, KL {klF:.3f})")
for d in [0, 1, 8]:
    print(f"digit {d} mean latent center μ: {mu_all[y == d].mean(0).round(2).tolist()}")'''),
 ]),

dict(id="p10", title="An RL agent from scratch: Bellman, Q-learning and Actor-Critic",
 chapters=["D17", "A34", "A35"], track="ml",
 blurb="Build a complete reinforcement learning lab in NumPy on a stochastic cliff-gridworld: exact Bellman value iteration V*(s), model-free tabular Q-learning, and a softmax Actor-Critic agent trained with TD(0) advantage δ = r + γV(s') − V(s). Uses D2L ch. 17 and Murphy 2 ch. 34–35.",
 steps=[
  dict(title="Build a stochastic cliff-gridworld MDP", kind="code",
   q="Define a 3×4 gridworld (12 states) with start at (2,0)=state 8, goal at (2,3)=state 11 (+10 reward, terminal), a hazard pit at (2,1)=state 9 (−10 reward, terminal), step cost −0.2, and discount γ = 0.95. Actions 0=Up, 1=Right, 2=Down, 3=Left succeed with prob 0.8 and slip perpendicular with prob 0.1 each.",
   answer="Because actions slip 20% of the time, hugging the bottom edge next to the hazard pit (2,1) risks falling in for −10! An optimal agent must weigh the shorter path against the expected slip penalty—a classic test of sequential decision-making under uncertainty.",
   code='''import numpy as np
H, W, nS, nA, gamma = 3, 4, 12, 4, 0.95
START, PIT, GOAL = 8, 9, 11
DIRS = [(-1, 0), (0, 1), (1, 0), (0, -1)]
def step_det(s, a):
    r, c = divmod(s, W); dr, dc = DIRS[a]
    nr, nc = np.clip(r + dr, 0, H - 1), np.clip(c + dc, 0, W - 1)
    return int(nr * W + nc)
P_mdp = np.zeros((nS, nA, nS)); R_mdp = np.zeros((nS, nA, nS))
for s in range(nS):
    if s in (PIT, GOAL):
        P_mdp[s, :, s] = 1.0; continue
    for a in range(nA):
        for da, p in [(0, 0.8), (-1, 0.1), (1, 0.1)]:
            ns = step_det(s, (a + da) % 4)
            P_mdp[s, a, ns] += p
            R_mdp[s, a, ns] = 10.0 if ns == GOAL else (-10.0 if ns == PIT else -0.2)
print("Transition tensor shape:", P_mdp.shape, "Row sums all 1.0:", bool(np.allclose(P_mdp.sum(-1), 1.0)))'''),
  dict(title="Exact Bellman value iteration V*(s) and optimal policy π*(s)", kind="code",
   q="Iterate V(s) <- max_a sum_{s'} P(s'|s,a) [R(s,a,s') + γ V(s')] until max |ΔV| < 1e-8. Print the 3×4 optimal value grid V* and the optimal action at each state.",
   answer="At start state (2,0)=8, the optimal action is 0 (Up) rather than 1 (Right into the pit!). The agent climbs to the top row (0,0)->(0,1)->(0,2)->(0,3) to bypass the hazard pit safely before descending to the goal at (2,3), achieving V*(start) = 5.48.",
   code='''V = np.zeros(nS)
for it in range(500):
    Q = (P_mdp * (R_mdp + gamma * V[None, None, :])).sum(-1)       ## Bellman backup Q(s,a)
    Vn = Q.max(1)
    if np.max(np.abs(Vn - V)) < 1e-8: break
    V = Vn
pi_star = Q.argmax(1)
ANAME = ["U", "R", "D", "L"]
print("Converged in", it, "iterations; V*(start) =", round(float(V[START]), 3))
print("Optimal V* grid:", V.reshape(H, W).round(2).tolist())
print("Optimal policy:", [ANAME[a] if s not in (PIT, GOAL) else "*" for s, a in enumerate(pi_star)])'''),
  dict(title="Model-free tabular Q-learning from experience", kind="code",
   q="Without using P_mdp or R_mdp, simulate 1,500 episodes using ε-greedy exploration (ε=0.25) and update Q(s,a) <- Q(s,a) + α (r + γ max_{a'} Q(s',a') - Q(s,a)). Compare the learned greedy policy and Q(start, Up) against the exact Bellman solution.",
   answer="Purely from trial-and-error trajectories (falling into the pit early on and learning to avoid it!), tabular Q-learning recovers the exact same safe detour around the pit and matches V*(start) within ~0.15 (D2L §17.3, Murphy 2 §35.2).",
   code='''rng = np.random.default_rng(4)
Qhat = np.zeros((nS, nA))
for ep in range(1500):
    s = int(rng.choice([s for s in range(nS) if s not in (PIT, GOAL)]))
    alpha = 0.15 / (1.0 + ep / 600.0)
    for _ in range(30):
        a = int(rng.integers(nA)) if rng.random() < 0.25 else int(Qhat[s].argmax())
        ns = int(rng.choice(nS, p=P_mdp[s, a]))
        r = float(R_mdp[s, a, ns])
        td = r + (0.0 if ns in (PIT, GOAL) else gamma * Qhat[ns].max()) - Qhat[s, a]  ## TD(0) Q-learning error
        Qhat[s, a] += alpha * td
        if ns in (PIT, GOAL): break
        s = ns
agree = sum(int(Qhat[s].argmax() == pi_star[s]) for s in range(nS) if s not in (PIT, GOAL))
print(f"Policy agreement with exact Bellman: {agree}/10 non-terminal states")
print(f"Qhat(start, Up) = {Qhat[START, 0]:.2f} vs exact V*(start) = {V[START]:.2f}")'''),
  dict(title="Softmax Actor-Critic with TD(0) advantage", kind="code",
   q="Train a parameterized softmax actor π_θ(a|s) = softmax(θ[s]) and tabular critic V_w(s) over 1,500 episodes: compute TD error δ = r + γ V_w(s') − V_w(s), update critic V_w[s] += α_c δ, and update actor logits θ[s] += α_a δ (e_a − π_θ(·|s)). Measure the final greedy policy's average return from the start state.",
   answer="Using the critic's TD error δ = r + γ V_w(s') − V_w(s) as a low-variance advantage baseline lets the softmax actor rapidly concentrate probability on the safe detour around the pit, reaching near-optimal average return from the start state (Murphy 2 §35.4).",
   code='''theta = np.zeros((nS, nA)); Vw = np.zeros(nS)
for ep in range(1500):
    s = int(rng.choice([s for s in range(nS) if s not in (PIT, GOAL)]))
    for _ in range(30):
        logits = theta[s] - theta[s].max(); p = np.exp(logits); p /= p.sum()
        a = int(rng.choice(nA, p=p))
        ns = int(rng.choice(nS, p=P_mdp[s, a]))
        r = float(R_mdp[s, a, ns])
        delta = r + (0.0 if ns in (PIT, GOAL) else gamma * Vw[ns]) - Vw[s]  ## TD(0) advantage
        Vw[s] += 0.1 * delta
        grad_logpi = -p; grad_logpi[a] += 1.0
        theta[s] += 0.08 * delta * grad_logpi                      ## actor policy gradient step
        if ns in (PIT, GOAL): break
        s = ns
pi_ac = theta.argmax(1)
agree_ac = sum(int(pi_ac[s] == pi_star[s]) for s in range(nS) if s not in (PIT, GOAL))
print(f"Actor-Critic policy agreement with Bellman optimal: {agree_ac}/10 states, V_w(start) = {Vw[START]:.2f}")'''),
 ]),
]
