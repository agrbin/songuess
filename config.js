/*jslint indent: 2, plusplus: true*/
"use strict";

var currentEnv = process.env.NODE_ENV || 'developement';

exports.server = {
  port  : 8080
};

// server and client have synced clocks. if chunk is to be played less than
// sendAhead seconds in the future, dispatch process for that chunk will begin.
// every setTimeout-ed 0.5 seconds streamer will check above condition.
//
// overlapTime
//  is overlapping between chunks to make seamless playback on
//  client. this constant is copied to ../client/player.js
//
// chunkDuration
//  is chunk duration! it is copied to lib/frames.cpp
//
exports.streamer = {
  sendAhead     : 4,
  checkInterval : 0.5,
  chunkDuration : 2.448,
  overlapTime   : 0.048,
  chunkHostUrl  : "frags/",
  numberOfChunks: 150
};

// synchronization params.
exports.sync = {
  NumberOfSamples : 10,
  MaxClockDeviation : 10
};

exports.media = {
  "media1" : {
    endpoint  : "http://localhost:8081",
    desc      : "grbinov media server"
  },
  "media2" : {
    endpoint  : "http://localhost:8081",
    desc      : "grbinov klon media server"
  }
};
