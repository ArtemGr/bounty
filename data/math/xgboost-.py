#!/usr/bin/env python

import os
import shutil
from math import sqrt

import numpy as np
import xgboost as xgb
from llog import floorʹ, log, plot


def mnist():
  from keras.datasets import mnist

  log('loading MNIST…')
  (x_train, y_train), (x_test, y_test) = mnist.load_data()
  assert os.path.exists(os.path.expanduser('~/.keras/datasets/mnist.npz'))

  assert x_train.shape == (60000, 28, 28)
  assert x_train.shape[1] * x_train.shape[2] == 784
  assert y_train.shape == (60000,)

  assert x_test.shape == (10000, 28, 28)
  assert x_test.shape[1] * x_test.shape[2] == 784
  assert y_test.shape == (10000,)

  # https://stackoverflow.com/a/61573347/257568
  # “it seems that X needs to be 2-dimensional, and Y needs to be 1-dimensional”
  # https://github.com/dmlc/xgboost/issues/2000#issuecomment-283033116
  # “xgboost (like sklearn) expects X as 2D data (n_samples, n_features)”
  x_train = x_train.reshape(x_train.shape[0], -1)
  assert x_train.shape == (60000, 784)
  y_train = y_train.reshape(y_train.shape[0], -1)
  assert y_train.shape == (60000, 1)
  dtrain = xgb.DMatrix(x_train, label=y_train)

  x_test = x_test.reshape(x_test.shape[0], -1)
  assert x_test.shape == (10000, 784)
  y_test = y_test.reshape(y_test.shape[0], -1)
  assert y_test.shape == (10000, 1)
  dtest = xgb.DMatrix(x_test, label=y_test)

  param = {'max_depth': 2, 'eta': 1, 'objective': 'reg:squarederror'}
  log('training…')
  best = xgb.train(param,
                   dtrain,
                   num_boost_round=31,
                   evals=[(dtrain, 'train'), (dtest, 'test')],
                   verbose_eval=True)

  log('testing…')
  ypred = best.predict(dtest)
  loss = 0
  for pred, test in zip(ypred, y_test):
    loss += (pred - test[0])**2
  mse = loss / len(ypred)
  # cf. error rates at http://yann.lecun.com/exdb/mnist/
  log('MSE', floorʹ(mse), 'RMSE', floorʹ(sqrt(mse)))


def plotio(inputs, outputs, xs):
  wh = shutil.get_terminal_size((111, 11))
  wh = (wh.columns - 1, min(3, wh.lines - 3))
  param = {'max_depth': 2, 'eta': 1, 'objective': 'reg:squarederror'}
  for rounds in range(1, 9):
    best = xgb.train(param, xgb.DMatrix(inputs, label=outputs), num_boost_round=rounds)
    ys = list(best.predict(xgb.DMatrix([[x]]))[0] for x in xs)
    log(rounds, xs, ys)
    a = [[' ' for x in range(wh[0])] for u in range(wh[1])]
    map = plot(a, xs, ys)
    for *_, ax, ay in map.zip([i[0] for i in inputs], [o[0] for o in outputs]):
      a[ay][ax] = '\033[34m*\033[0m'
    print('\n'.join(''.join(y) for y in a))

  gv = xgb.to_graphviz(best)
  open('plotio.pdf', 'wb').write(gv.pipe())


def perfect_symmetry():
  '''
  “a nice example of data with "perfect symmetry" with unstable balance.
  With such perfect dataset, when the algorithm is looking for a split, say in variable X1,
  the sums of residuals at each x1 location of it WRT X2 are always zero,
  thus it cannot find any split and is only able to approximate the total average”
  https://github.com/dmlc/xgboost/issues/4069#issuecomment-456266057
  https://www.mariofilho.com/can-gradient-boosting-learn-simple-arithmetic/
  '''

  import matplotlib.pyplot as plt

  X = np.zeros((size := 10000, 2))
  Z = np.meshgrid(np.linspace(-1, 1, 100), np.linspace(-1, 1, 100))
  X[:, 0] = Z[0].flatten()
  X[:, 1] = Z[1].flatten()
  y_mul = X[:, 0] * X[:, 1]

  fig = plt.figure(figsize=(5, 5))
  ax = fig.add_subplot(2, 1, 1, projection='3d')
  ax.plot_trisurf(X[:, 0], X[:, 1], y_mul, cmap='viridis')

  dtrain = xgb.DMatrix(X, label=y_mul)
  params = {'tree_method': 'gpu_hist'}
  bst = xgb.train(params, dtrain, evals=[(dtrain, 'train')], num_boost_round=10)
  y_pred = bst.predict(dtrain)

  ax = fig.add_subplot(2, 1, 2, projection='3d')
  ax.plot_trisurf(X[:, 0], X[:, 1], y_pred, cmap='viridis')
  plt.show()


if __name__ == '__main__':
  #plotio([[1], [2]], [[1], [2]], np.linspace(-1, 4, 6))  # id
  #plotio([[1], [2], [3]], [[3], [2], [1]], np.linspace(-1, 5, 7))  # inverse
  perfect_symmetry()
