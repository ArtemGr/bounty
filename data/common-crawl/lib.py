#!/usr/bin/env python

import random
import re
import socket
import time
from http.client import ImproperConnectionState

from llog import floorʹ, log


def commoncrawl_s3():
  # https://commoncrawl.s3.amazonaws.com/crawl-data/CC-MAIN-2021-10/warc.paths.gz

  import http.client
  conn = None
  pause = 3
  for attempt in range(31):
    try:
      conn or (conn := http.client.HTTPSConnection('commoncrawl.s3.amazonaws.com'))
      conn.request('GET', '/crawl-data/CC-MAIN-2021-10/warc.paths.gz', headers={'User-Agent': 'curl/7.79.1'})
      resp = conn.getresponse()
      bytes = resp.read()
      # Might get the 503 Slow Down from Amazon S3
      # https://aws.amazon.com/premiumsupport/knowledge-center/s3-resolve-503-slowdown-throttling/
      # “You can send 3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD requests per second per partitioned prefix”
      if resp.status == 503:
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
    except (ImproperConnectionState, socket.gaierror) as ex:
      log(f"{ex}, retrying in {pause}")
      time.sleep(pause)
      conn = None
      continue


if __name__ == '__main__':
  pass
