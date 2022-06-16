#!/usr/bin/env python

from llog import log

# The task is to port the CSV-specifric encoding and decoding functions,
# csesc and csunesc, from Rust to Python.
# Rust code of the functions can be found at
# https://play.rust-lang.org/?version=nightly&mode=debug&edition=2021&gist=8f7bd61f2c992fb9a3225c11d0b4aaec
# Resulting port should pass the unit test below:

def csesc (fr):
  return b'foo'

def csunesc (fr):
  return b'bar'

if __name__ == '__main__':
  assert csesc ("Привет, Юля!") == "Привет\u0001\u0006 Юля!"
  assert csunesc ("Привет\u0001\u0006 Юля!") == "Привет, Юля!"
  assert csesc ("0:\x00,10:\x0a,13:\x0d,34:\"") == "0:\u0001\u0002\u0001\u000610:\u0001\u0003\u0001\u000613:\u0001\u0004\u0001\u000634:\u0001\u0005"
  assert csunesc ("0:\u0001\u0002\u0001\u000610:\u0001\u0003\u0001\u000613:\u0001\u0004\u0001\u000634:\u0001\u0005") == "0:\x00,10:\x0a,13:\x0d,34:\""
