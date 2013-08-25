#!/bin/bash

set -e

root=$(dirname $0)/..

echo "pulling changes.. watch out for /server/config.js changes!!";
# git pull

echo "minifying client..";

( cd $root/client && node ../deploy/minify.js )

mv $root/client/index.min.html $root/server/

# jitsu.config.js -> ../server/config.override.js
# jitsu deploy
# restore ../server/config.override.js
echo "deploying to nodejitsu..";
if [ -f $root/server/config.override.js ]; then
  echo "postoji.";
  mv $root/server/config.override.js $root/server/config.override.js.backup
fi
cp $root/deploy/jitsu.config.js $root/server/config.override.js
( cd $root/server && jitsu deploy --confirm )
rm $root/server/config.override.js
if [ -f $root/server/config.override.js.backup ]; then
  echo "postoji.";
  mv $root/server/config.override.js.backup $root/server/config.override.js
fi
rm -f $root/server/index.min.html

echo "that's it!"
