#!/usr/bin/env python

import os
from math import sqrt

import xgboost as xgb
from keras.datasets import mnist
from llog import floorʹ, log

if __name__ == '__main__':
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
