#!/bin/bash
JITSU=../deploy/node_modules/jitsu/bin/jitsu

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
  mv $root/server/config.override.js $root/server/config.override.js.backup
fi
cp $root/deploy/jitsu.config.js $root/server/config.override.js
( cd $root/server && $JITSU deploy --confirm )
rm $root/server/config.override.js
if [ -f $root/server/config.override.js.backup ]; then
  mv $root/server/config.override.js.backup $root/server/config.override.js
fi
rm -f $root/server/index.min.html

echo "that's it!"
