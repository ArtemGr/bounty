#!/usr/bin/env python

# JAX AdaBelief on MNIST
# borrows from https://colab.research.google.com/github/google/jax/blob/main/docs/notebooks/Neural_Network_and_Data_Loading.ipynb

import os
import time

import jax.numpy as jnp
from jax import grad, jit, random, vmap
from jax.scipy.special import logsumexp
from llog import floorʹ, log


def random_layer_params(fr, to, key, scale=1e-2):
  '''randomly initialize weights and biases for a dense neural network layer'''
  w_key, b_key = random.split(key)
  return scale * random.normal(w_key, (to, fr)), scale * random.normal(b_key, (to,))


def init_network_params(layer_sizes, key):
  '''initialize all layers for a fully-connected neural network'''
  keys = random.split(key, len(layer_sizes))
  return [random_layer_params(fr, to, k) for fr, to, k in zip(layer_sizes[:-1], layer_sizes[1:], keys)]


def init_ms(layer_sizes):
  return [(jnp.zeros((to, fr)), jnp.zeros(to,)) for fr, to in zip(layer_sizes[:-1], layer_sizes[1:])]


def relu(x):
  return jnp.maximum(0, x)


def predict(params, input):
  activations = input.flatten()  # (28, 28) -> (784,)
  for w, b in params[:-1]:
    outputs = jnp.dot(w, activations) + b
    activations = relu(outputs)

  # NB: Could use the `outputs`, but unrolling this last step seems to make the JIT version faster.
  final_w, final_b = params[-1]
  logits = jnp.dot(final_w, activations) + final_b
  # https://docs.scipy.org/doc/scipy/reference/generated/scipy.special.logsumexp.html
  # https://en.wikipedia.org/wiki/LogSumExp
  return logits - logsumexp(logits)


batched_predict = vmap(predict, in_axes=(None, 0))


def loss(params, inputs, targets):
  preds = batched_predict(params, inputs)
  return -jnp.mean(preds * targets)


#def update(params, x, y):
#  grads = grad(loss)(params, x, y)
#  step_size = 0.01
#  return [(w - step_size * dw, b - step_size * db) for (w, b), (dw, db) in zip(params, grads)]


def adabeliefʹ(t, g, m, s, θ):
  # cf. https://arxiv.org/pdf/2010.07468.pdf AdaBelief Optimizer: Adapting Stepsizes by the Belief in Observed Gradients
  # https://www.youtube.com/playlist?list=PL7KkG3n9bER6YmMLrKJ5wocjlvP7aWoOu AdaBelief Optimizer, Toy examples

  α = 0.03
  β1 = 0.9
  β2 = 0.999
  ε = 0.01

  t = jnp.where(t == 0, 1, t)  # Sticky NaN on t == 0 otherwise

  m = β1 * m + (1. - β1) * g
  s = β2 * s + (1. - β2) * ((g - m)**2)

  mˆ = m / (1. - β1**t)

  # “Note that an extra ε is added to sᵗ during bias-correction, in order to
  # better match the assumption that sᵗ is bounded below (the lower bound is at least ε).”
  sˆ = (s + ε) / (1. - β2**t)

  # “Intuitively, 1/√s is the “belief” in the observation: viewing mᵗ as the prediction of the gradient,
  # if gᵗ deviates much from mᵗ, we have weak belief in gᵗ, and take a small step;
  # if gᵗ is close to the prediction mᵗ, we have a strong belief in gᵗ, and take a large step.”
  θ = θ - α * mˆ / (jnp.sqrt(sˆ) + ε)

  return m, s, θ


def adabelief(loss, t, m, s, params, x, y):
  grads = grad(loss)(params, x, y)
  wbs = []
  ms = []
  ss = []
  for (mw, mb), (sw, sb), (w, b), (dw, db) in zip(m, s, params, grads):
    mw, sw, w = adabeliefʹ(t, dw, mw, sw, w)
    mb, sb, b = adabeliefʹ(t, db, mb, sb, b)
    ms.append((mw, mb))
    ss.append((sw, sb))
    wbs.append((w, b))
  return ms, ss, wbs


