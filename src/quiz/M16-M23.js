/* Self-check quizzes: Murphy 1 ch. 16–23 */
Object.assign(QUIZ, {
  M16: [
    ["k-nearest neighbours with k=1 has…", ["Low variance, high bias", "Zero training error and high variance", "No hyperparameters", "A linear boundary"], 1, "Every training point is its own neighbour; boundaries are jagged."],
    ["Why does kNN struggle in high dimensions?", ["Distances concentrate, so 'nearest' loses meaning", "It becomes linear", "It needs labels", "It overfits less"], 0, "The curse of dimensionality."],
    ["A Gaussian process predicts with…", ["A mean and a variance at every test input", "Only a point estimate", "A tree", "No uncertainty"], 0, "The kernel defines how correlated function values are."]
  ],
  M17: [
    ["The kernel trick lets us…", ["Compute inner products in a huge feature space without building it", "Skip training", "Avoid labels", "Reduce data"], 0, "k(x,x′) = φ(x)ᵀφ(x′) is evaluated directly."],
    ["An SVM chooses the boundary that…", ["Maximises the margin", "Minimises the number of features", "Is closest to the mean", "Uses all points equally"], 0, "Only support vectors determine it."],
    ["Large RBF bandwidth σ gives a…", ["Very smooth, nearly linear function", "Very wiggly function", "Discontinuous function", "No effect"], 0, "Points far apart still look similar."]
  ],
  M18: [
    ["A decision tree split is chosen to…", ["Maximise impurity reduction (e.g. information gain or Gini)", "Maximise depth", "Equalise group size", "Pick a random feature"], 0, "Greedy, locally optimal splits."],
    ["Random forests reduce variance by…", ["Averaging many decorrelated, bootstrapped trees", "Pruning to one stump", "Using one deep tree", "Boosting"], 0, "Bagging plus random feature subsets."],
    ["Boosting differs from bagging in that…", ["Learners are trained sequentially, each focusing on previous errors", "It uses no data", "It averages in parallel", "It only reduces variance"], 0, "It mainly reduces bias."]
  ],
  M19: [
    ["Data augmentation helps by…", ["Creating label-preserving variants of data, acting as regularisation", "Adding labels for free", "Replacing the model", "Reducing the test set"], 0, "It encodes invariances the model should have."],
    ["Transfer learning typically means…", ["Reusing a pre-trained model and fine-tuning it on a small target set", "Training from scratch", "Moving data between GPUs", "Ignoring the source task"], 0, "Lower layers carry general features."],
    ["Self-training (pseudo-labelling) risks…", ["Confirmation bias: reinforcing its own wrong labels", "Overusing labels", "Underfitting only", "Nothing"], 0, "Confident mistakes become training targets."]
  ],
  M20: [
    ["PCA finds directions that…", ["Maximise projected variance (top eigenvectors of the covariance)", "Minimise the mean", "Separate classes", "Are random"], 0, "Equivalently, minimise reconstruction error."],
    ["t-SNE/UMAP are mainly used for…", ["Visualising neighbourhood structure in 2D/3D", "Training classifiers", "Exact distances", "Compression with decoding guarantees"], 0, "Global distances in them are not reliable."],
    ["An autoencoder with a bottleneck learns…", ["A compressed representation by reconstructing its input", "Labels", "A kernel", "Nothing without labels"], 0, "A linear one recovers the PCA subspace."]
  ],
  M21: [
    ["k-means alternates between…", ["Assigning points to nearest centroid and recomputing centroids", "Splitting and merging trees", "Gradient steps on labels", "Sampling"], 0, "Each step lowers the within-cluster squared distance."],
    ["k-means can fail when…", ["Clusters are non-spherical or very different in size", "k is 2", "Data is centred", "There are many points"], 0, "Gaussian mixtures with full covariances handle this."],
    ["A Gaussian mixture model is fit with…", ["EM: soft assignments (E-step) then parameter updates (M-step)", "A closed form", "Sorting", "Backprop only"], 0, "EM monotonically increases the likelihood."]
  ],
  M22: [
    ["Matrix factorisation for recommenders models rating r_ui as…", ["The dot product of user and item latent vectors", "The mean rating", "A tree path", "A random value"], 0, "Missing entries are predicted by the learned embeddings."],
    ["The 'cold start' problem is…", ["No history for new users/items to learn from", "Slow hardware", "Too many users", "Over-regularisation"], 0, "Content features or popularity priors help."],
    ["Implicit feedback (clicks) differs from ratings because…", ["Absence is not a dislike; negatives are unobserved", "It is more accurate", "It has no noise", "It needs no model"], 0, "So we weight or sample negatives."]
  ],
  M23: [
    ["Node embeddings like DeepWalk/node2vec are learned by…", ["Predicting co-occurrence of nodes on random walks (skip-gram)", "Counting edges only", "Sorting nodes", "Using pixels"], 0, "Nodes near each other on walks get similar vectors."],
    ["A graph convolution layer updates a node by…", ["Aggregating its neighbours' features then applying a learned transform", "Ignoring the graph", "Averaging all nodes in the graph equally", "Deleting edges"], 0, "Stacking layers widens the receptive field."],
    ["Why can too many GNN layers hurt?", ["Over-smoothing: node representations become indistinguishable", "Too few parameters", "Not enough edges", "Labels vanish"], 0, "Repeated averaging washes out differences."]
  ]
});
