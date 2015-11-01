#!/bin/bash
set -e

if [ $(hostname) != "vseedbox" ]; then
  echo "Run this on vseedbox.";
  exit 1;
fi

root=$(dirname $0)/..

echo "minifying client..";
( cd $root/client && node ../deploy/minify.js )

mv $root/client/index.min.html $root/server/

echo "deploying..";
if [ -f $root/server/config.override.js ]; then
  mv $root/server/config.override.js $root/server/config.override.js.backup
fi
cp $root/deploy/xfer.config.js $root/server/config.override.js

rm -rf /srv/songuess/*
( cp -r $root/server/* /srv/songuess )

rm $root/server/config.override.js
if [ -f $root/server/config.override.js.backup ]; then
  mv $root/server/config.override.js.backup $root/server/config.override.js
fi
rm -f $root/server/index.min.html

echo "that's it! hope everything was npm installed."
