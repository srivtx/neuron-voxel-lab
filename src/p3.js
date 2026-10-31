/* ================= per-station teaching content ================= */
const META = {
s1: { eq: "[a|1|the neuron's answer, between 0 and 1] = [σ|4|the squash. σ(z) = 1/(1+e^−z). Big positive z gives nearly 1, big negative gives nearly 0, and z = 0 gives exactly 0.5]( [w₁|2|weight 1: how much input 1 counts, and in which direction] [x₁|3|input 1: one number describing the example] + [w₂|2|weight 2] [x₂|3|input 2] + [b|2|bias: a nudge. It slides the cliff sideways without turning it] )",
  trying: "Turn a list of numbers into one yes/no opinion. The weighted sum decides which side of a straight line the input falls on. The squash turns 'how far from the line' into 'how sure'.",
  remove: "Remove σ and the output is unbounded, so it can't be read as a probability, and stacked layers collapse into one straight line (station 5). Swap it for a hard step and the surface is flat everywhere except at the cliff, so there is no slope to follow (station 3).",
  kind: "Recipe. Murphy writes it p(y=1|x) = σ(wᵀx + b). The wᵀx is just w₁x₁ + w₂x₂ + … for any number of inputs.",
  refs: ["Murphy §10.2 Binary logistic regression, p. 339", "D2L §3.1.4 Linear regression as a neural network, p. 90", "D2L §5.1 Multilayer perceptrons (activation functions), p. 167"],
  chips: ["Why does sigmoid have that exact formula?", "What does the bias do geometrically?", "Why can't one neuron get all 30 right?"],
  np: `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def neuron(x, w, b):
    z = x @ w + b          # weighted vote: x1*w1 + x2*w2 + b
    return sigmoid(z)      # squash into (0, 1)

x = np.array([1.5, -0.5])
w = np.array([0.6, -0.4])
b = 0.0
print(neuron(x, w, b))     # 0.7503: z = 0.9 + 0.2 = 1.1, sigmoid(1.1)`,
  pt: `import torch

neuron = torch.nn.Linear(2, 1)          # holds w (shape 1x2) and b
with torch.no_grad():
    neuron.weight[:] = torch.tensor([[0.6, -0.4]])
    neuron.bias[:] = 0.0

x = torch.tensor([[1.5, -0.5]])
print(torch.sigmoid(neuron(x)))         # tensor([[0.7503]])` },

s2: { eq: "[L|1|the loss: one number for the whole dataset] = −[1/N|4|average over the N examples, so the number doesn't grow just because you have more data] [Σₙ|4|add up over every example n] [ yₙ log aₙ + (1−yₙ) log(1−aₙ) |3|for a label 1 this is log a; for a label 0 it's log(1−a). Either way it's the log of the probability the neuron gave to the right answer]",
  trying: "Score a whole set of answers with one number, so 'better' means something a computer can chase. Murphy §4.2 derives it: pick the weights under which the labels you saw are most probable. Independent probabilities multiply; the log turns the product into a sum; the minus sign turns 'maximise' into 'minimise'. That's the whole derivation.",
  remove: "Without the log, a terrible answer (p = 0.001) and a so-so one (p = 0.5) differ by 0.5. With the log they differ by 6.2, so the terrible one gets fixed first. Without the average, the loss and its slope grow with the dataset, and you'd retune the step size every time you add data.",
  kind: "Recipe with a proof behind it. Squared error comes from the same derivation if you assume Gaussian noise instead of a coin flip (D2L §3.1.3, Murphy §4.2.5).",
  refs: ["Murphy §4.2 Maximum likelihood estimation, p. 107", "Murphy §6.1 Entropy (cross-entropy), p. 207", "D2L §3.1.3 The normal distribution and squared loss, p. 88", "D2L §4.1 Softmax regression (log-likelihood), p. 125"],
  chips: ["Derive cross-entropy from 'make the labels most probable'", "Why log and not just 1 − p?", "When is squared error the right choice?"],
  np: `import numpy as np

def bce(a, y):
    # -log of the probability given to the right answer, averaged
    a = np.clip(a, 1e-7, 1 - 1e-7)
    return -np.mean(y * np.log(a) + (1 - y) * np.log(1 - a))

def mse(a, y):
    return np.mean((y - a) ** 2)

y = np.array([1, 1, 0])
a = np.array([0.9, 0.01, 0.2])      # 2nd example is confidently wrong
print("cross-entropy:", bce(a, y))   # 1.645, mostly from -log(0.01) = 4.6
print("squared error:", mse(a, y))   # 0.343, the bad one capped at 0.98`,
  pt: `import torch
import torch.nn.functional as F

y = torch.tensor([1., 1., 0.])
a = torch.tensor([0.9, 0.01, 0.2])
print(F.binary_cross_entropy(a, y), F.mse_loss(a, y))

# In practice you pass the raw score z and use the fused, stable version:
z = torch.logit(a)
print(F.binary_cross_entropy_with_logits(z, y))   # same number` },

s3: { eq: "[w|2|the weights, as one list] ← [w|2|the old weights] − [η|4|step size (learning rate): how far to move per step] [∇L|1|the gradient: one slope per weight. It points uphill, so we subtract it]",
  trying: "Find good weights without solving anything. Measure the slope where you stand, take a small step against it, repeat.",
  remove: "Without η you'd jump by the full gradient, which overshoots on steep ground and crawls on flat ground. Without the minus sign you'd climb to the worst weights.",
  kind: "Recipe. Murphy §8.2–8.4 and D2L ch. 12 spend about 100 pages on variants (momentum, Adam, schedules). All of them are this one line with a smarter step.",
  refs: ["Murphy §8.2 First-order methods, p. 282", "Murphy §8.4 Stochastic gradient descent, p. 292", "D2L §2.4 Calculus, p. 54", "D2L §12.4–12.10 SGD to Adam, pp. 493–536"],
  chips: ["Why does the gradient point uphill?", "What decides a good step size?", "How are SGD and Adam different from this?"],
  np: `import numpy as np
rng = np.random.default_rng(0)
N = 30
y = np.arange(N) % 2
centers = np.where(y[:, None] == 1, [0.9, 0.7], [-0.9, -0.7])
X = centers + rng.normal(0, 0.85, size=(N, 2))

def sigmoid(z): return 1 / (1 + np.exp(-z))
w, b, lr = np.array([2.5, -3.0]), 0.0, 0.5

for step in range(201):
    a = sigmoid(X @ w + b)              # forward: every example at once
    grad_w = X.T @ (a - y) / N          # slope per weight (station 4 derives it)
    grad_b = np.mean(a - y)
    if step % 50 == 0:
        loss = -np.mean(y * np.log(a) + (1 - y) * np.log(1 - a))
        print(step, round(loss, 3), w.round(2))
    w -= lr * grad_w                    # step downhill
    b -= lr * grad_b`,
  pt: `import torch
torch.manual_seed(0)
y = (torch.arange(30) % 2).float()
X = torch.randn(30, 2) * 0.85
X[y == 1] += torch.tensor([0.9, 0.7]); X[y == 0] -= torch.tensor([0.9, 0.7])

model = torch.nn.Linear(2, 1)
opt = torch.optim.SGD(model.parameters(), lr=0.5)
for step in range(200):
    loss = torch.nn.functional.binary_cross_entropy_with_logits(model(X).squeeze(1), y)
    opt.zero_grad()      # forget last step's slopes
    loss.backward()      # backprop fills .grad for every weight
    opt.step()           # w -= lr * w.grad
print(loss.item())` },

s4: { eq: "[∂L/∂w₁|1|how much the loss moves per unit nudge of w₁] = [∂L/∂a|3|blame at the output] · [∂a/∂z|3|slope of the squash, a(1−a)] · [∂z/∂w₁|3|slope of the weighted sum with respect to w₁, which is just x₁] = [(a − y)|4|the first two factors multiply out to this: prediction minus truth] · [x₁|2|the input that w₁ multiplied]",
  trying: "Get every slope at once, cheaply. Each block only needs its own local slope; multiply them along the path back to a weight. That's the chain rule, run in reverse so nothing is computed twice.",
  remove: "Without backprop you'd measure each slope by nudging each weight on its own (the check button). That costs one full forward pass per weight: about 2 million passes per step for the CelebA network, instead of one backward pass.",
  kind: "Recipe. Murphy §13.3 writes it with Jacobian matrices because each block has many inputs and outputs. It's the same multiply-the-local-slopes, done for whole layers at once.",
  refs: ["Murphy §13.3 Backpropagation, p. 438", "D2L §5.3 Forward, backward propagation and computational graphs, p. 180", "D2L §2.5 Automatic differentiation, p. 60"],
  chips: ["Why is σ'(z) = a(1−a)?", "How does this work for a whole layer with a matrix?", "Why go backwards instead of forwards?"],
  np: `import numpy as np
x1, x2, y = 1.5, -0.5, 1
w1, w2, b = 0.6, -0.4, 0.0

# forward: one tiny step per line
m1 = x1 * w1
m2 = x2 * w2
z  = m1 + m2 + b
a  = 1 / (1 + np.exp(-z))
L  = -np.log(a) if y == 1 else -np.log(1 - a)

# backward: same lines in reverse, multiplying local slopes
dL = 1.0
da = dL * (-1 / a if y == 1 else 1 / (1 - a))
dz = da * a * (1 - a)            # simplifies to a - y
dm1, dm2, db = dz, dz, dz        # addition copies blame
dw1, dw2 = dm1 * x1, dm2 * x2    # multiply: times the other input

# don't trust it, measure it
h = 1e-5
def loss(w1):
    a = 1 / (1 + np.exp(-(x1 * w1 + x2 * w2 + b)))
    return -np.log(a)
print(dw1, (loss(w1 + h) - loss(w1 - h)) / (2 * h))   # both -0.3746`,
  pt: `import torch
x = torch.tensor([1.5, -0.5]); y = torch.tensor(1.)
w = torch.tensor([0.6, -0.4], requires_grad=True)
b = torch.tensor(0., requires_grad=True)

a = torch.sigmoid(x @ w + b)          # PyTorch records every step
L = -(y * torch.log(a) + (1 - y) * torch.log(1 - a))
L.backward()                          # walks the record backwards
print(w.grad, (a - y).detach() * x)   # identical` },

s5: { eq: "[h|3|the hidden layer: H numbers, one per hidden neuron] = [tanh|4|the squash, applied to each hidden neuron separately]( [W₁|2|an H×2 table of weights. Row k holds hidden neuron k's two weights] [x|3|the input point] + [b₁|2|H biases] ),  [a|1|the final answer] = σ( [w₂|2|the output neuron's H weights: how much it trusts each hidden neuron] · h + [b₂|2|output bias] )",
  trying: "Build a curved boundary out of straight ones. Each hidden neuron draws one cliff; the output neuron adds the cliffs with weights to make a blob, a ring or a spiral.",
  remove: "Remove tanh and h = W₁x + b₁ is a straight-line function of x, so a = σ(w₂·(W₁x + b₁) + b₂) = σ((w₂W₁)x + constant). That's one neuron again, which is why the 'none' button fails on XOR.",
  kind: "Recipe written as bookkeeping. W₁x means 'every hidden neuron does station 1 at the same time'. Matrix notation is shorthand for that loop.",
  refs: ["Murphy §13.2 Multilayer perceptrons (the XOR problem, §13.2.1), p. 426", "D2L §5.1 Multilayer perceptrons, p. 167", "D2L §5.2 Implementation of MLPs, p. 176"],
  chips: ["Why can't 2 hidden neurons always solve XOR?", "Prove that stacked linear layers are still linear", "tanh vs ReLU: when does it matter?"],
  np: `import numpy as np
rng = np.random.default_rng(0)
# XOR: four blobs, opposite corners share a label
q = np.arange(200) % 4
s = np.stack([np.where(q & 1, 1, -1), np.where(q & 2, 1, -1)], 1)
X = s * 1.5 + rng.normal(0, 0.5, (200, 2))
y = (s[:, 0] * s[:, 1] > 0).astype(float)

H, lr = 6, 0.5
W1 = rng.normal(0, 1, (2, H)); b1 = np.zeros(H)
w2 = rng.normal(0, 1 / np.sqrt(H), H); b2 = 0.0
for step in range(3000):
    h = np.tanh(X @ W1 + b1)                # (200, H) hidden layer
    a = 1 / (1 + np.exp(-(h @ w2 + b2)))    # (200,) output
    dz2 = (a - y) / len(y)                  # sigmoid + cross-entropy
    dw2 = h.T @ dz2; db2 = dz2.sum()
    dh = np.outer(dz2, w2)                  # blame sent back to the hidden layer
    dz1 = dh * (1 - h ** 2)                 # through tanh: slope 1 - h^2
    dW1 = X.T @ dz1; db1 = dz1.sum(0)
    W1 -= lr * dW1; b1 -= lr * db1; w2 -= lr * dw2; b2 -= lr * db2
print("accuracy", ((a > 0.5) == y).mean())`,
  pt: `import torch, torch.nn as nn
X = torch.tensor(X, dtype=torch.float32)   # from the NumPy version
y = torch.tensor(y, dtype=torch.float32)

net = nn.Sequential(nn.Linear(2, 6), nn.Tanh(), nn.Linear(6, 1))
opt = torch.optim.Adam(net.parameters(), lr=0.03)
for step in range(1000):
    loss = nn.functional.binary_cross_entropy_with_logits(net(X).squeeze(1), y)
    opt.zero_grad(); loss.backward(); opt.step()
print(((net(X).squeeze(1) > 0) == (y > 0.5)).float().mean())` },

s6: { eq: "[z|1|the neuron's raw vote] = [Σᵢ|4|add over all 144 pixels i] [wᵢ|2|weight for pixel i: + where ink suggests a smile, − where it suggests a frown] [xᵢ|3|darkness of pixel i] = [w·x|4|the dot product: the same sum written short. It's large when the image's ink lands where w is positive]",
  trying: "Treat an image as a list so a neuron can read it. The dot product measures how much the picture overlaps the neuron's template.",
  remove: "Without flattening there is no list for the weighted sum. Convolutions (station 9) are a smarter way in that keeps the grid shape.",
  kind: "Recipe. Murphy §7.1–7.2 and D2L §2.3 call this vectors and dot products. In practice it's this overlap score.",
  refs: ["D2L §2.3 Linear algebra, p. 41", "D2L §4.2 The image classification dataset, p. 134", "Murphy §7.1–7.2 Vectors, matrix multiplication, pp. 229–242"],
  chips: ["Why is the dot product a measure of overlap?", "How does colour change this?", "Why flatten row by row?"],
  np: `import numpy as np
img = np.full((12, 12), 0.9)            # a blank face, brightness 0.9
img[4:6, 3] = img[4:6, 8] = 0.05        # two eyes
x = (1 - img).reshape(-1)               # 12x12 grid -> 144 darkness values

w = np.zeros((12, 12))                  # a smile template
for col in range(3, 9):
    u = (col - 5.5) / 2.5
    dy = round(u * u * 1.6)
    if dy:
        w[8 - dy, col] += 1             # corners up = smile
        w[8 + dy, col] -= 1             # corners down = frown
z = w.reshape(-1) @ x                   # dot product = overlap with the template
print(x.shape, z)                       # (144,) 0.0: no mouth drawn yet`,
  pt: `import torch
img = torch.rand(1, 12, 12)              # (channels, height, width)
x = img.flatten()                        # 144 numbers
layer = torch.nn.Linear(144, 1)          # one neuron, 144 weights
print(layer(x))
print(layer.weight.view(12, 12).shape)   # the weights can be viewed as an image too` },

s7: { eq: "[L|1|reconstruction loss] = [1/N|4|average over faces] [Σ|4|over faces] [‖ x − dec(enc(x)) ‖²|3|over all 144 pixels, (original − rebuilt)², added up] with [enc|2|encoder: 144 → 32 → L numbers] , [dec|2|decoder: L → 32 → 144 numbers] , [L < 144|1|the bottleneck. Without it the net could just copy]",
  trying: "Learn a short description of faces without any labels. The image is its own target; the bottleneck forces the net to keep only what matters for rebuilding.",
  remove: "Remove the bottleneck (L ≥ 144) and copying is a perfect answer, so nothing interesting is learned. Remove the squashes and you get exactly PCA (Murphy §20.3.1), which is the yellow line.",
  kind: "Recipe plus a proof. Murphy shows that the best linear version projects onto the top L eigenvectors of the data's covariance, which is PCA. The Linear button lets you watch that proof happen.",
  refs: ["Murphy §20.3 Autoencoders, p. 679", "Murphy §20.3.1 Bottleneck autoencoders, p. 680", "Murphy §20.1 PCA, p. 657", "Murphy §20.3.5 Variational autoencoders, p. 683"],
  chips: ["Why does a linear autoencoder end up equal to PCA?", "What does each bottleneck number mean at L = 2?", "Why squared error and not cross-entropy for pixels?"],
  np: `import numpy as np
# X: (N, 144) toy faces in [0, 1]; make_faces() is in the Colab notebook, Part 1
rng = np.random.default_rng(0)
L = 4                                              # the bottleneck
sizes = [144, 32, L, 32, 144]
acts = ["tanh", "none", "tanh", "sigmoid"]
Ws = [rng.normal(0, 1 / np.sqrt(i), (i, o)) for i, o in zip(sizes, sizes[1:])]
bs = [np.zeros(o) for o in sizes[1:]]

def f(z, act):  return np.tanh(z) if act == "tanh" else 1 / (1 + np.exp(-z)) if act == "sigmoid" else z
def df(y, act): return 1 - y ** 2 if act == "tanh" else y * (1 - y) if act == "sigmoid" else 1.0

def train_step(x, lr=1.0):
    hs = [x]
    for W, b, act in zip(Ws, bs, acts):            # forward, keep every layer
        hs.append(f(hs[-1] @ W + b, act))
    out = hs[-1]
    loss = np.mean((out - x) ** 2)                 # target = the input itself
    d = 2 * (out - x) / len(x)                     # dLoss/dOut (per face)
    for k in reversed(range(4)):                   # backward, layer by layer
        dz = d * df(hs[k + 1], acts[k])
        d = dz @ Ws[k].T                           # blame for the layer below
        Ws[k] -= lr * hs[k].T @ dz / 144
        bs[k] -= lr * dz.sum(0) / 144
    return loss`,
  pt: `import torch, torch.nn as nn
L = 4
model = nn.Sequential(
    nn.Linear(144, 32), nn.Tanh(),
    nn.Linear(32, L),                  # the bottleneck: no squash
    nn.Linear(L, 32), nn.Tanh(),
    nn.Linear(32, 144), nn.Sigmoid())
opt = torch.optim.Adam(model.parameters(), lr=4e-3)
for step in range(3000):
    x = X[torch.randint(len(X), (32,))]          # X: (N, 144) float tensor
    loss = ((model(x) - x) ** 2).mean()
    opt.zero_grad(); loss.backward(); opt.step()` },

s8: { eq: "[d|4|the attribute direction] = [mean(z | smile)|1|average address of the smiling faces] − [mean(z | no smile)|2|average address of the others] ;  [z′|3|the edited address] = [z|3|one face's address] + [t|4|how far to walk (the slider)] · d",
  trying: "Turn a labelled attribute into an arrow in bottleneck space, then edit faces by walking along it.",
  remove: "Without labels you can't compute d. The autoencoder never needed labels; only this editing step does. With CelebA, this is where age and eyebags come in.",
  kind: "Recipe. It works well only when the code space is smooth. Murphy §20.3.5 (VAEs) makes that more reliable by adding a KL penalty to the loss.",
  refs: ["Murphy §20.3 Autoencoders, p. 679", "Murphy §20.3.5 Variational autoencoders, p. 683", "Murphy §20.5 Word embeddings (same arithmetic: king − man + woman), p. 705", "D2L §15.7 Word similarity and analogy, p. 720"],
  chips: ["Why does subtracting averages give a meaningful direction?", "Why do some parts of the map decode to blurry faces?", "How would a VAE change this map?"],
  np: `import numpy as np
# Z: (N, 2) codes from the encoder; smile: (N,) booleans from the labels
d_smile = Z[smile].mean(0) - Z[~smile].mean(0)   # arrow from frown to smile
z = Z[0]                                         # any face
for t in (-1, 0, 1, 2):
    face = decode(z + t * d_smile)               # walk along the arrow`,
  pt: `# Notebook Part 6, with the 128-number CelebA codes:
with torch.no_grad():
    Z = model.encode(faces)                                  # (N, 128)
    bags = attrs["Bags_Under_Eyes"]                          # (N,) bool
    d = Z[bags].mean(0) - Z[~bags].mean(0)
    edited = model.decode(Z[:8] + 1.5 * d)                   # add eyebags to 8 faces` },

s9: { eq: "[y[i,j]|1|the output at position (i, j)] = [Σₐ Σ_b|4|add over the 3×3 window: a = row offset, b = column offset] [K[a,b]|2|the kernel: 9 weights shared by every position] · [x[i+a, j+b]|3|the input pixel under that kernel cell]",
  trying: "Look for the same small pattern everywhere in the image, using very few weights.",
  remove: "Without sharing, each output position needs its own weights: 20,736 for this toy and 151 million for one CelebA-sized layer. And an eye detector trained on the left eye wouldn't work on the right one.",
  kind: "Recipe. D2L §7.2 notes that it's technically cross-correlation. The textbook definition of convolution flips the kernel, which doesn't matter when the kernel is learned.",
  refs: ["D2L §7.2 Convolutions for images, p. 240", "D2L §7.3 Padding and stride, p. 247", "D2L §7.4 Multiple input and output channels, p. 252", "Murphy §14.2.1 Convolutional layers, p. 468"],
  chips: ["Why does the vertical-edge kernel look like that?", "What do padding and stride do?", "How do 32 filters on 3 colour channels work?"],
  np: `import numpy as np
def conv2d(x, K):
    H, W = x.shape; k = K.shape[0]
    out = np.zeros((H - k + 1, W - k + 1))
    for i in range(out.shape[0]):
        for j in range(out.shape[1]):
            out[i, j] = np.sum(K * x[i:i + k, j:j + k])   # 9 multiplies, 1 sum
    return out

vertical_edge = np.array([[-1, 0, 1]] * 3)
x = np.zeros((12, 12)); x[:, 6:] = 1      # left half dark, right half bright
print(conv2d(x, vertical_edge)[0])        # [0 0 0 0 3 3 0 0 0 0]: only at the edge`,
  pt: `import torch, torch.nn as nn
conv = nn.Conv2d(in_channels=3, out_channels=32, kernel_size=3, padding=1)
x = torch.randn(8, 3, 64, 64)       # batch of 8 colour images
print(conv(x).shape)                # (8, 32, 64, 64)
print(conv.weight.shape)            # (32, 3, 3, 3): 32 filters of 27 weights` },

s10: { eq: "[out|1|output height or width] = ( [in|3|input size] + 2[p|2|padding: zeros added around the edge] − [k|2|kernel size] ) / [s|4|stride: how far the kernel jumps each time] + 1",
  trying: "Know every tensor's shape before running anything, so you can design the network on paper.",
  remove: "Get it wrong and PyTorch stops with a shape-mismatch error at the Linear layer. That's the most common first bug.",
  kind: "Bookkeeping. D2L §7.3 derives it by counting how many positions the kernel can occupy.",
  refs: ["D2L §7.3 Padding and stride, p. 247", "D2L §14.10 Transposed convolution, p. 654", "D2L §8.5 Batch normalization, p. 292", "D2L ch. 13 Computational performance, p. 547"],
  chips: ["Walk me through one shape calculation", "What does BatchNorm do in this network?", "What is bf16 and why is it faster on the L4?"],
  np: `def conv_out(n, k, s=1, p=0):
    return (n + 2 * p - k) // s + 1

def convT_out(n, k, s=1, p=0):
    return (n - 1) * s - 2 * p + k

n = 64
for _ in range(4):
    n = conv_out(n, k=4, s=2, p=1); print("encoder", n)    # 32 16 8 4
for _ in range(4):
    n = convT_out(n, k=4, s=2, p=1); print("decoder", n)   # 8 16 32 64`,
  pt: `import torch, torch.nn as nn

def down(ci, co):
    return nn.Sequential(nn.Conv2d(ci, co, 4, 2, 1), nn.BatchNorm2d(co), nn.LeakyReLU(0.2))
def up(ci, co):
    return nn.Sequential(nn.ConvTranspose2d(ci, co, 4, 2, 1), nn.BatchNorm2d(co), nn.ReLU())

class ConvAE(nn.Module):
    def __init__(self, latent_dim=128):
        super().__init__()
        self.enc = nn.Sequential(down(3, 32), down(32, 64), down(64, 128), down(128, 256),
                                 nn.Flatten(), nn.Linear(256 * 4 * 4, latent_dim))
        self.dec_fc = nn.Linear(latent_dim, 256 * 4 * 4)
        self.dec = nn.Sequential(up(256, 128), up(128, 64), up(64, 32),
                                 nn.ConvTranspose2d(32, 3, 4, 2, 1), nn.Sigmoid())
    def encode(self, x): return self.enc(x)
    def decode(self, z): return self.dec(self.dec_fc(z).view(-1, 256, 4, 4))
    def forward(self, x): return self.decode(self.encode(x))

model = ConvAE().cuda().to(memory_format=torch.channels_last)` }
};

