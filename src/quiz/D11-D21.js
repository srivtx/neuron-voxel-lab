/* Self-check quizzes: Dive into Deep Learning ch. 11–21 */
Object.assign(QUIZ, {
  D11: [
    ["Scaled dot-product attention divides QKᵀ by √d because…", ["Large dot products make softmax saturate and gradients vanish", "It normalises labels", "It reduces cost", "It is traditional"], 0, "Variance of the dot product grows with d."],
    ["Multi-head attention lets the model…", ["Attend to different relationships in different subspaces in parallel", "Use less memory", "Skip positions", "Avoid softmax"], 0, "Heads are concatenated and projected."],
    ["Compared to RNNs, Transformers…", ["Process all positions in parallel but cost O(n²) in sequence length", "Are sequential", "Are cheaper for long contexts", "Have no parameters"], 0, "Attention's quadratic cost motivates efficient variants."]
  ],
  D12: [
    ["Momentum helps SGD by…", ["Accumulating a velocity that smooths noise and speeds along consistent directions", "Increasing batch size", "Lowering loss directly", "Removing the learning rate"], 0, "It damps oscillation in narrow valleys."],
    ["Adam combines…", ["Momentum and per-parameter adaptive scaling (RMSProp-like)", "Second-order Newton steps", "Dropout and decay", "Batch norm and SGD"], 0, "It keeps running means of gradient and squared gradient."],
    ["A learning-rate warm-up is useful because…", ["Early adaptive statistics/gradients are unreliable and large steps can destabilise", "It lowers final loss always", "It is required by Adam only", "It adds data"], 0, "Particularly for Transformers."]
  ],
  D13: [
    ["Why is asynchronous GPU execution important to know when benchmarking?", ["You must synchronise before timing or you measure only the launch", "GPUs are slow", "It changes results", "It avoids memory"], 0, "Call torch.cuda.synchronize()."],
    ["Data parallelism splits…", ["The batch across devices with replicated models", "The model layers", "The loss", "The optimizer"], 0, "Gradients are averaged (all-reduce)."],
    ["A hybrid/compiled graph trades…", ["Flexibility for speed through whole-graph optimisation", "Speed for accuracy", "Memory for labels", "Nothing"], 0, "TorchScript/torch.compile style."]
  ],
  D14: [
    ["Image augmentation is most useful when…", ["Data is limited and the transformation preserves the label", "Data is huge only", "Labels change", "At test time only"], 0, "Flips, crops, colour jitter."],
    ["Fine-tuning a pretrained CNN usually…", ["Uses a smaller learning rate for pretrained layers and a new head", "Starts random", "Freezes nothing ever", "Needs more data than scratch"], 0, "Pretrained features are a strong initialisation."],
    ["Intersection over Union (IoU) measures…", ["Overlap between predicted and true boxes", "Accuracy", "Loss", "Speed"], 0, "Area of overlap divided by area of union."]
  ],
  D15: [
    ["word2vec skip-gram learns embeddings by…", ["Predicting context words from a centre word", "Counting characters", "Sorting", "Translating"], 0, "Negative sampling makes it efficient."],
    ["BERT pretraining uses…", ["Masked language modelling (and next sentence prediction in the original)", "Image classification", "Reinforcement learning", "Autoregressive decoding only"], 0, "Bidirectional context fills in masked tokens."],
    ["Subword tokenisation (BPE) helps…", ["Handle rare/unseen words with a fixed vocabulary", "Remove grammar", "Skip embeddings", "Make words longer"], 0, "Frequent pairs are merged repeatedly."]
  ],
  D16: [
    ["Fine-tuning BERT for sentiment adds…", ["A small classification head on the [CLS] representation", "A new Transformer", "A vision model", "Nothing"], 0, "The whole model is usually updated."],
    ["Natural language inference asks…", ["Whether a hypothesis is entailed by, contradicts or is neutral to a premise", "To translate", "To tag parts of speech", "To generate text"], 0, "A three-way sentence-pair classification."],
    ["Beam search vs greedy decoding…", ["Keeps several partial hypotheses to find higher-probability sequences", "Is always worse", "Is random", "Uses no probabilities"], 0, "Beam width trades compute for quality."]
  ],
  D17: [
    ["In an MDP, the Bellman equation expresses…", ["Value of a state in terms of immediate reward plus discounted next-state value", "The loss of a network", "Probabilities of words", "Gradient norm"], 0, "V(s) = maxₐ [r + γ Σ P V(s′)]."],
    ["The exploration–exploitation trade-off is…", ["Trying new actions vs using the best-known one", "Training vs testing", "Bias vs variance", "CPU vs GPU"], 0, "ε-greedy is the simplest remedy."],
    ["Q-learning is 'off-policy' because…", ["It learns the greedy policy's value while following another behaviour policy", "It never explores", "It is supervised", "It needs a model"], 0, "The target uses maxₐ′ Q(s′,a′)."]
  ],
  D18: [
    ["A GP is defined by…", ["A mean function and a covariance (kernel) function", "A set of weights", "A tree", "A loss"], 0, "Any finite set of function values is jointly Gaussian."],
    ["GP posterior variance is smallest…", ["Near observed training points", "Far from data", "At the mean", "Nowhere"], 0, "Far from data it reverts to the prior."],
    ["Exact GP regression costs…", ["O(n³) for n training points", "O(n)", "O(log n)", "O(1)"], 0, "A Cholesky factorisation of the n×n kernel matrix."]
  ],
  D19: [
    ["Random search often beats grid search because…", ["Only a few hyperparameters matter, and random samples try more distinct values of them", "It is exhaustive", "It uses gradients", "It needs less data"], 0, "Grid wastes trials on unimportant axes."],
    ["Successive halving/Hyperband…", ["Give more budget to promising configurations and stop poor ones early", "Train all fully", "Pick at random", "Avoid validation"], 0, "Multi-fidelity optimisation."],
    ["Bayesian optimisation picks the next trial by…", ["Maximising an acquisition function on a surrogate (often a GP)", "Random draw", "Grid", "Gradient"], 0, "Expected improvement balances exploration and exploitation."]
  ],
  D20: [
    ["In a GAN, the discriminator is trained to…", ["Tell real from generated samples", "Generate images", "Compress data", "Predict labels"], 0, "The generator tries to fool it."],
    ["Mode collapse means…", ["The generator produces only a small variety of samples", "The loss is zero", "The discriminator wins", "Training is fast"], 0, "It maps many z to the same few outputs."],
    ["Why can GAN training be unstable?", ["It is a minimax game, not a single minimisation", "Too few parameters", "No gradients exist", "Data is labelled"], 0, "Simultaneous updates can oscillate."]
  ],
  D21: [
    ["Collaborative filtering uses…", ["Patterns in many users' interactions to predict a user's preferences", "Item text only", "Random ratings", "User photos"], 0, "Similar users like similar items."],
    ["AutoRec / neural CF improves matrix factorisation by…", ["Learning non-linear interactions between user and item representations", "Removing embeddings", "Using labels only", "Using trees"], 0, "e.g. MLP over concatenated embeddings."],
    ["Click-through-rate models such as DeepFM combine…", ["Low-order feature interactions (FM) and high-order ones (deep net)", "Only trees", "Only images", "Only RNNs"], 0, "Handles sparse categorical features."]
  ]
});
