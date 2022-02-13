#!/usr/bin/env python

import io
import random
import re
import socket
import subprocess
import time
import zlib
from http.client import ImproperConnectionState

import lib
import requests
from llog import floorʹ, log
from llog.state import State

if __name__ == '__main__':
  log('started..')
  state = State('common-crawl.mdb')
  log('hostname..')
  hostname = socket.gethostname()
  log(f"hostname: {hostname}")
  # if hostname == 'MSI':
  #   subprocess.call(['wsl', '.', 'to-us-east-1.sh'])
  #   exit(0)

  with state.begin() as st:
    if 'warc.paths.gz' in st:
      paths_hdr, paths_gz = st['warc.paths.gz']
    else:
      resp = lib.commoncrawl_s3('/crawl-data/CC-MAIN-2021-10/warc.paths.gz')
      #open('warc.paths.gz', 'wb').write(bytes)
      assert resp.headers['Content-Type'] == 'binary/octet-stream'
      assert resp.headers['Server'] == 'AmazonS3'
      paths_hdr, paths_gz = st['warc.paths.gz'] = resp.headers, resp.read()

  for path in lib.zlib_stream2bytes(io.BytesIO(paths_gz)).split(b'\n'):
    log(path)
    # use range requests to continue from the piece we have not parsed yet
    # https://datatracker.ietf.org/doc/html/rfc7233
    # https://en.wikipedia.org/wiki/Byte_serving
    # Accept-Ranges: bytes

    # in light of 503, time the opening and keep stats (in the State), to see if we'd need to optimize for stream acquisition
    resp = lib.commoncrawl_s3('/' + path.decode())

    log(resp)
    # feed resp to fastwarc
    # (accepts compressed streams)
    break
