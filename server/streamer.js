/*jslint indent: 2, plusplus: true*/
"use strict";

var
  clock = require('./clock.js'),
  config = require('./config.js').streamer,
  STREAM_FROM_MIDDLE_RANGE_PERCENTAGE = 20;

/*
 * Streamer will send stream directions to clients.
 *  sendHandler must dispatch message to all clients
 *  it will loop over fragments defined in config.
 */
exports.Streamer = function (media, chunkHandler, songEndedHandler, streamFromMiddle) {

  // all clocks here are in milliseconds
  var that = this,
    chunkDuration = config.chunkDuration * 1000,
    sendAhead = config.sendAhead * 1000,
    checkInterval = config.checkInterval * 1000,
    overlapTime = config.overlapTime * 1000,
    chunkToSendPlayTime,
    currentChunkIndex,
    server,
    chunkURLs,
    timer,
    songStartedTime;

  console.log('streamer: stream from middle: ' + streamFromMiddle);

  // scheduling technique from
  // http://chimera.labs.oreilly.com/books/1234000001552/ch02.html
  // 
  function checkSchedule() {
    if (chunkToSendPlayTime < clock.clock() + sendAhead) {
      chunkHandler({
        url   : chunkURLs[currentChunkIndex],
        start : chunkToSendPlayTime
      });
      if (++currentChunkIndex === chunkURLs.length) {
        timer = setTimeout(
          songEndedHandler,
          (chunkToSendPlayTime + chunkDuration) - clock.clock()
        );
      } else {
        chunkToSendPlayTime += chunkDuration - overlapTime;
        checkSchedule();
      }
    } else {
      timer = setTimeout(checkSchedule, checkInterval);
    }
  }

  this.getSongStartedTime = function () {
    return songStartedTime;
  };

  // start song without sending multiple chunks at once
  this.play = function (playlistItem, done) {
    that.stop();
    media.getChunks(
      playlistItem.server,
      playlistItem.id,
      function (cs, err) {
        function calcFirstChunkIndex(len) {
          var l = (100 - STREAM_FROM_MIDDLE_RANGE_PERCENTAGE) / 2;
          if (streamFromMiddle === true) {
            return Math.floor(len * (l + Math.random() * STREAM_FROM_MIDDLE_RANGE_PERCENTAGE) / 100);
          }
          return 0;
        }

        if (err) {
          done(null, err);
        } else {
          server = playlistItem.server;
          chunkURLs = cs;
          currentChunkIndex = calcFirstChunkIndex(cs.length);
          console.log('first chunk index: ' + currentChunkIndex);
          chunkToSendPlayTime = clock.clock() + sendAhead + chunkDuration;
          done(songStartedTime = chunkToSendPlayTime);
          checkSchedule();
        }
      }
    );
  };

  this.stop = function () {
    if (timer) {
      clearTimeout(timer);
    }
    songStartedTime = null;
  };

};
