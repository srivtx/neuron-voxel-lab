/* Self-check quizzes: Dive into Deep Learning ch. 1–10 */
Object.assign(QUIZ, {
  D1: [
    ["Which ingredients make up a machine learning problem in d2l's framing?", ["Data, model, objective (loss) and optimisation algorithm", "Only data and a GPU", "Rules written by hand", "Labels and a database"], 0, "Learning = tune model parameters to minimise a loss on data."],
    ["What does 'generalisation' mean?", ["Low error on new data from the same distribution", "Low training error", "Using more layers", "Using fewer features"], 0, "Training error alone is not the goal."],
    ["Why did deep learning take off around 2012?", ["Large datasets, GPUs and better training tricks", "A single new equation", "Smaller models", "Symbolic AI"], 0, "AlexNet showed the combination working at scale."]
  ],
  D2: [
    ["What is broadcasting in NumPy/PyTorch?", ["Implicitly expanding size-1 dimensions so shapes match in elementwise ops", "Sending data to a server", "Randomising tensors", "Copying to GPU"], 0, "A (3,1) tensor plus a (1,4) tensor gives (3,4)."],
    ["What does autograd compute?", ["Gradients of a scalar w.r.t. tensors via the computational graph", "Matrix inverses", "Random numbers", "Loss values only"], 0, "Reverse-mode differentiation."],
    ["Why must you zero gradients between PyTorch steps?", ["Gradients accumulate by default", "They are deleted automatically", "To save memory", "To reseed"], 0, ".backward() adds to .grad."]
  ],
  D3: [
    ["Linear regression with squared loss, trained by SGD, updates w by…", ["−η · mean((ŷ−y)·x) over the minibatch", "−η · y", "+η · w", "Random noise"], 0, "That is the gradient of ½(ŷ−y)²."],
    ["What is a minibatch's role?", ["A cheap noisy estimate of the full gradient", "A validation set", "A regulariser only", "A test set"], 0, "Batch size trades speed against gradient noise."],
    ["Weight decay in this chapter corresponds to…", ["L2 regularisation", "Dropout", "Data augmentation", "Early stopping"], 0, "It adds (λ/2)‖w‖² to the loss."]
  ],
  D4: [
    ["Softmax turns logits into…", ["A probability distribution over classes", "Binary labels", "Gradients", "Weights"], 0, "exp(oᵢ)/Σ exp(oⱼ)."],
    ["Why compute cross-entropy from logits with log-sum-exp?", ["Numerical stability (avoid overflow/underflow)", "Speed", "To reduce classes", "It is required by law"], 0, "Subtracting the max before exp avoids inf."],
    ["Distribution shift means…", ["Test data differs from training data distribution", "The learning rate shifts", "Weights move", "Labels are removed"], 0, "e.g. covariate shift, label shift."]
  ],
  D5: [
    ["Dropout during training…", ["Randomly zeros activations and rescales to regularise", "Removes layers permanently", "Increases capacity", "Is used at test time too"], 0, "At test time the full network is used."],
    ["What is the vanishing gradient problem?", ["Gradients shrink through layers so early layers barely learn", "Loss becomes zero", "Weights vanish", "Data vanishes"], 0, "Sigmoid/tanh saturation is a classic cause."],
    ["Why initialise weights with Xavier/He schemes?", ["Keep activation and gradient variance stable across layers", "To make them zero", "To increase loss", "To save memory"], 0, "Symmetry must also be broken."]
  ],
  D6: [
    ["In PyTorch, nn.Module's forward defines…", ["How inputs map to outputs; parameters are registered automatically", "The optimizer", "The dataset", "The loss only"], 0, "Parameters assigned as nn.Parameter/submodules are tracked."],
    ["Lazy initialisation lets you…", ["Skip specifying input dimensions until the first forward pass", "Skip training", "Use no GPU", "Avoid parameters"], 0, "Shapes are inferred."],
    ["model.state_dict() is used to…", ["Save and load parameters", "Train faster", "Add layers", "Plot"], 0, "Serialising weights, not the architecture."]
  ],
  D7: [
    ["A 3×3 convolution on a 32×32 input with padding 1 and stride 1 yields output size…", ["32×32", "30×30", "16×16", "34×34"], 0, "(32 − 3 + 2·1)/1 + 1 = 32."],
    ["Why is a conv layer more parameter-efficient than a dense layer on images?", ["Locality and weight sharing", "It has no bias", "It is linear", "It uses no kernels"], 0, "The same small kernel is reused everywhere."],
    ["What does a 1×1 convolution do?", ["Mixes channels at each pixel", "Nothing", "Downsamples", "Blurs"], 0, "It is a per-pixel dense layer across channels."]
  ],
  D8: [
    ["VGG's key idea was…", ["Stacking many small 3×3 conv blocks", "Using attention", "Using skip connections", "One huge kernel"], 0, "Depth with small kernels beats a few large ones."],
    ["ResNet solved…", ["The degradation problem of very deep nets using skip connections", "Overfitting alone", "Data scarcity", "RNN training"], 0, "Layers learn a residual F(x) relative to identity."],
    ["Batch normalisation…", ["Normalises activations per mini-batch, speeding up and stabilising training", "Normalises labels", "Replaces weights", "Removes bias"], 0, "It uses learned scale and shift."]
  ],
  D9: [
    ["An RNN's hidden state carries…", ["A summary of the past inputs", "The labels", "The weights", "The loss"], 0, "hₜ = f(hₜ₋₁, xₜ)."],
    ["Why use gradient clipping in RNNs?", ["Prevent exploding gradients", "Prevent overfitting", "Reduce data", "Speed GPUs"], 0, "Rescale the gradient when its norm exceeds a threshold."],
    ["Perplexity of a language model is…", ["exp of the average cross-entropy per token", "Accuracy", "Number of parameters", "Sequence length"], 0, "Lower is better; it is the effective branching factor."]
  ],
  D10: [
    ["The LSTM's forget/input/output gates…", ["Control what to erase, write and expose from the memory cell", "Are fixed", "Remove gradients", "Replace embeddings"], 0, "The additive cell update eases gradient flow."],
    ["A GRU compared to an LSTM…", ["Has fewer gates (reset, update) and no separate cell state", "Has more parameters", "Cannot be trained", "Is not recurrent"], 0, "Often similar accuracy, cheaper."],
    ["In encoder–decoder seq2seq, teacher forcing means…", ["Feeding the true previous token to the decoder during training", "Forcing the teacher", "Skipping the decoder", "Using greedy search"], 0, "It speeds training but causes exposure bias."]
  ]
});
