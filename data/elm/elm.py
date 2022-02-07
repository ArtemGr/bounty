#!/usr/bin/env python

# https://www.kaggle.com/robertbm/extreme-learning-machine-example

# https://youtu.be/oq3tq-0gxOs importing and loading MNIST
# https://youtu.be/AhmSUmrAkeQ solving dependency duplication due to version mismatch
# https://youtu.be/0mcyw5uapWc running tfjs-examples-mnist-node on copied tensors
# https://youtu.be/dXRyUurAy3k is TensorFlow a good fit and why turn low level

import math

import numpy as np
from llog import log

rng = np.random.default_rng()


def build_h(inputs, weights, bias):
  '''
  ```
  H = [
    g (w1 * x1 + b1)  …  g (wᶰ * x1 + bᶰ)
    …
    g (w1 * xN + b1)  …  g (wᶰ * xN + bᶰ)
  ]
  ```
  where
    ᶰ is a number of hidden neurons
    N is a number of training samples
    g is the activation function (such as `sin`)

  As named in Babri and Huang, H is called
  the hidden layer output matrix of the neural network; the
  `i`th column of H is the `i`th hidden neuron’s output vector
  with respect to inputs x1, x2, · · · , xN.
  '''
  ᶰ = len(weights)
  h = []
  for sample in range(0, len(inputs)):
    row = []
    for neuron in range(0, ᶰ):
      # The neuron then applies an activation function to the “sum of weighted inputs”
      wx = 0
      for x in inputs[sample]:
        wx += weights[neuron] * x
      row.append(math.sin(wx + bias[neuron]))
    h.append(row)
  return h


def train(ᶰ, inputs, outputs):
  weights = rng.standard_normal(ᶰ, dtype=np.float32)
  bias = rng.standard_normal(ᶰ, dtype=np.float32)
  h = build_h(inputs, weights, bias)
  hꜝ = np.linalg.pinv(h)
  # β = H†T, where † is Moore–Penrose inverse
  β = np.matmul(hꜝ, outputs)
  return (weights, bias, β)


def infer(weights, bias, β, input):
  h = build_h([input], weights, bias)
  return np.matmul(h, β)[0]


def test(input, idim, output, odim):
  pass


def floorʹ(v):
  '''drop more decimal places depending on whether the integer is large'''
  if 99 < v:
    return math.floor(v)
  if 9 < v:
    return math.floor(v * 10) / 10
  if 0.9 < v:
    return math.floor(v * 100) / 100
  if 0.09 < v:
    return math.floor(v * 1000) / 1000
  return math.floor(v * 10000) / 10000


def floorᵃ(a):
  return list(map(lambda v: floorʹ(v), a))


if __name__ == '__main__':
  inputs = [[1], [2]]
  outputs = [[1], [2]]
  weights, bias, β = train(2, inputs, outputs)
  log('id (1) =', infer(weights, bias, β, [1]))
  log('id (2) =', infer(weights, bias, β, [2]))

  import matplotlib.pyplot as plt
  import pylab

  def plot(title):
    xs = []
    ys = []
    for i in np.linspace(-1, 7, 44):
      xs.append(i)
      ys.append(infer(weights, bias, β, [i])[0])
    plt.plot(xs, ys)
    plt.scatter(inputs, outputs)
    pylab.gcf().canvas.manager.set_window_title(title)
    pylab.show()

  plot('id')

  inputs = [[1], [2], [3]]
  outputs = [[3], [2], [1]]
  weights, bias, β = train(3, inputs, outputs)
  log('inverse (1) =', infer(weights, bias, β, [1]))
  log('inverse (2) =', infer(weights, bias, β, [2]))
  log('inverse (3) =', infer(weights, bias, β, [3]))
  plot('inverse')

  weights, bias, β = train(3, [[2, 2], [3, 3], [2, 3]], [[4], [6], [5]])
  log('sum (2, 2) =', infer(weights, bias, β, [2, 2]))
  log('sum (3, 3) =', infer(weights, bias, β, [3, 3]))
  log('sum (2, 3) =', infer(weights, bias, β, [2, 3]))

  # https://en.wikipedia.org/wiki/Euclidean_division
  weights, bias, β = train(3, [[7, 3], [9, 4], [9, 3]], [[2, 1], [2, 1], [3, 0]])
  log('7 / 3 =', infer(weights, bias, β, [7, 3]))
  log('9 / 4 =', infer(weights, bias, β, [9, 4]))
  log('9 / 3 =', floorᵃ(infer(weights, bias, β, [9, 3])))
