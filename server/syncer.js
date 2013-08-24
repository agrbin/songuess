/*jslint indent: 2, plusplus: true*/
"use strict";

var clock = require("./clock.js"),
  analyze = require("./statistics.js").analyze,
  config = require("./config.js").sync;

/*
 * Syncer is responsible for clock synchronization between clients. 
 * Client will initiate synchronization by sending message with string "-1".
 * Syncer will numberOfSamples times answer to the client with empty message,
 * and client will answer with his local time.
 *
 * Client's time offset is callculated in NTP fashion. Symmetric communication
 * is assumed, and with that message travel time from client to server is half
 * of the round trip time. All offsets are then averaged and deviation is
 * gathered to decide wether sync is good enough or not.
 */
exports.Syncer = function (ws, done) {

  var offsets = [],
    stopwatch = new clock.Timer(),
    avg_ping = 0;

  ws.onmessage = function (msg) {
    var clientTime = Number(msg.data);
    if (clientTime !== -1) {
      avg_ping += stopwatch.get();
      offsets.push(
        (clock.clock() - stopwatch.get() / 2) - clientTime
      );
      if (offsets.length === config.numberOfSamples) {
        return process();
      }
    }
    ws.send('', stopwatch.reset);
  };

  function process() {
    var summary = analyze(offsets), ping;
    ping = avg_ping / config.numberOfSamples;
    if (ping < config.maxPing && summary.std < config.maxClockDeviation) {
      ws.send(summary.avg.toString(), function () {
        done(ping);
      });
    } else {
      console.log("skew std too large: ", summary);
      offsets = [];
      avg_ping = 0;
      ws.send('', stopwatch.reset);
    }
  }

};

