var ws = require('ws');

exports.SockWrapper = function (sock) {

  var that = this,
    messageCallbacks = {},
    closeCallbacks = [];

  this.onMessageType = function (type, callback) {
    if (messageCallbacks.hasOwnProperty(type)) {
      throw "type '"+type+"' already registered";
    }
    messageCallbacks[type] = callback;
  };

  this.onClose = function (callback) {
    closeCallbacks.push(callback);
  };

  this.removeListeners = function() {
    messageCallbacks = {};
    closeCallbacks = [];
  };

  this.sendType = function (type, data, done) {
    sock.send(
      JSON.stringify({type: type, data: data}),
      done
    );
  };

  this.close = function (reason) {
    console.log("closing ws: " + reason);
    sock.close(1000, reason);
  };

  sock.onmessage = function (message) {
    var type, data;
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
    for (it = 0; it < closeCallbacks.length; ++it)
      closeCallbacks[it]();
  };

};
