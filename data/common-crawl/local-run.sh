#!/bin/bash

if [ ! -e /mnt/c/WINDOWS/system32/wsl.exe ]; then
    wsl . to-gift-one.sh
    sleep 3.14
    exit 0
fi

set -ex

#cargo build

python common-crawl.py
