#!/usr/bin/env python

import os
import sys

if (libtorch := os.environ['LIBTORCH']) and os.path.exists(libtorch) and sys.platform == 'win32':
  lib = os.path.abspath(os.path.join(libtorch, 'lib'))
  os.environ['PATH'] = lib + ';' + os.environ['PATH']  # Find DLLs in

#assert 0 == os.system('cargo build')
assert 0 == os.system('cargo run')
