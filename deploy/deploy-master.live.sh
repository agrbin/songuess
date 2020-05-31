#!/bin/bash
set -e

if [ $(hostname) != "songuess" ]; then
  echo "Run this on songuess.";
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
cp $root/deploy/live.config.js $root/server/config.override.js

cp -r $root/server/* /srv/songuess
# Allow other members of songuess group to deploy.
chgrp songuess /srv/songuess/* -R
chmod g+w /srv/songuess/* -R

rm $root/server/config.override.js
if [ -f $root/server/config.override.js.backup ]; then
  mv $root/server/config.override.js.backup $root/server/config.override.js
fi
rm -f $root/server/index.min.html

echo "that's it! hope everything was npm installed."
echo "don't forget to:"
echo "sudo /etc/init.d/songuess stop"
echo "sudo /etc/init.d/songuess start"
