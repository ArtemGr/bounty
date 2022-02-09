#!/usr/bin/env python

# With Python 3:
#
#     pip install --user --upgrade -r requirements.txt
#     python elm.py

# cf. https://www.kaggle.com/robertbm/extreme-learning-machine-example

# https://youtu.be/oq3tq-0gxOs importing and loading MNIST
# https://youtu.be/AhmSUmrAkeQ solving dependency duplication due to version mismatch
# https://youtu.be/0mcyw5uapWc running tfjs-examples-mnist-node on copied tensors
# https://youtu.be/dXRyUurAy3k is TensorFlow a good fit and why turn low level
# https://youtu.be/cXrgsmss7og plotting ELM functions with Bedstead

import math

import numpy as np

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
  return weights, bias, β


def infer(weights, bias, β, input):
  h = build_h([input], weights, bias)
  return np.matmul(h, β)[0]


def test(input, idim, output, odim):
  pass


if __name__ == '__main__':
  import shutil

  from llog import floorᵃ, log, plot

  wh = shutil.get_terminal_size((111, 11))
  wh = (wh.columns - 1, min(7, wh.lines - 3))
  a = [[' ' for x in range(wh[0])] for u in range(wh[1])]
  wofs = 0

  inputs = [[1], [2]]
  outputs = [[1], [2]]
  while 7 < wh[0] - wofs:
    weights, bias, β = train(2, inputs, outputs)
    if wofs == 0:
      log('id (1) =', infer(weights, bias, β, [1]))
      log('id (2) =', infer(weights, bias, β, [2]))

    xs = np.linspace(-1, 7, 44)
    ys = list(infer(weights, bias, β, [x])[0] for x in xs)
    map = plot(a, xs, ys, wofs)
    for *_, ax, ay in map.zip([i[0] for i in inputs], [o[0] for o in outputs]):
      a[ay][ax] = '\033[34m*\033[0m'
    wofs += map.width // 2 + 3

  print('\n'.join(''.join(y) for y in a))

  inputs = [[1], [2], [3]]
  outputs = [[3], [2], [1]]
  weights, bias, β = train(3, inputs, outputs)
  log('inverse (1) =', infer(weights, bias, β, [1]))
  log('inverse (2) =', infer(weights, bias, β, [2]))
  log('inverse (3) =', infer(weights, bias, β, [3]))
  #plot('inverse')

  weights, bias, β = train(3, [[2, 2], [3, 3], [2, 3]], [[4], [6], [5]])
  log('sum (2, 2) =', infer(weights, bias, β, [2, 2]))
  log('sum (3, 3) =', infer(weights, bias, β, [3, 3]))
  log('sum (2, 3) =', infer(weights, bias, β, [2, 3]))

  # https://en.wikipedia.org/wiki/Euclidean_division
  weights, bias, β = train(3, [[7, 3], [9, 4], [9, 3]], [[2, 1], [2, 1], [3, 0]])
  log('7 / 3 =', infer(weights, bias, β, [7, 3]))
  log('9 / 4 =', infer(weights, bias, β, [9, 4]))
  log('9 / 3 =', floorᵃ(infer(weights, bias, β, [9, 3])))