/* ================= every chapter of both books ================= */
const BOOKS = { M: "Murphy, Probabilistic ML: An Introduction", D: "Dive into Deep Learning", A: "Murphy, Probabilistic ML: Advanced Topics" };
const CH = [
 ["M",1,"Introduction",1,"Core","What machine learning is: instead of writing rules, you write a function with adjustable knobs and let examples set the knobs. Supervised (labels), unsupervised (no labels), reinforcement (rewards).",[["f(x; θ) ≈ y","a function f with knobs θ; learning means setting θ so outputs match examples"],["θ̂ = argmin_θ (1/N) Σ ℓ(yₙ, f(xₙ; θ))","the knobs that make the average mistake smallest. Every later chapter is a choice of f, ℓ and how to search"]],["s1","s2"]],
 ["M",2,"Probability: univariate models",33,"Core (2.1–2.6)","A language for uncertainty about one quantity: coins (Bernoulli), dice (categorical), bell curves (Gaussian), and how to update beliefs with Bayes' rule. Neural net outputs are these distributions.",[["p(H | D) = p(D | H) p(H) / p(D)","after seeing data D, belief in H = how well H explains D × how plausible H was before, rescaled so beliefs sum to 1"],["N(x | μ, σ²) ∝ exp(−(x−μ)² / 2σ²)","bell curve: the penalty grows with squared distance from μ, measured in units of σ. Take −log and you get squared error"],["Ber(y | a) = aʸ (1−a)¹⁻ʸ","a coin with probability a. Take −log and you get cross-entropy (station 2)"]],["s2"]],
 ["M",3,"Probability: multivariate models",77,"Read once","Many variables at once: how they move together (covariance), the multivariate Gaussian, and mixtures of simple distributions. Covariance is the matrix PCA diagonalises.",[["Σ = E[(x − μ)(x − μ)ᵀ]","a table: entry (i, j) says how much variable i and variable j rise and fall together"],["p(x) = Σₖ πₖ N(x | μₖ, Σₖ)","a mixture: pick a cluster k with probability πₖ, then draw from that cluster's bell"]],["s7"]],
 ["M",4,"Statistics",107,"Core (4.1–4.3, 4.5)","From data back to knobs. Maximum likelihood (choose θ that makes the data least surprising), regularisation (don't trust tiny datasets), and the Bayesian alternative (keep a whole distribution over θ).",[["θ̂ = argmax_θ Σₙ log p(yₙ | xₙ, θ)","sum of logs because independent probabilities multiply. This one line produces both squared error and cross-entropy"],["θ̂ = argmax [log p(D|θ) + log p(θ)]","MAP: same, plus a preference for small knobs. The prior's log becomes weight decay"]],["s2"]],
 ["M",5,"Decision theory",167,"Read once","Turning probabilities into actions when mistakes have different costs, and choosing between models fairly (cross-validation, hypothesis tests).",[["a* = argmin_a Σ_y ℓ(y, a) p(y | x)","pick the action with the lowest expected cost: each possible truth's cost weighted by how likely it is"]],[]],
 ["M",6,"Information theory",207,"Core (6.1–6.2)","Measuring surprise. Entropy is average surprise; KL divergence is the extra surprise from using the wrong model. Cross-entropy loss is entropy + KL, so minimising it pulls your model toward the truth.",[["H(p) = −Σ p(x) log p(x)","average surprise. A fair coin: 1 bit. A coin that always lands heads: 0"],["KL(p ‖ q) = Σ p log(p / q)","how many extra bits you waste coding data from p with a code built for q. Zero only when q = p"]],["s2"]],
 ["M",7,"Linear algebra",229,"Core (7.1–7.5, 7.8)","The bookkeeping language. Most of the 'scary equations' elsewhere are loops written in this notation. Matrix multiply = many dot products at once; eigen and SVD = finding the directions a matrix stretches.",[["y = W x","every output is the dot product of one row of W with x: a whole layer of neurons in one line"],["A = U Σ Vᵀ","any matrix = rotate, stretch along axes, rotate. Keeping the largest stretches = PCA"],["∇ₓ (xᵀ A x) = (A + Aᵀ) x","matrix calculus: the same derivative rules as school, applied to every entry at once"]],["s6","s7"]],
 ["M",8,"Optimization",275,"Core (8.1–8.4)","How to actually find the knobs: gradient descent, momentum, second-order methods, stochastic (minibatch) gradients, constraints.",[["θ ← θ − η ∇L(θ)","step against the slope"],["θ ← θ − η ∇L_batch(θ)","SGD: a random minibatch's slope is a cheap, noisy estimate of the full slope"]],["s3"]],
 ["M",9,"Linear discriminant analysis",323,"Read once","A different route to classification: model what each class's data looks like (a Gaussian per class), then use Bayes' rule to flip it. Naive Bayes is the simplest case. Contrasts generative and discriminative models.",[["p(y = c | x) ∝ p(x | y = c) p(y = c)","which class makes this x most likely, weighted by how common the class is"]],[]],
 ["M",10,"Logistic regression",339,"Core","One neuron with a sigmoid, trained by cross-entropy. Softmax extends it to many classes. This chapter is stations 1 to 4.",[["p(y=1 | x) = σ(wᵀx + b)","weighted vote, squashed"],["∇_w NLL = Σₙ (aₙ − yₙ) xₙ","the gradient: each example's error times its input"],["softmax(z)ₖ = e^{zₖ} / Σⱼ e^{zⱼ}","many classes: exponentiate the scores so they're positive, divide so they sum to 1"]],["s1","s2","s3","s4"]],
 ["M",11,"Linear regression",371,"Core (11.1–11.4)","Predicting a number. Least squares has an exact answer; ridge and lasso add penalties that shrink weights or set them to zero.",[["ŵ = (XᵀX)⁻¹ Xᵀ y","the exact bottom of the squared-error bowl, found in one shot instead of stepping"],["L + λ‖w‖²","ridge: pay for big weights, so noise can't be fitted with huge coefficients"],["L + λ‖w‖₁","lasso: paying by absolute value pushes many weights to exactly zero"]],["s3"]],
 ["M",12,"Generalized linear models",415,"Later","One recipe covering linear, logistic and count (Poisson) regression: a linear score passed through a link function that suits the kind of output.",[["E[y | x] = g⁻¹(wᵀx)","weighted vote, then the right squash for the output type"]],[]],
 ["M",13,"Neural networks for tabular data",425,"Core","MLPs, backprop, and the practical side of training: activations, initialisation, vanishing gradients, dropout, weight decay.",[["h = φ(W₁ x + b₁)","a layer: many neurons, then a squash"],["δˡ = (Wˡ⁺¹)ᵀ δˡ⁺¹ ⊙ φ'(zˡ)","backprop for a whole layer: blame from above, sent back along the same weights, scaled by how responsive each neuron was"]],["s4","s5"]],
 ["M",14,"Neural networks for images",467,"Core (14.1–14.3)","CNNs: convolution, pooling, normalisation, residual connections, and the architectures built from them. 14.4.2 covers the transposed convolution your decoder uses.",[["y = K ⋆ x","slide one small kernel everywhere"],["x_{l+1} = x_l + F(x_l)","ResNet: learn only the change. Gradients get a direct path back, so very deep nets train"]],["s9","s10"]],
 ["M",15,"Neural networks for sequences",503,"Core","RNNs carry memory step by step; attention lets every position look at every other; transformers are attention stacked.",[["hₜ = φ(W hₜ₋₁ + U xₜ)","memory updated at each step from the old memory and the new input"],["Attn(Q, K, V) = softmax(QKᵀ / √d) V","each position scores every other (dot products), turns scores into weights, and takes a weighted average"]],[]],
 ["M",16,"Exemplar-based methods",547,"Read once","Keep the training examples and predict from the nearest ones (KNN). Learn what 'near' should mean (metric learning). Smooth density estimates (KDE).",[["ŷ(x) = majority label of the K nearest xₙ","no training at all; all the work happens at prediction time"]],[]],
 ["M",17,"Kernel methods",567,"Later","Replace hand-made features with a similarity function. Gaussian processes give predictions with error bars; SVMs find the widest-margin boundary.",[["k(x, x′) = exp(−‖x − x′‖² / 2ℓ²)","similarity that decays with distance; ℓ sets how far 'near' reaches"],["min ½‖w‖² s.t. yₙ(wᵀxₙ + b) ≥ 1","SVM: the boundary with the widest empty street around it"]],[]],
 ["M",18,"Trees, forests, bagging and boosting",603,"Read once","Split the data with yes/no questions. Average many randomised trees (random forest) or add trees that fix the previous ones' errors (boosting). Often the best tool for spreadsheets.",[["F_m(x) = F_{m−1}(x) + ν f_m(x)","boosting: each new tree f_m is fitted to what the ensemble still gets wrong"]],[]],
 ["M",19,"Learning with fewer labeled examples",627,"Read once","Data augmentation, transfer learning (reuse a trained network), semi-supervised, active, meta and few-shot learning. The autoencoder's 'no labels needed' idea comes back here.",[["θ_new ← θ_pretrained, then fine-tune","start from knobs already set by a big dataset"]],["s8"]],
 ["M",20,"Dimensionality reduction",657,"Core (20.1, 20.3)","Describe high-dimensional data with a few numbers: PCA (best straight-line squeeze), factor analysis, autoencoders (curved squeeze), VAEs, t-SNE/UMAP, word embeddings. This is your screenshot's chapter.",[["min ‖X − X W Wᵀ‖² s.t. WᵀW = I","PCA: the L directions that lose the least when you project onto them"],["min Σ ‖x − dec(enc(x))‖²","autoencoder: same goal, but curved encoders and decoders"],["ELBO = E[log p(x|z)] − KL(q(z|x) ‖ p(z))","VAE: rebuild well, and keep the codes close to a standard bell so the map has no holes"]],["s7","s8"]],
 ["M",21,"Clustering",715,"Read once","Group data without labels: hierarchical merging, K-means, Gaussian mixtures with EM, spectral clustering.",[["min Σₙ ‖xₙ − μ_{cₙ}‖²","K-means: every point belongs to its nearest centre; move centres to their points' average; repeat"]],[]],
 ["M",22,"Recommender systems",741,"Read once","Predict ratings from sparse data with matrix factorisation: every user and item gets a short vector, and their dot product is the predicted rating.",[["r̂ᵤᵢ = uᵤ · vᵢ","taste vector × item vector. The same dot product as station 6"]],["s6"]],
 ["M",23,"Graph embeddings",753,"Later","Learn a vector for every node of a graph so connected nodes are close; graph neural networks pass messages between neighbours. Links straight back to your Think Complexity graphs.",[["hᵥ ← φ(W · mean_{u ∈ N(v)} hᵤ)","each node updates by averaging its neighbours' vectors, then one neuron layer"]],[]],
 ["D",1,"Introduction",1,"Core","The four ingredients of every model: data, a model with parameters, an objective function, and an optimisation algorithm. A tour of problem types and of why deep learning took off.",[["data + model + loss + optimiser","every station in this lab is one of these four"]],["s1"]],
 ["D",2,"Preliminaries",30,"Core","Tensors, data loading, linear algebra, calculus, automatic differentiation, probability. The toolkit, with PyTorch code for each idea.",[["x.grad after y.backward()","autograd: PyTorch records each operation and applies station 4's chain rule for you"]],["s4","s6"]],
 ["D",3,"Linear neural networks for regression",82,"Core","Linear regression built three ways (from scratch, concise, with weight decay), plus why squared loss equals Gaussian noise and what generalisation means.",[["L = (1/2n) Σ (wᵀxᵢ + b − yᵢ)²","the ½ is only there to cancel the 2 from the derivative"],["−log p(y|x) = ½ log(2πσ²) + (y − wᵀx)²/2σ²","assume Gaussian noise and minimising squared error is maximum likelihood"]],["s2","s3"]],
 ["D",4,"Linear neural networks for classification",125,"Core","Softmax regression on Fashion-MNIST, cross-entropy, and how a model's test accuracy relates to its training accuracy. Ends with distribution shift.",[["ŷ = softmax(Wx + b)","one score per class, turned into probabilities"],["l = −Σⱼ yⱼ log ŷⱼ","cross-entropy with a one-hot label: −log of the probability given to the true class"]],["s1","s2"]],
 ["D",5,"Multilayer perceptrons",167,"Core","Hidden layers and activations, a from-scratch MLP, the computational graph behind backprop, initialisation, generalisation and dropout.",[["H = σ(XW⁽¹⁾ + b⁽¹⁾), O = HW⁽²⁾ + b⁽²⁾","a whole batch through two layers"],["∂J/∂W⁽¹⁾ = (∂J/∂z) xᵀ","station 4, written for a matrix"]],["s4","s5"]],
 ["D",6,"Builders' guide",207,"Practical","How PyTorch models are built: modules, parameters, initialisation, custom layers, saving to file, using the GPU. Read it alongside the notebook.",[["model.to('cuda')","move every weight to GPU memory so the multiply-adds run there"]],["s10"]],
 ["D",7,"Convolutional neural networks",233,"Core","From fully connected layers to convolutions: kernels, padding and stride, channels, pooling, and LeNet.",[["[H]ᵢ,ⱼ = u + Σₐ Σ_b [V]ₐ,_b [X]ᵢ₊ₐ,ⱼ₊_b","the sliding 3×3 window of station 9"],["⌊(n − k + p + s) / s⌋","output size after padding p and stride s (D2L counts p as the total on both sides)"]],["s9","s10"]],
 ["D",8,"Modern CNNs",268,"Read once (8.5, 8.6 core)","The architecture history: AlexNet, VGG, NiN, GoogLeNet, batch normalisation, ResNet, DenseNet. BatchNorm and ResNet are in almost every network since, including your notebook's.",[["BN(x) = γ (x − μ_B) / √(σ²_B + ε) + β","re-centre and re-scale each channel using this batch's statistics, then let the net choose its own scale γ and shift β"],["f(x) = x + g(x)","ResNet: the layer only learns the change"]],["s10"]],
 ["D",9,"Recurrent neural networks",325,"Core","Sequences: turning text into tokens, language models, an RNN from scratch, and backpropagation through time.",[["P(x₁…x_T) = Πₜ P(xₜ | x₁…xₜ₋₁)","a sentence's probability = each word's probability given the words before it"],["Hₜ = φ(XₜW_xh + Hₜ₋₁W_hh + b)","the memory update, for a whole batch"]],[]],
 ["D",10,"Modern recurrent neural networks",369,"Read once","LSTM and GRU gates (learned memory control), deep and bidirectional RNNs, encoder–decoder translation, beam search. The encoder–decoder idea is the autoencoder's idea applied to sentences.",[["Cₜ = Fₜ ⊙ Cₜ₋₁ + Iₜ ⊙ C̃ₜ","forget gate × old memory + input gate × new candidate"]],[]],
 ["D",11,"Attention mechanisms and transformers",409,"Core","Attention as soft lookup, scoring functions, multi-head and self-attention, positional encoding, the Transformer, vision transformers, large-scale pretraining. The basis of modern AI, Claude included.",[["softmax(QKᵀ/√d) V","scores by dot product; √d keeps the scores from growing with dimension; softmax makes weights; weighted average of values"]],[]],
 ["D",12,"Optimization algorithms",468,"Core","Why SGD works, minibatches, momentum, Adagrad, RMSProp, Adam, learning-rate schedules. Every station in this lab that trains uses Adam.",[["vₜ = β vₜ₋₁ + gₜ, w ← w − η vₜ","momentum: a rolling ball keeps some speed through small bumps"],["w ← w − η m̂ / (√v̂ + ε)","Adam: step by the averaged slope, divided by its typical size, so every weight gets a sensible step"]],["s3"]],
 ["D",13,"Computational performance",547,"With the notebook","Compilers vs interpreters, asynchronous execution, hardware (CPUs, GPUs, memory bandwidth), multiple GPUs. Explains why your L4 is fast and when it isn't.",[["time ≈ max(FLOPs / peak FLOP/s, bytes / bandwidth)","a step is limited by either arithmetic or memory traffic, whichever is slower"]],["s10"]],
 ["D",14,"Computer vision",592,"Read once (14.10 core)","Augmentation, fine-tuning, object detection (anchor boxes, SSD, R-CNN), segmentation, transposed convolution, fully convolutional nets, style transfer.",[["Y = transposed_conv(X, K)","run convolution backwards: each input pixel stamps a scaled copy of the kernel. Your decoder's upsampler"]],["s10"]],
 ["D",15,"NLP: pretraining",690,"Read once","Word embeddings (word2vec, GloVe, subwords), word analogies, and BERT. Analogies are the same vector arithmetic as station 8's smile arrow.",[["P(w_o | w_c) = exp(u_oᵀv_c) / Σᵢ exp(uᵢᵀv_c)","skip-gram: a word's vector should predict its neighbours"],["king − man + woman ≈ queen","attribute directions, like d_smile"]],["s8"]],
 ["D",16,"NLP: applications",744,"Later","Sentiment analysis with RNNs and CNNs, natural language inference with attention, fine-tuning BERT.",[["fine-tune: θ ← θ_BERT, add one layer, train","reuse a pretrained encoder"]],[]],
 ["D",17,"Reinforcement learning",781,"Later","Markov decision processes, value iteration, Q-learning: learning from rewards instead of labels.",[["Q(s,a) ← r + γ max_{a′} Q(s′, a′)","the value of an action = reward now + discounted value of the best next action"]],[]],
 ["D",18,"Gaussian processes",797,"Later","A prior over whole functions; predictions come with uncertainty. Same topic as Murphy ch. 17, with code.",[["f ~ GP(m(x), k(x, x′))","any finite set of function values is jointly Gaussian with covariance given by the kernel"]],[]],
 ["D",19,"Hyperparameter optimization",828,"Later","Choosing learning rates and sizes systematically: random search, successive halving, asynchronous methods.",[["try many configs, stop the bad ones early","successive halving: train all briefly, keep the best half, repeat"]],[]],
 ["D",20,"Generative adversarial networks",880,"Read once","A generator makes fakes, a discriminator spots them, and they train against each other. The other classic way to generate faces, next to autoencoders and VAEs.",[["min_G max_D E[log D(x)] + E[log(1 − D(G(z)))]","D maximises how often it's right; G minimises it"]],["s8"]],
 ["D",21,"Recommender systems",893,"Read once","Matrix factorisation, AutoRec (an autoencoder for rating tables), neural collaborative filtering, factorisation machines.",[["AutoRec: r̂ = dec(enc(r))","an autoencoder that rebuilds a user's full rating row from the ratings they gave"]],["s7"]],
 ["D",22,"Appendix: mathematics for deep learning",897,"Reference","Geometry, eigendecompositions, single- and multi-variable calculus, integrals, random variables, MLE, distributions, naive Bayes, statistics, information theory. Look things up here when a chapter assumes them.",[["(the math chapters of Murphy, D2L-style)","read sections on demand, not front to back"]],[]],
 ["D",23,"Appendix: tools for deep learning",1035,"Practical","Jupyter, cloud GPUs, the d2l package. You're already set up with Colab Pro and an L4.",[["—","setup notes"]],["s10"]],
 ["A",1,"Introduction",1,"Core","The plan of the advanced book: everything is framed as probabilistic inference. Six parts: fundamentals, inference, prediction, generation, discovery, action.",[["p(unknowns | knowns)","the one question every chapter answers in a different setting"]],[]],
 ["A",2,"Probability",5,"Reference","Book 1's probability chapters, deeper: more distributions, the exponential family, transformations, and stochastic processes. Look things up here rather than reading it straight through.",[["p(x | η) = h(x) exp(ηᵀ T(x) − A(η))","exponential family: Gaussian, Bernoulli, Poisson and others are all this one shape. That's why their losses and gradients look alike"]],["s2"]],
 ["A",3,"Statistics",63,"Read once","Bayesian statistics properly: conjugate priors, hierarchical models, empirical Bayes, model selection.",[["p(θ | D) ∝ p(D | θ) p(θ)","keep a whole distribution over the knobs, not one best value"]],[]],
 ["A",4,"Graphical models",143,"Read once","Draw which variables directly influence which as a graph; the graph says how the joint probability factorises and which variables are independent.",[["p(x₁…x_n) = Πᵢ p(xᵢ | parents(xᵢ))","a big joint distribution = a product of small local ones"]],[]],
 ["A",5,"Information theory",219,"Read once","Entropy, KL and mutual information, extended to coding, compression and the information bottleneck. That's the theory behind your autoencoder's bottleneck.",[["min I(X; Z) − β I(Z; Y)","information bottleneck: keep as little about the input as possible while keeping what predicts the target"]],["s7"]],
 ["A",6,"Optimization",261,"Read once","Book 1's optimisation, deeper: natural gradients, bound optimisation (EM), Bayesian optimisation, and gradient estimators for things you can only sample.",[["∇ E_q[f(z)] = E_q[f(z) ∇ log q(z)]","score-function trick: get a gradient through random sampling. Used in VAEs and reinforcement learning"]],["s3"]],
 ["A",7,"Inference algorithms: an overview",345,"Read once","The map of how to compute posteriors: exact, deterministic approximations (variational, expectation propagation) and sampling (Monte Carlo).",[["p(z | x) = p(x, z) / ∫ p(x, z) dz","the integral on the bottom is usually impossible. Each later chapter is a way around it"]],[]],
 ["A",8,"Gaussian filtering and smoothing",359,"Later","Track a hidden state over time from noisy measurements: Kalman filter and its nonlinear versions. GPS and robot tracking work this way.",[["predict → update with gain K = PHᵀ(HPHᵀ + R)⁻¹","trust the measurement more when your prediction is uncertain"]],[]],
 ["A",9,"Message passing algorithms",401,"Later","Exact or approximate inference on graphs by passing local messages between nodes: belief propagation, sum-product, max-product.",[["m_{i→j}(x_j) = Σ_{xᵢ} ψᵢⱼ(xᵢ, x_j) Πₖ m_{k→i}(xᵢ)","each node tells its neighbour what it believes, combining what its other neighbours told it"]],[]],
 ["A",10,"Variational inference",439,"Core (for VAEs)","Replace an impossible posterior with the closest simple distribution, found by optimisation. This is the 'V' in VAE.",[["log p(x) ≥ E_q[log p(x|z)] − KL(q(z|x) ‖ p(z))","the ELBO: a lower bound you can maximise with gradient descent. Reconstruction term + keep-codes-simple term"]],["s8"]],
 ["A",11,"Monte Carlo methods",483,"Read once","Estimate averages by sampling: importance sampling, control variates.",[["E[f(x)] ≈ (1/S) Σₛ f(xₛ)","an average over random draws estimates the true average; error shrinks like 1/√S"]],[]],
 ["A",12,"Markov chain Monte Carlo",499,"Later","Sample from distributions you can only evaluate up to a constant, by a random walk that spends time in proportion to probability: Metropolis–Hastings, Gibbs, Hamiltonian MC.",[["accept with prob min(1, p(x′) / p(x))","always move uphill, sometimes move downhill. Over time, time spent ∝ probability"]],[]],
 ["A",13,"Sequential Monte Carlo",543,"Later","Particle filters: track a changing posterior with a cloud of weighted samples that get resampled over time.",[["wₜ ∝ wₜ₋₁ · p(yₜ | xₜ)","re-weight each particle by how well it explains the new observation"]],[]],
 ["A",14,"Predictive models: an overview",575,"Read once","Framing for part III: what makes a good predictive model, calibration, proper scoring rules, conformal prediction.",[["score = E[log p(y_true)]","a proper scoring rule rewards honest probabilities, not just right answers"]],["s2"]],
 ["A",15,"Generalized linear models",591,"Read once","GLMs from book 1, done the Bayesian way, with hierarchical structure.",[["y ~ ExpFam(g⁻¹(wᵀx)), w ~ prior","station 1's neuron with a distribution over its weights"]],["s1"]],
 ["A",16,"Deep neural networks",631,"Core","A compact tour of modern architectures as building blocks: residual nets, normalisation, attention, transformers, graph nets.",[["x_{l+1} = x_l + F(x_l)","most modern networks are stacks of residual blocks"]],["s5","s9"]],
 ["A",17,"Bayesian neural networks",647,"Later","Put a distribution over a network's weights so it knows when it doesn't know. Laplace approximation, variational, ensembles, MC dropout.",[["p(y | x, D) = ∫ p(y | x, w) p(w | D) dw","average the predictions of every plausible weight setting"]],[]],
 ["A",18,"Gaussian processes",681,"Later","Book 1 ch. 17 in depth: kernels, scalable approximations, and the link to infinitely wide neural nets.",[["f(x*) | D ~ N(k*ᵀK⁻¹y, k** − k*ᵀK⁻¹k*)","the prediction is a weighted sum of training labels; the uncertainty shrinks near data"]],[]],
 ["A",19,"Beyond the iid assumption",735,"Read once","When test data differs from training data: distribution shift, domain adaptation, continual learning, adversarial examples.",[["p_test(x) ≠ p_train(x)","the assumption every earlier chapter makes, and what to do when it breaks"]],[]],
 ["A",20,"Generative models: an overview",773,"Core","The map of part IV: models that can produce new data. VAEs, autoregressive models, flows, energy-based, diffusion and GANs, compared on what they can and can't do.",[["learn p(x), then sample x ~ p(x)","the goal shared by every chapter from 21 to 26"]],["s7","s8"]],
 ["A",21,"Variational autoencoders",791,"Core (next step)","Your autoencoder plus a probabilistic code: the encoder outputs a distribution, a KL term keeps codes near a standard bell, so you can sample brand-new faces. Notebook Part 7 starts this.",[["L = ‖x − dec(z)‖² + β · KL(N(μ, σ²) ‖ N(0, 1)), z = μ + σ·ε","rebuild well, keep the code space smooth and filled. The ε trick lets gradients flow through the sampling"]],["s7","s8"]],
 ["A",22,"Autoregressive models",821,"Core","Generate one piece at a time, each conditioned on everything before it. This is how language models (and Claude) produce text.",[["p(x) = Πₜ p(xₜ | x₁…xₜ₋₁)","a joint distribution as a chain of next-step predictions"]],[]],
 ["A",23,"Normalizing flows",829,"Later","Build a complex distribution by pushing a simple one through invertible functions, keeping exact probabilities.",[["log p(x) = log p(z) − log |det ∂f/∂z|","the volume-change correction for stretching space"]],[]],
 ["A",24,"Energy-based models",849,"Later","Score every configuration with an energy; low energy = likely. Flexible, but normalising is hard.",[["p(x) = exp(−E(x)) / Z","any scoring function becomes a probability once divided by Z, the sum over everything"]],[]],
 ["A",25,"Diffusion models",867,"Core","Learn to undo noise step by step; start from pure noise and denoise into an image. The method behind modern image generators. A close relative of the denoising autoencoder in notebook Part 7.",[["x_t = √ᾱ_t x₀ + √(1 − ᾱ_t) ε;  loss = ‖ε − ε_θ(x_t, t)‖²","add known noise, train a network to predict that noise, then run it in reverse"]],["s7"]],
 ["A",26,"Generative adversarial networks",893,"Read once","Generator vs discriminator, in depth: losses, training problems, conditional GANs, evaluation.",[["min_G max_D E[log D(x)] + E[log(1 − D(G(z)))]","a forger and a detective improving against each other"]],[]],
 ["A",27,"Discovery methods: an overview",927,"Read once","Part V's framing: finding hidden structure, not predicting labels.",[["x ≈ f(z), z hidden","explain data through unseen causes"]],["s8"]],
 ["A",28,"Latent factor models",929,"Read once","PCA, factor analysis, mixtures, topic models, ICA: all 'data = simple hidden factors + noise'. Book 1 ch. 20, generalised.",[["x = W z + μ + ε","the linear autoencoder of station 7, with noise made explicit"]],["s7"]],
 ["A",29,"State-space models",979,"Later","Hidden states that evolve over time: hidden Markov models, linear dynamical systems, and their deep versions.",[["zₜ ~ p(zₜ | zₜ₋₁),  xₜ ~ p(xₜ | zₜ)","a hidden story moving through time, observed noisily"]],[]],
 ["A",30,"Graph learning",1043,"Later","Learning graph structure itself from data.",[["learn A in p(x | A)","which variables are connected, inferred from samples"]],[]],
 ["A",31,"Nonparametric Bayesian models",1047,"Later","Models whose size grows with the data, such as Dirichlet processes for an unknown number of clusters.",[["K = ∞, most clusters empty","let the data decide how many clusters it needs"]],[]],
 ["A",32,"Representation learning",1049,"Core","How to learn useful codes without labels: autoencoders, contrastive learning (pull views of the same image together, push others apart), and how to evaluate representations. A direct continuation of stations 7 and 8.",[["L = −log [exp(sim(z, z⁺)/τ) / Σ exp(sim(z, zₖ)/τ)]","contrastive loss: a softmax that should pick the matching pair out of a crowd"]],["s7","s8"]],
 ["A",33,"Interpretability",1073,"Read once","Ways to see what a trained network uses: feature attributions, probing, concept directions (the same idea as the smile arrow).",[["attribution ≈ ∂ output / ∂ input","which input pixels the answer is most sensitive to: station 4's gradient, taken with respect to the input"]],["s8","s4"]],
 ["A",34,"Decision making under uncertainty",1105,"Later","Bandits, Bayesian optimisation, active learning: choosing what to try next when each try costs something.",[["pick a maximising E[reward] + exploration bonus","balance trying the best-known option against learning about others"]],[]],
 ["A",35,"Reinforcement learning",1145,"Later","Learning from rewards: value functions, policy gradients, model-based RL, and RL from human feedback.",[["∇J = E[∇ log π(a | s) · return]","make actions that led to high return more likely"]],[]],
 ["A",36,"Causality",1185,"Later","Telling 'X causes Y' from 'X goes with Y': causal graphs, interventions, counterfactuals.",[["p(y | do(x)) ≠ p(y | x)","setting x yourself is different from observing it, because observing carries hidden common causes"]],[]]
];

