#!/usr/bin/env python

import re

from llog import log

# Rust code of the functions can be found at
# https://play.rust-lang.org/?version=nightly&mode=debug&edition=2021&gist=8f7bd61f2c992fb9a3225c11d0b4aaec

_esc = re.compile(rb'[\x01\x00\n\r",]')


def _bcb(ma):
  ch = ma[0]
  if ch == b',':
    return b'\x01\x06'
  if ch == b'"':
    return b'\x01\x05'
  if ch == b'\r':
    return b'\x01\x04'
  if ch == b'\n':
    return b'\x01\x03'
  if ch == b'\x00':
    return b'\x01\x02'
  if ch == b'\x01':
    return b'\x01\x01'
  return ch


def csesc(fr: bytes):
  '''escape 0, 10, 13, 34 (double quote) and 44 (comma)'''
  return _esc.sub(_bcb, fr)


_unesc = [1, 0, 10, 13, 34, 44]


def csunesc(fr: bytes):
  '''unescape for csesc'''
  result = bytearray()
  encoded = False
  for code in fr:
    if encoded:
      encoded = False
      result.append(_unesc[code - 1])
    elif code == 1:
      encoded = True
    else:
      result.append(code)
  return result


if __name__ == '__main__':
  import timeit

  import numpy as np

  hello = "Привет, Юля!".encode('utf-8')
  hesc = "Привет\u0001\u0006 Юля!".encode('utf-8')

  def csescᵗ():
    assert csesc(hello) == hesc

  t = timeit.timeit(csescᵗ, number=99) / 99
  log('csesc', np.format_float_positional(t, trim='-'), 'o/s')

  assert csunesc("Привет\u0001\u0006 Юля!".encode('utf-8')) == "Привет, Юля!".encode('utf-8')
  assert csunesc(
      "0:\u0001\u0002\u0001\u000610:\u0001\u0003\u0001\u000613:\u0001\u0004\u0001\u000634:\u0001\u0005".encode(
          'utf-8')) == "0:\x00,10:\x0a,13:\x0d,34:\"".encode('utf-8')

  assert csesc("Привет, Юля!".encode('utf-8')) == "Привет\u0001\u0006 Юля!".encode('utf-8')
  assert csesc(
      "0:\x00,10:\x0a,13:\x0d,34:\"".encode('utf-8')
  ) == "0:\u0001\u0002\u0001\u000610:\u0001\u0003\u0001\u000613:\u0001\u0004\u0001\u000634:\u0001\u0005".encode(
      'utf-8')
