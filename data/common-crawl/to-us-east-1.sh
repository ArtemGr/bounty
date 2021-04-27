#!/bin/sh
# NB: Run under `wsl`

PATH=$PATH:$HOME/.cargo/bin
set -ex

export OPENSSL_STATIC=true
export OPENSSL_DIR=/home/artem/musl

cargo build --release --target x86_64-unknown-linux-musl
rsync -zt --partial --progress --chmod=D770,F700 target/x86_64-unknown-linux-musl/release/common-crawl ubuntu@us-east-1.servebeer.com:common-crawl/
ssh ubuntu@us-east-1.servebeer.com 'cd common-crawl && ./common-crawl'
