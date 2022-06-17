#!/usr/bin/env python

import time
import re
from llog import log

# Rust code of the functions can be found at
# https://play.rust-lang.org/?version=nightly&mode=debug&edition=2021&gist=8f7bd61f2c992fb9a3225c11d0b4aaec

chars_to_csv = {
    "\x01": "\u0001\u0001",
    "\x00": "\u0001\u0002",
    "\n": "\u0001\u0003",
    "\r": "\u0001\u0004",
    "\"": "\u0001\u0005",
    ",": "\u0001\u0006"
}


def csesc(fr):
  result = []
  for c in fr:
    result.append(chars_to_csv.get(c, c))
  return "".join(result)


#⚆ use a binary pattern, rb''

esc = re.compile(r'[\x01\x00\n\r",]')


def cb(ma):
  ch = ma[0]
  if ch == ',':
    return '\x01\x06'
  if ch == '"':
    return '\x01\x05'
  if ch == '\r':
    return '\x01\x04'
  if ch == '\n':
    return '\x01\x03'
  if ch == '\x00':
    return '\x01\x02'
  if ch == '\x01':
    return '\x01\x01'
  return ma[0]


def csesc2(fr):
  return esc.sub(cb, fr)


csv_to_chars = ["\x01", "\x00", "\n", "\r", "\"", ","]


def csunesc(fr):
  result = []
  encoded = False
  for c in fr:
    if encoded:
      encoded = False
      if c < "\u0007":
        result.append(csv_to_chars[ord(c) - 1])
      else:
        result.append("\u0001" + c)
    elif c == "\u0001":
      encoded = True
    else:
      result.append(c)
  return "".join(result)


if __name__ == '__main__':
  import timeit

  import numpy as np

  def csescᵗ():
    assert csesc("Привет, Юля!") == "Привет\u0001\u0006 Юля!"

  t = timeit.timeit(csescᵗ, number=99) / 99
  log('csesc', np.format_float_positional(t, trim='-'), 'o/s')

  def csesc2ᵗ():
    assert csesc2("Привет, Юля!") == "Привет\u0001\u0006 Юля!"

  t = timeit.timeit(csesc2ᵗ, number=99) / 99
  log('csesc2', np.format_float_positional(t, trim='-'), 'o/s')

  assert csesc2("Привет, Юля!") == "Привет\u0001\u0006 Юля!"

  assert csesc("Привет, Юля!") == "Привет\u0001\u0006 Юля!"
  assert csunesc("Привет\u0001\u0006 Юля!") == "Привет, Юля!"
  assert csesc(
      "0:\x00,10:\x0a,13:\x0d,34:\""
  ) == "0:\u0001\u0002\u0001\u000610:\u0001\u0003\u0001\u000613:\u0001\u0004\u0001\u000634:\u0001\u0005"
  assert csunesc(
      "0:\u0001\u0002\u0001\u000610:\u0001\u0003\u0001\u000613:\u0001\u0004\u0001\u000634:\u0001\u0005"
  ) == "0:\x00,10:\x0a,13:\x0d,34:\""