/* normalise: c[6] = stations, c[7] = equations */
CH.forEach(c => { const e = c[6]; c[6] = c[7]; c[7] = e; });

/* ================= common blocks ================= */
function eqHTML(src) { return esc(src).replace(/\[(.+?)\|(\d)\|([^\]]+)\]/g, (m, s, k, d) => `<span class="sym k${k}" tabindex="0" data-m="${d.replace(/"/g, "&quot;")}">${s}</span>`); }
function hl(code) {
  return esc(code).split("\n").map(line => {
    const i = line.indexOf("#"); let a = i >= 0 ? line.slice(0, i) : line, c = i >= 0 ? line.slice(i) : "";
    a = a.replace(/\b(import|from|def|return|for|in|if|else|with|class|as|while|lambda|and|or|not|None|True|False|print|range)\b/g, '<span class="kw">$1</span>').replace(/\b(\d+\.?\d*(e-?\d+)?)\b/g, '<span class="nu">$1</span>');
    return a + (c ? `<span class="cm">${c}</span>` : "");
  }).join("\n");
}
function md(t) {
  const parts = String(t).split(/```[a-z]*\n?/); let h = "";
  parts.forEach((p, i) => {
    if (i % 2) { h += `<pre>${esc(p.replace(/\n$/, ""))}</pre>`; return; }
    p.split(/\n{2,}/).forEach(par => { if (!par.trim()) return; h += "<p>" + esc(par).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>") + "</p>"; });
  });
  return h;
}

const RULES = `You are the tutor inside "Neuron Voxel Lab", an interactive site that teaches machine learning from first principles, following Kevin Murphy's "Probabilistic Machine Learning" (both volumes) and "Dive into Deep Learning". The learner only keeps what he has verified the logic of, and his brain rejects unexplained abstraction. Rules:
- Derive, don't assert. Start from a concrete number or picture (use the current simulation state below when there is one), then generalise.
- Explain every symbol the first time you use it. When an equation appears, say in words what it computes and why it has that shape, and what breaks if a piece is removed.
- If the books use heavy notation for it, say whether that notation is the recipe itself, bookkeeping (indices, matrices) or a proof, and which one he needs now.
- Under 300 words unless he asks for more. Plain text, short paragraphs. Write math with plain characters (x², Σ, √, ·, ∂), no LaTeX. Put small NumPy snippets in \`\`\` fences when code helps.`;
function makeAsk(host, ctxFn, chips) {
  host.innerHTML = `<h3>Ask about this</h3><div class="chips">${chips.map(c => `<button class="chip" type="button">${esc(c)}</button>`).join("")}</div>
    <textarea class="text-in" rows="2" placeholder="Ask anything: why a formula looks like that, what a line of code does, how this connects to something else…"></textarea>
    <div class="btns"><button class="btn primary" type="button" data-go>Ask</button><button class="btn" type="button" data-clear hidden>Clear thread</button></div><div class="thread"></div>`;
  const ta = host.querySelector("textarea"), go = host.querySelector("[data-go]"), clr = host.querySelector("[data-clear]"), th = host.querySelector(".thread");
  let turns = [], busy = false;
  host.querySelectorAll(".chip").forEach(c => c.onclick = () => { ta.value = c.textContent; ask(); });
  ta.addEventListener("keydown", e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(); });
  go.onclick = ask; clr.onclick = () => { turns = []; th.innerHTML = ""; clr.hidden = true; };
  async function ask() {
    const q = ta.value.trim(); if (!q || busy) return; ta.value = ""; busy = true; go.disabled = true;
    const qd = document.createElement("div"); qd.className = "q"; qd.textContent = q; const ad = document.createElement("div"); ad.className = "ans wait"; ad.textContent = "Thinking…"; th.append(qd, ad);
    const msg = `${turns.length ? "" : RULES + "\n\n"}${ctxFn()}\n\nQuestion: ${q}`;
    try {
      const j = await askAI([...turns, { role: "user", content: msg }]);
      ad.classList.remove("wait"); ad.innerHTML = md(j.text) + `<p class="note">answered by ${esc(j.model || "AI")}</p>`;
      turns.push({ role: "user", content: msg }, { role: "assistant", content: j.text }); if (turns.length > 12) turns = [turns[0], turns[1], ...turns.slice(-8)]; clr.hidden = false;
    } catch (e) { ad.classList.remove("wait"); ad.innerHTML = ""; ad.append(aiErrorHTML(e, () => { ta.value = q; th.removeChild(qd); th.removeChild(ad); ask(); })); }
    finally { busy = false; go.disabled = false; }
  }
}

function buildCommon(id) {
  const m = META[id], host = document.querySelector(`.common[data-for="${id}"]`); if (!host) return;
  host.className = "station"; host.style.gap = "16px";
  const eqB = document.createElement("div"); eqB.className = "block";
  eqB.innerHTML = `<h3>The equation, decoded <span style="font-weight:400;color:var(--muted)">· tap each symbol</span></h3><div class="eq">${eqHTML(m.eq)}</div><p class="eq-say">Tap a coloured symbol to see what it means.</p>
    <dl class="dl"><dt>Trying to do</dt><dd>${esc(m.trying)}</dd><dt>Remove a piece</dt><dd>${esc(m.remove)}</dd><dt>What kind</dt><dd>${esc(m.kind)}</dd></dl>
    <div class="refs">${m.refs.map(r => `<span><b>Read:</b> ${esc(r)}</span>`).join("")}</div>`;
  const say = eqB.querySelector(".eq-say");
  eqB.querySelectorAll(".sym").forEach(s => { const f = () => { eqB.querySelectorAll(".sym").forEach(x => x.classList.toggle("on", x === s)); say.innerHTML = `<b>${esc(s.textContent)}</b>: ${esc(s.dataset.m)}`; }; s.onclick = f; s.onfocus = f; s.onmouseenter = f; });
  const codeB = document.createElement("div"); codeB.className = "block";
  codeB.innerHTML = `<div class="code-head"><h3 style="margin:0">The code</h3><span class="seg" role="group" aria-label="Code version"><button aria-pressed="true" data-c="np">From scratch (NumPy)</button><button aria-pressed="false" data-c="pt">PyTorch</button></span><button class="btn" type="button" data-copy>Copy</button></div><pre class="code"></pre>
    <p class="note">The NumPy version shows every number moving. The PyTorch version is what you run on the L4. Both are in the Colab notebook.</p>`;
  let which = "np"; const pre = codeB.querySelector("pre"); const show = () => { pre.innerHTML = hl(m[which]); codeB.querySelectorAll("[data-c]").forEach(b => b.setAttribute("aria-pressed", b.dataset.c === which)); };
  codeB.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { which = b.dataset.c; show(); }); show();
  codeB.querySelector("[data-copy]").onclick = e => { const t = m[which]; navigator.clipboard.writeText(t).then(() => { e.target.textContent = "Copied"; setTimeout(() => e.target.textContent = "Copy", 1400); }).catch(() => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }); };
  const askB = document.createElement("div"); askB.className = "block ask";
  const sec = document.querySelector(`[data-station="${id}"]`);
  makeAsk(askB, () => `Where he is: ${sec.querySelector("h2").textContent}. ${sec.querySelector(".lede").textContent}\nEquation on screen: ${m.eq.replace(/\[(.+?)\|\d\|[^\]]+\]/g, "$1")}\nCode on screen (NumPy):\n${m.np}\nCurrent simulation state: ${ST[id].state ? ST[id].state() : "n/a"}`, m.chips);
  const chB = document.createElement("div"); chB.className = "block";
  const rel = CH.filter(c => c[6].includes(id));
  chB.innerHTML = `<h3>Chapters this station belongs to</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${rel.map(c => `<button class="btn" type="button" data-open="${c[0]}${c[1]}">${c[0] === "M" ? "Murphy" : c[0] === "A" ? "Murphy 2" : "D2L"} ch. ${c[1]}: ${esc(c[2])}</button>`).join("") || "<span class='note'>—</span>"}</div>`;
  chB.querySelectorAll("[data-open]").forEach(b => b.onclick = () => goChapter(b.dataset.open));
  host.append(eqB, codeB, askB, chB);
}

