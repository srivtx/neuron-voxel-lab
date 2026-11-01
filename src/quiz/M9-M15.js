/* Self-check quizzes: Murphy 1 ch. 9–15 */
Object.assign(QUIZ, {
  M9: [
    ["LDA assumes each class is modelled as…", ["A Gaussian with a shared covariance matrix", "A uniform ball", "A tree", "A Poisson"], 0, "Shared covariance makes the log-posterior ratio linear in x (a linear boundary)."],
    ["What happens if each class gets its own covariance (QDA)?", ["Boundaries stay linear", "Boundaries become quadratic", "The model becomes non-probabilistic", "Nothing"], 1, "The quadratic terms no longer cancel."],
    ["Naive Bayes assumes features are…", ["Gaussian", "Conditionally independent given the class", "Identical", "Uncorrelated with the label"], 1, "p(x|y)=Π p(xⱼ|y): few parameters, strong assumption."]
  ],
  M10: [
    ["Logistic regression models p(y=1|x) as…", ["wᵀx", "σ(wᵀx), the sigmoid of a linear score", "A tree vote", "wᵀx clipped to [0,1]"], 1, "The sigmoid maps any real score to a probability."],
    ["The gradient of the logistic NLL w.r.t. w is…", ["Σ (σ(wᵀxᵢ) − yᵢ) xᵢ", "Σ yᵢ xᵢ", "Σ xᵢ", "Always 0"], 0, "Prediction error times input; it has the same form as linear regression's gradient."],
    ["On perfectly separable data, unregularised logistic regression…", ["Converges to a finite w", "Has weights diverging to infinity", "Gives p=0.5", "Fails to run"], 1, "Scaling w up always improves the likelihood; regularisation fixes it."]
  ],
  M11: [
    ["The ordinary least squares solution is…", ["w = (XᵀX)⁻¹Xᵀy", "w = Xy", "w = yXᵀ", "w = X⁻¹ only if X is non-square"], 0, "It solves the normal equations XᵀXw = Xᵀy."],
    ["Ridge regression adds λ‖w‖² which…", ["Increases variance", "Shrinks weights, trading a little bias for less variance", "Makes the problem non-convex", "Removes the intercept"], 1, "It also makes XᵀX+λI always invertible."],
    ["Lasso (L1) differs from ridge in that it…", ["Never shrinks", "Drives some weights exactly to zero (sparsity)", "Has a closed form", "Is smooth"], 1, "The L1 ball has corners, so optima often land on axes."]
  ],
  M12: [
    ["A GLM combines…", ["An exponential-family output distribution, a linear predictor and a link function", "Only trees", "A kernel and a prior", "Two neural nets"], 0, "Linear, logistic and Poisson regression are all special cases."],
    ["Poisson regression is suited to…", ["Count data", "Binary labels", "Negative reals", "Images"], 0, "The canonical link is log: the rate is exp(wᵀx)."],
    ["Why is the canonical link convenient?", ["Gradient becomes (mean − y)·x, and the NLL is convex", "It removes the likelihood", "It is non-linear", "It is faster than SGD"], 0, "This gives the same tidy gradient form across all GLMs."]
  ],
  M13: [
    ["Why do we need non-linear activations in an MLP?", ["Stack of linear layers collapses to a single linear map", "To speed up training only", "To reduce parameters", "They are optional"], 0, "Without non-linearity depth adds nothing."],
    ["Backpropagation is…", ["Gradient descent without gradients", "The chain rule applied efficiently from output to input", "Random search", "A kind of dropout"], 1, "It reuses intermediate results so all gradients cost about one extra forward pass."],
    ["ReLU's main advantage over sigmoid in deep nets is…", ["Bounded output", "Gradients do not saturate for positive inputs", "Being smooth everywhere", "Zero-centred"], 1, "Sigmoid gradients vanish for large |z|."]
  ],
  M14: [
    ["A convolution layer shares weights across positions, giving…", ["Translation equivariance and far fewer parameters", "Rotation invariance", "More parameters than dense", "No locality"], 0, "The same filter slides over the image."],
    ["Max pooling mostly provides…", ["Small translation invariance and downsampling", "Learnable features", "Colour", "Normalisation"], 0, "It keeps the strongest response in each window."],
    ["Residual connections (y = x + F(x)) help because…", ["Gradients can flow through the identity path in very deep nets", "They add parameters", "They reduce depth", "They replace ReLU"], 0, "They make optimisation of deep networks much easier."]
  ],
  M15: [
    ["Why do vanilla RNNs struggle with long dependencies?", ["Vanishing/exploding gradients through many time steps", "They have no memory", "They cannot take sequences", "Too few parameters"], 0, "Repeated multiplication by the recurrent Jacobian shrinks or blows up gradients."],
    ["Self-attention computes each output as…", ["A weighted sum of value vectors with weights softmax(QKᵀ/√d)", "The max over positions", "A convolution of fixed width", "An average of all inputs equally"], 0, "Weights are content dependent."],
    ["Why add positional encodings to a Transformer?", ["Attention is permutation-equivariant and otherwise ignores order", "To reduce memory", "To normalise", "To add non-linearity"], 0, "Without them 'dog bites man' equals 'man bites dog'."]
  ]
});
