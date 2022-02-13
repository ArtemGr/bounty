#!/bin/sh
# NB: Run under `wsl`

# To upgrade Python dependencies:
# ssh ubuntu@us-east-1.servebeer.com 'cd common-crawl && pip install --user --upgrade -r requirements.txt'

PATH=$PATH:$HOME/.cargo/bin
set -ex

export OPENSSL_STATIC=true
export OPENSSL_DIR=/home/artem/musl

#cargo build --release --target x86_64-unknown-linux-musl
#  target/x86_64-unknown-linux-musl/release/common-crawl \

rsync -rzt --delete --partial --progress --chmod=D770,F600 \
  requirements.txt *.py \
  ubuntu@us-east-1.servebeer.com:common-crawl/
ssh ubuntu@us-east-1.servebeer.com 'cd common-crawl && echo "starting common-crawl.py.." && python common-crawl.py'
