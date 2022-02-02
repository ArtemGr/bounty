#!/usr/bin/env python

from llog import log
import numpy as np


# multiply a matrix by a vector
# https://youtu.be/YiqIkSHSmyc MIT 18.065, Gilbert Strang; ~4
def matrix_by_vector():
  # define a matrix
  #  2  1  3
  #  3  1  4
  #  5  7 12
  # cf. https://numpy.org/doc/stable/reference/generated/numpy.vstack.html
  log('column-major\n', np.dstack([[2, 3, 5], [1, 1, 7], [3, 4, 12]]))
  log('row-major\n', np.vstack([[2, 1, 3], [3, 1, 4], [5, 7, 12]]))


if __name__ == "__main__":
  matrix_by_vector()
