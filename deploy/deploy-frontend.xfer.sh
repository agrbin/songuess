#!/bin/bash
# Deploys only frontend, assumes that master server is up.
# TODO: I should write a debug-enabled sandbox instance.

set -e

if [ $(hostname) != "vseedbox" ]; then
  echo "Run this on vseedbox.";
  exit 1;
fi

root=$(dirname $0)/..

echo "minifying client..";
( cd $root/client && node ../deploy/minify.js )

cp $root/client/index.min.html /srv/songuess

rm -f $root/client/index.min.html

echo "that's it!"
