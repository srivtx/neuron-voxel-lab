/* Self-check quizzes: Murphy 1 ch. 1–8. Format: [question, [options], correctIndex, explanation] */
Object.assign(QUIZ, {
  M1: [
    ["In supervised learning, what is the key difference between classification and regression?", ["Classification uses more data", "Classification predicts a discrete label, regression a real-valued number", "Regression needs a neural network", "Classification has no loss function"], 1, "Both learn f(x) from labelled pairs; only the output type differs (class label vs continuous value)."],
    ["A model has 0% training error but 40% test error. What is this called?", ["Underfitting", "Overfitting", "Regularisation", "Covariate shift"], 1, "It memorised the training set instead of the pattern, so it does not generalise."],
    ["Why do we keep a held-out validation/test set?", ["To make training faster", "To estimate error on unseen data and choose hyperparameters honestly", "To increase the training set", "To avoid using a loss"], 1, "Training error is optimistic; held-out data estimates generalisation."]
  ],
  M2: [
    ["For a valid probability density p(x), which statement is true?", ["p(x) ≤ 1 everywhere", "p(x) ≥ 0 and it integrates to 1", "p(x) is always symmetric", "p(x) sums to 0"], 1, "Densities can exceed 1 (e.g. a narrow Gaussian), but are non-negative and integrate to 1."],
    ["What does Bayes' rule compute?", ["p(x,y) from p(x)", "p(y|x) from p(x|y), p(y) and p(x)", "The mean of p(x)", "The variance of x"], 1, "p(y|x) = p(x|y)p(y)/p(x): invert a conditional using a prior."],
    ["If X ~ N(μ, σ²), roughly what fraction of mass lies within μ ± 2σ?", ["50%", "68%", "95%", "99.99%"], 2, "The 68–95–99.7 rule: about 95% within two standard deviations."]
  ],
  M3: [
    ["Two variables are independent. What does that imply about their covariance?", ["It is 1", "It is 0", "It is negative", "It is undefined"], 1, "Independence ⇒ zero covariance, but zero covariance does NOT imply independence."],
    ["What does the covariance matrix of a multivariate Gaussian control?", ["Only its mean", "The shape and orientation of its elliptical contours", "Its normalising constant only", "Nothing"], 1, "Eigenvectors give the ellipse axes, eigenvalues their lengths."],
    ["Conditioning a joint Gaussian on one block of variables gives…", ["A uniform distribution", "Another Gaussian", "A Student-t", "A Bernoulli"], 1, "Gaussians are closed under marginalising and conditioning."]
  ],
  M4: [
    ["Maximum likelihood estimation picks parameters that…", ["Minimise the prior", "Maximise the probability of the observed data", "Minimise the number of parameters", "Maximise the entropy"], 1, "θ̂ = argmax p(D|θ), equivalently minimise the negative log-likelihood."],
    ["Adding a Gaussian prior on weights and doing MAP estimation is equivalent to…", ["Dropout", "L2 regularisation (ridge)", "Early stopping only", "Removing the bias"], 1, "−log N(w|0,τ²) is proportional to ‖w‖², i.e. weight decay."],
    ["What does a 95% confidence interval promise?", ["The parameter lies in this interval with 95% probability", "95% of intervals built this way (over repeated samples) contain the true value", "95% of data is inside it", "The estimate is unbiased"], 1, "It is a frequentist statement about the procedure, not about this one interval."]
  ],
  M5: [
    ["A Bayes-optimal classifier under 0-1 loss chooses…", ["The class with highest prior", "The class with highest posterior p(y|x)", "A random class", "The class with the lowest variance"], 1, "Minimising expected 0-1 loss means picking the MAP class."],
    ["If a false negative costs 10× a false positive, the decision threshold on p(y=1|x) should…", ["Move up", "Stay at 0.5", "Move down", "Be 1"], 2, "Predict positive when p > 1/(1+10) ≈ 0.09: be more willing to flag positives."],
    ["Which is a proper scoring rule for probabilistic predictions?", ["Accuracy", "Log loss (cross-entropy)", "Number of correct labels", "Top-1 rate"], 1, "Log loss rewards honest, calibrated probabilities; accuracy ignores confidence."]
  ],
  M6: [
    ["Entropy H(p) measures…", ["The mean of p", "The average surprise/uncertainty of p", "The distance between p and q", "The variance of p"], 1, "H(p) = −Σ p log p; maximal for uniform distributions."],
    ["Is KL divergence KL(p‖q) symmetric?", ["Yes always", "No, KL(p‖q) ≠ KL(q‖p) in general", "Only for Gaussians", "Only for discrete"], 1, "It is non-negative, zero iff p=q, but not symmetric, so it is not a metric."],
    ["Minimising cross-entropy between data and a model is the same as…", ["Maximising the KL divergence", "Maximum likelihood", "Minimising accuracy", "Maximising entropy of data"], 1, "CE = H(p_data) + KL(p_data‖q); the first term is constant in the model."]
  ],
  M7: [
    ["Matrix A is 3×4 and B is 4×2. What is the shape of AB?", ["4×4", "3×2", "2×3", "Not defined"], 1, "Inner dimensions match (4); the result is rows(A)×cols(B)."],
    ["What do the eigenvectors of a symmetric matrix give?", ["Orthogonal directions that A only stretches", "The inverse", "The rank", "The trace"], 0, "Av = λv: along these directions A scales by λ; for symmetric A they are orthogonal."],
    ["The SVD A = UΣVᵀ: the singular values tell you…", ["The sign of A", "How much A stretches along each orthogonal direction (and its effective rank)", "The determinant only", "Nothing about rank"], 1, "Truncating small singular values gives the best low-rank approximation (Eckart–Young)."]
  ],
  M8: [
    ["Gradient descent update is θ ← θ − η∇L(θ). What happens if η is too large?", ["It converges faster always", "It can overshoot and diverge", "Nothing", "It stops"], 1, "Steps can jump across the valley, making the loss grow."],
    ["Why use mini-batch SGD instead of full-batch gradient descent?", ["It is exact", "Cheaper noisy gradient estimates that scale to big data and can escape sharp minima", "It needs no learning rate", "It guarantees the global minimum"], 1, "Each step costs O(batch), and the noise helps exploration."],
    ["For a convex function, any local minimum is…", ["A saddle point", "Also a global minimum", "Always unique", "Impossible"], 1, "Convexity means no spurious local minima (though minima may be flat sets)."]
  ]
});
