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
exports.Streamer = function (media) {

  // all clocks here are in milliseconds
  var
    chunkDuration = config.chunkDuration * 1000,
    sendAhead = config.sendAhead * 1000,
    checkInterval = config.checkInterval * 1000,
    overlapTime = config.overlapTime * 1000,
    chunkToSendPlayTime,
    currentChunkIndex,
    server,
    chunkURLs,
    timer = undefined;

  // scheduling technique from
  // http://chimera.labs.oreilly.com/books/1234000001552/ch02.html
  // 
  function checkSchedule() {
    if (chunkToSendPlayTime < clock.clock() + sendAhead) {
      sendHandler({
        url   : config.chunkHostUrl + "tg." + chunkToSend + ".mp3",
        start : chunkToSendPlayTime
      });
      chunkToSend = (chunkToSend + 1) % numberOfChunks;
      chunkToSendPlayTime += chunkDuration - overlapTime;
      checkSchedule();
    } else {
      setTimeout(checkSchedule, checkInterval);
    }
  }

  // start song without sending multiple chunks at once
  function play(playlistItem, done) {
    media.getChunks(playlistItem.server, playlistItem.id, function (chunks, err) {
      if (err) {
        done(null, err);
      } else {
        server = playlistItem.server;
        chunksURLs = chunks;
        currentChunkIndex = 0;
        chunkToSendPlayTime = clock.clock() + sendAhead;
        checkSchedule(); 
      }
    });
  }

  function stop() {
    if (timer) {
      clearTimeout(timer);
    }
  }
};
