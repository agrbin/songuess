#!/bin/sh

if [ ! -d "$SONGUESS_MEDIA_DIR" ]; then
  echo set SONGUESS_MEDIA_DIR prior to calling this script
  exit 1
fi

APP=utils/rescan_library.js
NODE=/usr/local/bin/node
LOG=$SONGUESS_MEDIA_DIR/rescan_library.log

if ps -ef | grep -v grep | grep $APP > /dev/null; then
        exit 0
else
        $NODE $SONGUESS_MEDIA_DIR/$APP >> $LOG
        exit 0
fi
