/* Self-check quizzes: Murphy 2 ch. 13–24 */
Object.assign(QUIZ, {
  A13: [
    ["A particle filter represents the belief as…", ["Weighted samples (particles) propagated and resampled", "A Gaussian", "A table", "A tree"], 0, "Works for nonlinear/non-Gaussian state-space models."],
    ["Resampling in SMC is used to…", ["Combat weight degeneracy by replicating high-weight particles", "Increase variance", "Reduce state size", "Normalise data"], 0, "Too frequent resampling causes sample impoverishment."],
    ["SMC samplers can also estimate…", ["The marginal likelihood", "Only the mean", "Gradients of nothing", "Model size"], 0, "Via the product of average incremental weights."]
  ],
  A14: [
    ["Predictive models in Book 2 emphasise…", ["Uncertainty: p(y|x,D), not just a point prediction", "Speed only", "Unsupervised learning", "Rules"], 0, "Aleatoric and epistemic uncertainty."],
    ["Epistemic uncertainty is…", ["Uncertainty from limited knowledge/data, reducible with more data", "Irreducible noise", "Label noise", "Numeric error"], 0, "Aleatoric is irreducible observation noise."]
  ],
  A15: [
    ["Bayesian logistic regression has no closed-form posterior, so we use…", ["Laplace, VI or MCMC", "OLS", "Nothing", "A lookup"], 0, "The sigmoid breaks conjugacy."],
    ["The probit link uses…", ["The Gaussian CDF", "The sigmoid", "The log", "The identity"], 0, "Similar shape to logistic with lighter tails."],
    ["Generalised additive models extend GLMs by…", ["Replacing wᵀx with a sum of learned smooth functions of each feature", "Adding layers", "Removing the link", "Using trees"], 0, "Interpretable non-linear effects."]
  ],
  A16: [
    ["Why do modern deep nets often need normalisation layers?", ["They stabilise activations/gradients and ease optimisation", "To add parameters", "To save labels", "To reduce data"], 0, "BatchNorm, LayerNorm."],
    ["Overparameterised nets can still generalise. This is linked to…", ["Implicit regularisation of SGD and benign interpolation", "Their small size", "Lack of data", "Linearity"], 0, "Double descent is one signature."],
    ["Scaling laws say loss decreases as a…", ["Power law in compute, data and parameters", "Linear function", "Step function", "Random walk"], 0, "Empirically smooth over many orders of magnitude."]
  ],
  A17: [
    ["A BNN places a distribution over…", ["The weights", "The inputs", "The labels only", "The learning rate"], 0, "Prediction averages over weight uncertainty."],
    ["Deep ensembles estimate uncertainty by…", ["Training several networks from different inits and combining predictions", "Using one net", "Dropout", "Changing loss"], 0, "A strong, simple baseline."],
    ["MC dropout interprets dropout at test time as…", ["Approximate Bayesian inference by averaging stochastic forward passes", "A bug", "Pruning", "Normalisation"], 0, "Variance across passes indicates uncertainty."]
  ],
  A18: [
    ["The kernel in a GP encodes…", ["Prior assumptions on smoothness and structure of f", "Noise level only", "The loss", "The data size"], 0, "RBF gives smooth functions, Matérn rougher ones."],
    ["Sparse GPs with inducing points reduce cost from O(n³) to…", ["O(nm²)", "O(n⁴)", "O(1)", "O(n)"], 0, "m ≪ n inducing points summarise the data."],
    ["The GP marginal likelihood is used to…", ["Learn kernel hyperparameters", "Make predictions only", "Sample", "Compute gradients of data"], 0, "It balances data fit against complexity."]
  ],
  A19: [
    ["Covariate shift is when…", ["p(x) changes between train and test but p(y|x) stays", "Labels change", "Models change", "Loss changes"], 0, "Importance weighting can correct it."],
    ["Conformal prediction gives…", ["Prediction sets with finite-sample coverage guarantees under exchangeability", "Exact posteriors", "Better accuracy", "Faster training"], 0, "Model-agnostic uncertainty."],
    ["Continual learning's main danger is…", ["Catastrophic forgetting of old tasks", "Overfitting to test data", "Too many labels", "Slow GPUs"], 0, "Replay and regularisation (EWC) mitigate it."]
  ],
  A20: [
    ["A generative model learns…", ["p(x) (or p(x|c)) so it can sample new data", "Only p(y|x)", "Decision boundaries only", "Nothing"], 0, "Evaluation uses likelihood, FID, etc."],
    ["Which family gives exact likelihood?", ["Autoregressive models and normalising flows", "GANs", "Plain VAEs", "Diffusion samplers only"], 0, "GANs have no tractable likelihood; VAEs a bound."]
  ],
  A21: [
    ["A VAE's loss is…", ["Reconstruction term + KL(q(z|x)‖p(z))", "Reconstruction only", "KL only", "Adversarial loss"], 0, "The negative ELBO."],
    ["Posterior collapse is when…", ["The decoder ignores z and q(z|x) equals the prior", "z is too large", "The KL is huge", "The encoder is deterministic"], 0, "Powerful decoders encourage it; KL annealing helps."],
    ["β-VAE with β>1…", ["Weights the KL more, encouraging disentangled but blurrier representations", "Removes the KL", "Is a GAN", "Is autoregressive"], 0, "It trades reconstruction for a more factorised latent."]
  ],
  A22: [
    ["Autoregressive models factorise p(x)=", ["Π p(xᵢ | x<ᵢ)", "Π p(xᵢ)", "p(x|z)p(z)", "Σ p(xᵢ)"], 0, "Chain rule of probability."],
    ["Why is sampling from an autoregressive model slow?", ["Tokens are generated sequentially, one at a time", "No likelihood", "It needs a GAN", "Weights are huge"], 0, "Training is parallel with masking; sampling is not."],
    ["Causal masking in a Transformer ensures…", ["Position i cannot attend to future positions", "Fewer parameters", "Bidirectional context", "Random order"], 0, "Preserves the autoregressive factorisation."]
  ],
  A23: [
    ["Normalising flows compute likelihood by…", ["Change of variables with the Jacobian determinant", "Sampling", "A bound", "A discriminator"], 0, "log p(x)=log p(z)+log|det ∂z/∂x|."],
    ["Coupling layers (RealNVP) are designed so that…", ["The Jacobian is triangular and cheap, and the inverse is easy", "The flow is non-invertible", "Training is adversarial", "z is discrete"], 0, "Only half the dimensions are transformed at a time."],
    ["Flows must be…", ["Invertible and have tractable Jacobians", "Non-differentiable", "Linear", "Small"], 0, "Which restricts architecture choices."]
  ],
  A24: [
    ["An energy-based model defines p(x) ∝", ["exp(−E(x))", "E(x)", "1/E(x)", "log E(x)"], 0, "Low energy = high probability."],
    ["Why is training EBMs hard?", ["The partition function Z is intractable", "No parameters", "No gradients ever", "They need labels"], 0, "Contrastive divergence/MCMC estimate its gradient."],
    ["Score matching avoids Z by…", ["Matching ∇ₓ log p(x), which does not depend on Z", "Ignoring the data", "Sampling", "Using GANs"], 0, "Z is constant in x so it vanishes in the gradient."]
  ]
});
