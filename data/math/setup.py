# Builds matrix.pyx
#
#     pip install --user --upgrade Cython
#     python setup.py build_ext --inplace
#     python -c "import matrix"

from setuptools import setup
import numpy
from Cython.Build import cythonize

setup(ext_modules=cythonize('matrix.pyx', compiler_directives={'language_level': '3'}),
      include_dirs=[numpy.get_include()])