def accuracy(params, inputs, targets):
  predicted_class = jnp.argmax(batched_predict(params, inputs), axis=1)
  return jnp.mean(predicted_class == targets)


def one_hot(x, k):
  # NB: Reverse of one_hot is argmax, https://numpy.org/doc/stable/reference/generated/numpy.argmax.html
  # 2022-03: For comprehension is more readable but takes a lot of time to trace and compile
  #return jnp.array([[k == x for k in range(k)] for x in x], dtype=jnp.float32)
  # 2022-03: This arcane trick compiles much faster, but there is still a type mismatch at runtime
  return jnp.array(x[:, None] == jnp.arange(k), dtype=jnp.float32)


if __name__ == '__main__':
  from keras.datasets import mnist

  log('allocating parameters…')
  layer_sizes = [784, 512, 512, 10]
  rkey = random.PRNGKey(1)
  params = init_network_params(layer_sizes, rkey)
  m, s = init_ms(layer_sizes), init_ms(layer_sizes)

  log('loading MNIST…')
  (x_train, y_train), (x_test, y_test) = mnist.load_data()
  assert os.path.exists(os.path.expanduser('~/.keras/datasets/mnist.npz'))

  assert x_train.shape == (60000, 28, 28)
  assert x_train.shape[1] * x_train.shape[2] == layer_sizes[0]
  assert y_train.shape == (60000,)

  assert x_test.shape == (10000, 28, 28)
  assert x_test.shape[1] * x_test.shape[2] == layer_sizes[0]
  assert y_test.shape == (10000,)

  # Takes a single input and returns the activations of the output
  input = random.normal(rkey, (layer_sizes[0],))
  preds = predict(params, input)
  assert preds.shape == (layer_sizes[-1],)

  # Vectorized it takes a bunch of inputs and returns a bunch of outputs
  batch_size = 1024
  inputs = random.normal(rkey, (batch_size, layer_sizes[0]))
  preds = batched_predict(params, inputs)
  assert preds.shape == (batch_size, layer_sizes[-1])

  y_ones = one_hot(y_train, layer_sizes[-1])

  log('compiling test accuracy…')
  accuracyᵔ = jit(accuracy).lower(params, x_test, y_test).compile()
  log('compiling train accuracy…')
  accuracyᵕ = jit(accuracy).lower(params, x_train, y_train).compile()
  #log('compiling one_hot…')
  #one_hotˉ = jit(one_hot, static_argnums=1).lower(y_train[:batch_size], layer_sizes[-1]).compile()
  log('compiling adabelief…')
  adabeliefˉ = jit(
      adabelief,
      static_argnums=0,
  ).lower(loss, 1, m, s, params, x_train[:batch_size], y_ones[:batch_size]).compile()

  epochs = 314
  log(f"training for {epochs} epochs…")
  batches = random.randint(rkey, (epochs,), 0, len(x_train) - batch_size)
  for epoch, batch_ofs in enumerate(batches):
    x = x_train[batch_ofs:batch_ofs + batch_size]
    assert len(x) == batch_size

    y = y_ones[batch_ofs:batch_ofs + batch_size]
    start = time.time()
    #params = update(params, x, y)
    m, s, params = adabeliefˉ(epoch, m, s, params, x, y)
    delta = floorʹ(time.time() - start)

    if epoch % 10 == 0 or epoch == epochs - 1:
      train_acc = floorʹ(accuracyᵕ(params, x_train, y_train), 1)
      test_acc = floorʹ(accuracyᵔ(params, x_test, y_test), 1)
      log(f"Epoch {epoch}; {delta}s; accuracy: train {train_acc}, test {test_acc}")
