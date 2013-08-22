/*jslint indent: 2, plusplus: true*/
"use strict";

var ws = require('ws')
  , config = require('./config.js').socket
  , clock = require('./clock.js');

exports.SockWrapper = function (sock, syncRtt) {

  var that = this,
    messageCallbacks = {},
    closeCallbacks = [],
    sleepyTimeout,
    sleepyCallback,
    pingTimeout = null,
    stopwatch = new clock.Timer();

  function tickSleepy() {
    clearTimeout(sleepyTimeout);
    sleepyTimeout = setTimeout(function () {
      if (sleepyCallback) {
        sleepyCallback(config.sleepyPeriod + " seconds of inactivity");
      }
    }, config.sleepyPeriod * 1000);
  }

  // this function has some stupid constants to assure that clocks are synced
  // at all times.
  // in human: Every pingInterval seconds ping will be sent to a client. Client
  // will answer to that ping at once with his clock value.
  // Round trip time will be compared with round trip time from sync process.
  // If difference is larger than 3 seconds, client is killed.
  // If client's clock is different from projected clock time by more than 0.5
  // seconds and by synced round trip by 50%, client is killed.
  // client will never be killed for a few milliseconds skew, but few seconds
  // can have a impact in game.
  function ping() {
    if (pingTimeout !== null) {
      if (sleepyCallback) {
        return sleepyCallback("server thinks that client is gone.");
      }
    }
    that.sendType('non-patient-firewall', null, stopwatch.reset);
    pingTimeout = setTimeout(ping, config.pingInterval * 1000);
    that.onMessageType('non-patient-firewall', function (data) {
      var clockDifference, rtt = stopwatch.get();
      pingTimeout = null;
      clockDifference = (clock.clock() - syncRtt / 2) - data.when;
      if (Math.abs(rtt - syncRtt) > 3000) {
        if (sleepyCallback) {
          sleepyCallback("network interupted");
        }
      }
      if (clockDifference > 500 && clockDifference > 1.5 * syncRtt) {
        if (sleepyCallback) {
          sleepyCallback("clocks went off, or connection to slow (ping)");
        }
      }
    });
  }

  this.onMessageType = function (type, callback) {
    messageCallbacks[type] = callback;
  };

  this.onSleepy = function (callback) {
    sleepyCallback = callback;
  };

  this.onClose = function (callback) {
    closeCallbacks.push(callback);
  };

  this.removeListeners = function () {
    messageCallbacks = {};
    closeCallbacks = [];
  };

  this.sendError = function (error, code, done) {
    try {
      sock.send(JSON.stringify(
        { error: error, code : code }
      ), done);
    } catch (err) {
      setTimeout(function () {
        done(null, err);
      }, 0);
    }
  };

  this.sendType = function (type, data, done) {
    try {
      sock.send(
        JSON.stringify({type: type, data: data}),
        done
      );
    } catch (err) {
      setTimeout(function () {
        done(null, err);
      }, 0);
    }
  };

  this.close = function (reason) {
    sock.close(1000, reason.substr(0, 100));
  };

  sock.onmessage = function (message) {
    var type, data;
    try {
      data = JSON.parse(message.data);
    } catch (err) {
      that.close("recieved message is not json.");
    }
    if (type !== 'non-patient-firewall') {
      tickSleepy();
    }
    for (type in messageCallbacks) {
      if (messageCallbacks.hasOwnProperty(type)) {
        if (type === data.type) {
          messageCallbacks[type](data.data);
        }
      }
    }
  };

  sock.onclose = function () {
    var it;
    for (it = 0; it < closeCallbacks.length; ++it) {
      closeCallbacks[it]();
    }
    clearTimeout(sleepyTimeout);
  };

  (function() {
    tickSleepy();
    setTimeout(ping, config.pingInterval * 1000);
  }());

};
