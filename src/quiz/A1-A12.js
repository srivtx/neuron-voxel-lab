/* Self-check quizzes: Murphy 2 ch. 1–12 */
Object.assign(QUIZ, {
  A1: [
    ["How does Book 2 extend Book 1's setup?", ["Structured outputs, uncertainty, Bayesian inference and generative/decision models", "It drops probability", "It only adds more layers", "It covers hardware"], 0, "It moves beyond point estimates on iid data."],
    ["Why care about calibrated uncertainty?", ["Decisions and risk depend on how confident predictions truly are", "It makes models smaller", "It speeds training", "It replaces data"], 0, "A wrong but confident prediction is costly."]
  ],
  A2: [
    ["The exponential family has the form p(x|η) = h(x) exp(ηᵀT(x) − A(η)). What is A(η)?", ["The log-partition function; its derivatives give moments of T(x)", "The prior", "The likelihood ratio", "A kernel"], 0, "∇A(η) = E[T(x)]."],
    ["Which relation holds for a Markov chain X→Y→Z?", ["Z ⊥ X | Y", "X ⊥ Y", "Y ⊥ Z", "X = Z"], 0, "Given the present, future is independent of past."],
    ["The change-of-variables rule for y = f(x) (invertible) gives p_Y(y) =", ["p_X(f⁻¹(y)) |det ∂f⁻¹/∂y|", "p_X(f(y))", "p_X(y)", "p_X(y)/y"], 0, "The Jacobian determinant accounts for volume change (basis of flows)."]
  ],
  A3: [
    ["The Bayesian posterior for a conjugate Beta–Bernoulli model after k heads in n flips is…", ["Beta(a+k, b+n−k)", "Beta(a, b)", "Normal", "Uniform"], 0, "Conjugacy keeps the posterior in the same family."],
    ["The Laplace approximation fits…", ["A Gaussian at the posterior mode using the Hessian", "A mixture", "A tree", "A uniform"], 0, "Covariance = inverse Hessian of the negative log posterior."],
    ["Empirical Bayes chooses hyperparameters by…", ["Maximising the marginal likelihood (evidence)", "Cross-validation only", "Prior guess", "Random"], 0, "Integrating out parameters penalises needlessly complex models."]
  ],
  A4: [
    ["In a directed graphical model the joint factorises as…", ["Π p(xᵢ | parents(xᵢ))", "Π p(xᵢ)", "p(x) only", "A sum of potentials"], 0, "Each node conditions on its parents."],
    ["d-separation is used to…", ["Read conditional independencies from a DAG", "Fit parameters", "Sample", "Optimise"], 0, "It reasons about blocked paths."],
    ["Conditioning on a collider (X→Z←Y)…", ["Makes X and Y dependent (explaining away)", "Keeps them independent", "Removes Z", "Has no effect"], 0, "Observing the effect couples its causes."]
  ],
  A5: [
    ["Mutual information I(X;Y) is zero iff…", ["X and Y are independent", "X = Y", "H(X)=0 only", "They are uncorrelated"], 0, "I(X;Y) = KL(p(x,y)‖p(x)p(y))."],
    ["The data-processing inequality says…", ["Processing Y cannot increase information about X", "Processing always adds information", "Entropy is additive", "KL is symmetric"], 0, "For X→Y→Z, I(X;Z) ≤ I(X;Y)."],
    ["The ELBO relates to KL as log p(x) =", ["ELBO + KL(q‖p(z|x))", "ELBO − KL(q‖p)", "ELBO only", "KL only"], 0, "Since KL ≥ 0, the ELBO is a lower bound."]
  ],
  A6: [
    ["Newton's method uses…", ["The Hessian to scale gradient steps", "Only momentum", "Random steps", "Sign of gradient only"], 0, "θ ← θ − H⁻¹g; quadratic convergence near an optimum."],
    ["Natural gradient descent preconditions with…", ["The Fisher information matrix", "The identity", "The Hessian of loss only", "Learning rate decay"], 0, "It follows steepest descent in distribution space (KL)."],
    ["A common trick for constrained optimisation is…", ["Lagrange multipliers / projected steps", "Ignoring constraints", "Random restarts only", "Larger batch"], 0, "KKT conditions characterise the optimum."]
  ],
  A7: [
    ["A key distinction among inference methods is…", ["Exact vs approximate, and deterministic (VI) vs sampling (MCMC)", "CPU vs GPU", "Python vs C", "Training vs test"], 0, "Each trades accuracy, speed and bias."],
    ["Why is exact Bayesian inference usually intractable?", ["The normalising integral p(x)=∫p(x,z)dz has no closed form in high dimensions", "Priors are unknown", "Data is small", "Models are linear"], 0, "Hence VI, MCMC, SMC."]
  ],
  A8: [
    ["The Kalman filter's belief about the state at each step is…", ["A Gaussian updated by predict and update steps", "A uniform", "A particle set", "A tree"], 0, "Exact for linear-Gaussian state-space models."],
    ["The Kalman gain balances…", ["Trust in the prediction vs trust in the new measurement", "Learning rate and decay", "Bias and variance of weights", "Speed and memory"], 0, "Large measurement noise lowers the gain."],
    ["For nonlinear dynamics we can use…", ["EKF/UKF linearisations or particle filters", "Nothing", "Only the plain KF", "Only grids of size 1"], 0, "They approximate the Gaussian propagation."]
  ],
  A9: [
    ["Belief propagation on a tree gives…", ["Exact marginals via message passing", "Approximate marginals only", "Samples", "Gradients"], 0, "Messages are passed in two sweeps."],
    ["On graphs with loops, loopy BP is…", ["Approximate and not guaranteed to converge", "Always exact", "Impossible", "Equivalent to sampling"], 0, "Often works well in practice."],
    ["Expectation propagation approximates…", ["Factors by moment-matching within an exponential family", "Posterior by sampling", "Priors by uniform", "Likelihood by ignoring it"], 0, "It minimises KL(p‖q) locally, unlike VI's KL(q‖p)."]
  ],
  A10: [
    ["Variational inference optimises…", ["The ELBO over a family of tractable distributions q", "The likelihood directly", "A sampler", "The prior"], 0, "Equivalent to minimising KL(q‖posterior)."],
    ["The reparameterisation trick writes z = μ + σ·ε with ε~N(0,1) so that…", ["Gradients can flow through the sample to μ and σ", "z is deterministic", "σ is fixed", "It avoids the KL"], 0, "Lower-variance gradient estimator than score-function methods."],
    ["Mean-field VI assumes…", ["The approximate posterior factorises over variables", "The posterior is exact", "Variables are perfectly correlated", "No prior"], 0, "It tends to underestimate posterior variance."]
  ],
  A11: [
    ["Importance sampling estimates E_p[f] using…", ["Samples from q weighted by p/q", "Samples from p only", "Gradients", "Optimisation"], 0, "Variance explodes if q has lighter tails than p."],
    ["Effective sample size tells you…", ["How many independent samples your weighted samples are worth", "The data size", "The number of chains", "The batch size"], 0, "Low ESS means weight degeneracy."],
    ["Rejection sampling needs…", ["An envelope M·q(x) ≥ p̃(x)", "A Hessian", "A kernel", "A prior only"], 0, "Acceptance probability p̃/(Mq)."]
  ],
  A12: [
    ["Metropolis–Hastings accepts a proposal with probability…", ["min(1, p(x′)q(x|x′) / p(x)q(x′|x))", "Always 1", "p(x′)", "0.5"], 0, "This ensures detailed balance."],
    ["Hamiltonian Monte Carlo uses…", ["Gradients of log p to propose distant, high-acceptance moves", "Random walks only", "Grids", "Optimisation only"], 0, "Simulates physical dynamics with momentum."],
    ["Gibbs sampling updates…", ["One variable at a time from its full conditional", "All at once from the joint", "Randomly", "By gradient"], 0, "It is MH with acceptance probability 1."]
  ]
});
