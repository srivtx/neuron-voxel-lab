/* Self-check quizzes: Murphy 2 ch. 25–36 */
Object.assign(QUIZ, {
  A25: [
    ["The forward process of a diffusion model…", ["Gradually adds Gaussian noise to data until it is nearly pure noise", "Removes noise", "Trains a GAN", "Compresses data"], 0, "q(xₜ|xₜ₋₁) = N(√(1−βₜ)xₜ₋₁, βₜI)."],
    ["The denoising network is trained to predict…", ["The noise added (or equivalently the score/clean image)", "Labels", "Pixels at random", "The schedule"], 0, "Simple MSE loss on ε."],
    ["Classifier-free guidance…", ["Mixes conditional and unconditional predictions to trade diversity for fidelity", "Needs a classifier", "Removes conditioning", "Is a flow"], 0, "Higher guidance scale means closer prompt adherence."]
  ],
  A26: [
    ["A GAN's minimax objective is…", ["min_G max_D E[log D(x)] + E[log(1−D(G(z)))]", "min of reconstruction", "ELBO", "Likelihood"], 0, "At the optimum the discriminator outputs 1/2."],
    ["Wasserstein GANs improve stability by…", ["Using a smoother distance measure (critic with Lipschitz constraint)", "Using labels", "Using dropout", "Using KL"], 0, "Gradients stay informative when distributions do not overlap."],
    ["FID evaluates…", ["Distance between feature statistics of real and generated images", "Pixel MSE", "Likelihood", "Labels"], 0, "Lower is better."]
  ],
  A27: [
    ["Discovery methods aim to…", ["Find structure (clusters, factors, graphs) without supervision", "Predict labels", "Control agents", "Compress files"], 0, "Latent variable and structure learning."],
    ["Identifiability issues arise because…", ["Different latent parameterisations can explain the same data equally well", "Data is missing labels", "Models are small", "Priors are flat"], 0, "e.g. rotation of factors."]
  ],
  A28: [
    ["Factor analysis differs from PCA by…", ["Modelling per-feature noise variances probabilistically", "Using labels", "Being nonlinear", "Using trees"], 0, "PCA is the isotropic-noise limit (probabilistic PCA)."],
    ["Rotation ambiguity in factor analysis means…", ["Loadings are only identifiable up to an orthogonal transform", "The model is wrong", "No inference is possible", "It needs more data"], 0, "Varimax or sparsity priors pick an interpretable rotation."],
    ["ICA recovers…", ["Statistically independent non-Gaussian sources", "Gaussian clusters", "Principal axes", "Labels"], 0, "It requires non-Gaussianity."]
  ],
  A29: [
    ["A hidden Markov model has…", ["Discrete hidden states with Markov transitions and emissions", "Continuous states only", "No hidden states", "Iid data"], 0, "Forward–backward computes state marginals."],
    ["The Viterbi algorithm finds…", ["The single most likely state sequence", "Marginals", "Parameters", "Gradients"], 0, "Dynamic programming over max-product."],
    ["Modern deep state-space models (S4, Mamba) aim to…", ["Model long sequences with linear-time recurrence/convolution", "Replace probability", "Use graphs", "Avoid GPUs"], 0, "Alternatives to quadratic attention."]
  ],
  A30: [
    ["A GNN's message passing step…", ["Aggregates neighbour information to update each node", "Removes edges", "Orders nodes", "Predicts labels only"], 0, "Permutation-equivariant by design."],
    ["Spectral graph methods rely on…", ["Eigenvectors of the graph Laplacian", "Pixels", "Tokens", "Kernels only"], 0, "Low eigenvalues = smooth signals on the graph."],
    ["Graph attention differs from GCN by…", ["Learning neighbour weights via attention instead of fixed degree-based ones", "Using no edges", "Having no features", "Being linear"], 0, "More expressive aggregation."]
  ],
  A31: [
    ["A Dirichlet process mixture lets the number of clusters…", ["Grow with the data", "Be fixed at 2", "Be zero", "Be negative"], 0, "A nonparametric prior over partitions."],
    ["The Chinese restaurant process describes…", ["The rich-get-richer assignment of points to clusters", "A Markov chain on words", "A tree", "A kernel"], 0, "Larger tables attract more customers; α controls new tables."],
    ["GPs are 'nonparametric' because…", ["Model complexity grows with the amount of data", "They have no hyperparameters", "They are untrained", "They use no kernel"], 0, "The kernel matrix is n×n."]
  ],
  A32: [
    ["Contrastive learning (e.g. SimCLR) trains representations by…", ["Pulling positive pairs together and pushing negatives apart", "Predicting labels", "Reconstruction", "Sampling"], 0, "InfoNCE lower-bounds mutual information."],
    ["Masked autoencoders learn by…", ["Reconstructing masked parts of the input from the rest", "Classifying", "Adversarial play", "Clustering"], 0, "BERT in language, MAE in vision."],
    ["A good representation should be…", ["Useful for many downstream tasks with simple heads", "As large as the input", "Random", "Label-specific only"], 0, "Linear probing measures this."]
  ],
  A33: [
    ["SHAP values explain a prediction by…", ["Fairly attributing it to features using Shapley values from game theory", "Showing the weights", "Pruning", "Sampling"], 0, "Additive, local explanations."],
    ["Saliency/gradient maps can be unreliable because…", ["They may be insensitive to the model or noisy", "They are exact", "They need labels", "They use no gradients"], 0, "Sanity checks reveal this; integrated gradients help."],
    ["An inherently interpretable model example is…", ["A sparse linear model or small decision tree", "A 100-layer net", "A GAN", "A diffusion model"], 0, "Interpretability vs accuracy is a trade-off."]
  ],
  A34: [
    ["Maximising expected utility means choosing the action…", ["With highest expected utility under your beliefs", "With lowest variance", "With highest probability", "At random"], 0, "Decision theory under uncertainty."],
    ["A multi-armed bandit's regret measures…", ["Reward lost versus always pulling the best arm", "Training loss", "Model size", "Variance"], 0, "UCB and Thompson sampling achieve logarithmic regret."],
    ["Thompson sampling picks an arm by…", ["Sampling from the posterior over arm values and choosing the best sample", "Choosing the highest mean", "Random", "Round robin"], 0, "Exploration is automatic from posterior uncertainty."]
  ],
  A35: [
    ["The policy gradient theorem allows…", ["Optimising expected return by gradient ascent on policy parameters", "Exact planning", "Supervised learning", "Value-only methods"], 0, "∇J = E[∇log π · return]."],
    ["Actor–critic methods use…", ["A learned value function (critic) to reduce policy gradient variance", "No policy", "Only rewards", "Only supervision"], 0, "The advantage replaces the raw return."],
    ["Model-based RL…", ["Learns a dynamics model and plans with it, often more sample-efficient", "Needs no data", "Is always better", "Is supervised"], 0, "At the cost of model error."]
  ],
  A36: [
    ["Correlation does not imply causation because…", ["A confounder can drive both variables", "Data is always noisy", "Correlation is non-linear", "Models are small"], 0, "Randomised experiments break confounding."],
    ["The do-operator do(X=x) differs from conditioning on X=x by…", ["Cutting incoming edges to X (an intervention)", "Adding data", "Averaging", "Nothing"], 0, "p(y|do(x)) ≠ p(y|x) in general."],
    ["The backdoor adjustment requires…", ["Conditioning on a set blocking all backdoor paths from X to Y", "Conditioning on all variables", "Conditioning on colliders", "No data"], 0, "p(y|do(x)) = Σ_z p(y|x,z)p(z)."]
  ]
});
