#!/bin/bash
TARGET_DIR=/srv/songuess-media
set -e

if [ $(hostname) != "vseedbox" ]; then
  echo "Run this on vseedbox.";
  exit 1;
fi

root=$(dirname $0)/..

cp --no-dereference --recursive $root/media/* $TARGET_DIR
cp $root/deploy/xfer-media.config.js $TARGET_DIR/server/config.override.js
cp $root/deploy/rescan.cron.sh $TARGET_DIR/rescan.cron.sh

echo "deployed."
echo "make sure everything is npm installed and make(d) in this checkout."
