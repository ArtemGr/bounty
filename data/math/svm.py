#!/usr/bin/env python

def sin():
  """demonstrate SVM smoothing sin"""
  import libsvm.svmutil as svm  # https://github.com/cjlin1/libsvm
  import math
  import matplotlib.pyplot as plt
  import numpy as np

  samples, fold = 100, 50
  x = np.linspace (0, 6 * np.pi, samples)
  features = list (map (lambda x: [x], x))  # [x1, x2, x3, ..] to [[x1], [x2], [x3], ..]
  labels = list (map (lambda x: math.sin (x), x))
  plt.subplot (2, 1, 1)
  plt.plot (x, labels, label= 'sin')
  plt.legend()
  plt.axvline (x= x[fold], linestyle= '--', linewidth= 1, alpha= 0.3)
  plt.grid (True, alpha= 0.3)

  prob = svm.svm_problem (labels[:fold], features[:fold])
  m = svm.svm_train (prob, '-s 3 -t 2 -q -c 1 -g .1')  # epsilon RBF, C, γ
  y, _acc, _vals = svm.svm_predict (labels, features, m, '-q')
  plt.subplot (2, 1, 2)
  plt.plot (x, y, label= 'svm')
  plt.axvline (x= x[fold], linestyle= '--', linewidth= 1, alpha= 0.7, label= 'fold')
  plt.legend()
  plt.grid (True, alpha= 0.3)
  plt.gcf().canvas.manager.set_window_title ('sin')
  plt.tight_layout()
  plt.show()

sin()
