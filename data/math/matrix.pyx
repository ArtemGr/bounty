import numpy as np
cimport numpy as cnp
cimport cython

cnp.import_array()

cdef matrix_by_vector():
  # define a matrix
  #  2  1  3
  #  3  1  4
  #  5  7 12
  # cf. https://numpy.org/doc/stable/reference/generated/numpy.vstack.html
  print('column-major')
  print(np.dstack([[2, 3, 5], [1, 1, 7], [3, 4, 12]]))
  print('row-major')
  print(np.vstack([[2, 1, 3], [3, 1, 4], [5, 7, 12]]))


matrix_by_vector()
