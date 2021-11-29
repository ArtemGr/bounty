#!/bin/bash

if [ ! -e /mnt/c/WINDOWS/system32/wsl.exe ]; then
    wsl bash build.sh
    sleep 3.14
    exit 0
fi

export PATH=$PATH:$HOME/.cargo/bin
export RUSTFLAGS=-Ctarget-cpu=native

set -ex

#cargo test --release -- --nocapture

cargo build --release

target/release/nn --big-query

#target/release/nn --elm
