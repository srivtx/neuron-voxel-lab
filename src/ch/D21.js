/* Dive into Deep Learning ch. 21: Recommender Systems — intro, section explanations, easy layer */
Object.assign(CHI, {
  D21: { why: "Modern web platforms have millions of users and millions of items, so each user sees only a tiny sliver of the catalogue. Recommender systems predict which unseen items a user will rate highly or click on next by combining collaborative signals (users who agreed in the past tend to agree in the future) with explicit ratings, implicit interaction logs, user/item embeddings, and sequential or feature-interaction networks.", builds: "ch. 3 (linear models, weight decay), ch. 5 (MLPs), parallel to Murphy 1 ch. 22", sims: ["s7"] }
});
Object.assign(SEC, {
  "D21.1": { t: "Recommender systems bridge information retrieval and machine learning around a sparse user × item interaction matrix R. Collaborative filtering predicts missing entries from patterns across users and items alone without needing hand-crafted item metadata. Signals come in two flavours: explicit feedback (1–5 star ratings, where low stars mean active dislike but most entries are missing Not-At-Random) and implicit feedback (clicks, watch time, purchases — abundant positive-only signals where a 0 means 'unobserved', not 'hated'). Tasks split into rating prediction (minimising RMSE on observed stars) and top-K ranking (Trained with pairwise BPR or listwise losses and evaluated by hit rate, precision@K, or NDCG).", eq: ["explicit: min_{U,V} Σ_{(u,i)∈Ω} (R_{u,i} − (u_uᵀ v_i + b_u + b_i))²;   implicit ranking: P(i >_u j) = σ(ŷ_{u,i} − ŷ_{u,j})", "collaborative filtering either regresses observed explicit ratings R_{u,i} or ranks observed implicit interactions i above unobserved j"] }
});
Object.assign(EASY, {
  "D21.1": "Recommend films either by predicting exact star ratings from people with similar taste, or by learning to rank films someone actually clicked above ones they scrolled past."
});