/* ================= app shell ================= */
const ORDER = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"];
function go(id) {
  if (!ST[id]) id = "s1";
  if (cur && cur.exit) cur.exit();
  cur = ST[id]; cur.id = id;
  $$(".tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === id));
  $$("[data-station]").forEach(s => s.hidden = s.dataset.station !== id);
  $("#legend").innerHTML = cur.legend ? cur.legend() : "";
  flyTo(cur.cam[0], cur.cam[1]); $("#back-bar").hidden = !stationBack;
  if (cur.enter) cur.enter();
  $("#panel").scrollTop = 0;
  if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);

}
function boot() {
  readTheme();
  $("#crumb").onclick = () => openLibrary();
  $$(".modesw button").forEach(b => b.onclick = () => b.dataset.m === "concept" ? goConcept(selC) : goChapter(curChap || "M1"));
  $("#sym-btn").onclick = openSymbols; $("#proj-btn").onclick = openProjects; updateProgressBadge();
  $("#prev-ch").onclick = () => stepChapter(-1); $("#next-ch").onclick = () => stepChapter(1);
  ORDER.forEach(id => { ST[id].init && ST[id].init(); });
  syncers.forEach(f => f());
  ORDER.forEach(buildCommon);
  const six = [["a = σ(w·x + b)", "a neuron", "s1"], ["L = −Σ log p(right answer)", "how wrong", "s2"], ["w ← w − η∇L", "learning", "s3"], ["∂L/∂w = Π local slopes", "backprop", "s4"], ["h = φ(Wx + b)", "a layer", "s5"], ["min ‖x − dec(enc(x))‖²", "an autoencoder", "s7"]];
  $("#six").innerHTML = six.map(([e, w, s]) => `<button type="button" data-s="${s}"><code>${esc(e)}</code><span>${w} · station ${s.slice(1)}</span></button>`).join("");
  $$("#six button").forEach(b => b.onclick = () => { $("#why").hidden = true; goStation(b.dataset.s); });
  $("#why-btn").onclick = () => $("#why").hidden = false;
  $("#why-close").onclick = () => $("#why").hidden = true; $("#why-go").onclick = () => { $("#why").hidden = true; goChapter("M1"); };
  $("#why").addEventListener("click", e => { if (e.target.id === "why") $("#why").hidden = true; });
  addEventListener("keydown", e => { if (e.key === "Escape") { $("#why").hidden = true; $$(".drawer").forEach(d => d.hidden = true); } });
  let start = location.hash.slice(1), seen = null;
  try { seen = localStorage.getItem("nvl-station"); } catch (e) { }
  try { seen = localStorage.getItem("nvl-where"); } catch (e) { }
  const isCh = h => /^[MDA]\d+$/.test(h) && chapters(h[0]).some(c => c[0] === h.slice(1));
  if (start.startsWith("c-") && CI[start.slice(2)]) { curChap = isCh(seen || "") ? seen : "M1"; goConcept(start.slice(2)); }
  else if (ST[start] && !ST[start].isLab && start !== "sky" && start !== "cmap") goStation(start);
  else { goChapter(isCh(start) ? start : isCh(seen || "") ? seen : "M1"); if (!isCh(start) && !seen) $("#why").hidden = false; }
  camera.position.set(...cur.cam[0]); controls.target.set(...cur.cam[1]); camAnim = null;
  addEventListener("hashchange", () => { const h = location.hash.slice(1); if (h.startsWith("c-") && CI[h.slice(2)]) { if (h.slice(2) !== selC || mode !== "concept") goConcept(h.slice(2)); } else if (isCh(h) && (h !== curChap || mode !== "course")) goChapter(h); else if (ST[h] && !ST[h].isLab && cur.id !== h) goStation(h); });
  const mq = matchMedia("(prefers-color-scheme: dark)"); mq.addEventListener && mq.addEventListener("change", readTheme);
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  resize(); requestAnimationFrame(loop);
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (camAnim) { camAnim.t = Math.min(1, camAnim.t + dt * 1.6); const e = 1 - Math.pow(1 - camAnim.t, 3); camera.position.lerpVectors(camAnim.p0, camAnim.p1, e); controls.target.lerpVectors(camAnim.t0, camAnim.t1, e); if (camAnim.t >= 1) camAnim = null; }
  try { if (cur.tick) cur.tick(dt); } catch (err) { console.error(err); }
  V.begin(); Ln.begin(); PINS = []; si = 0;
  try { cur.draw(); } catch (err) { console.error(err); }
  V.end(); Ln.end(); controls.update(); renderer.render(scene, camera); placePins();
  requestAnimationFrame(loop);
}
boot();
