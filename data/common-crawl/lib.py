#!/usr/bin/env python

import random
import re
import socket
import time
import zlib
from http.client import ImproperConnectionState

from llog import floorʹ, log


def zlib_stream2bytes(stream):
  # cf. https://stackoverflow.com/a/22312660/257568
  dc = zlib.decompressobj(zlib.MAX_WBITS | 32)
  chunks = []
  while (piece := stream.read(123)):
    chunks.append(dc.decompress(piece))
  return b''.join(chunks)


def commoncrawl_s3(path):
  # https://commoncrawl.s3.amazonaws.com/crawl-data/CC-MAIN-2021-10/warc.paths.gz

  import http.client
  conn = None
  pause = 3
  host = 'commoncrawl.s3.amazonaws.com'
  for attempt in range(314):
    try:
      conn or (conn := http.client.HTTPSConnection(host))
      conn.request('GET', path)  # headers={'User-Agent': 'curl/7.79.1'}
      resp = conn.getresponse()
      # Might get the 503 Slow Down from Amazon S3
      # https://aws.amazon.com/premiumsupport/knowledge-center/s3-resolve-503-slowdown-throttling/
      # “You can send 3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD requests per second per partitioned prefix”
      if resp.status == 503:
        bytes = resp.read()
        try:
          why = re.sub(r'[^\w<> =/!\.]', '?', bytes.decode())
          if 234 < len(why):
            why = why[:234]
        except Exception:
          why = ''
        log(f"503, retrying in {pause}; “{why}”")
        time.sleep(pause)
        pause = floorʹ(pause + random.uniform(0.1, pause))
        continue
      if resp.status != 200:
        raise Exception(f"Unexpected status: {resp.status}")
      return resp
    except (ImproperConnectionState, socket.gaierror) as ex:
      log(f"{ex}, retrying in {pause}")
      time.sleep(pause)
      conn = None
      continue
  raise Exception(f"Out of attempts with {host}")


if __name__ == '__main__':
  pass
