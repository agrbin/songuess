/*jslint indent: 2, plusplus: true*/
"use strict";

var ws = require('ws');

exports.SockWrapper = function (sock) {

  var that = this,
    messageCallbacks = {},
    closeCallbacks = [],
    sleepyTimeout,
    sleepyCallback;

  function tickSleepy() {
    clearTimeout(sleepyTimeout);
    sleepyTimeout = setTimeout(function () {
      if (sleepyCallback) {
        sleepyCallback();
      }
    }, 30 * 60 * 1000);
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
    tickSleepy();
    try {
      data = JSON.parse(message.data);
    } catch (err) {
      that.close("recieved message is not json.");
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

  tickSleepy();

};
