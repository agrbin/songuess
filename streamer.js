/*jslint indent: 2, plusplus: true*/
"use strict";

var
  clock = require('./clock.js'),
  config = require('./config.js').streamer;

/*
 * Streamer will send stream directions to clients.
 *  sendHandler must dispatch message to all clients
 *  it will loop over fragments defined in config.
 */
exports.Streamer = function (media, chunkHandler, songEndedHandler) {

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
    console.log("streamer.play: ", playlistItem);
    media.getChunks(playlistItem.server, playlistItem.id,function (cs, err) {
      if (err) {
        done(null, err);
      } else {
        server = playlistItem.server;
        chunkURLs = cs;
        currentChunkIndex = 0;
        chunkToSendPlayTime = clock.clock() + sendAhead + chunkDuration;
        done(songStartedTime = chunkToSendPlayTime);
        checkSchedule();
      }
    });
  };

  this.stop = function () {
    if (timer) {
      clearTimeout(timer);
    }
    songStartedTime = null;
  };

};
