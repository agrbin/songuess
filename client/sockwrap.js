function SockWrapper(sock, onFatal) {

  var that = this,
    messageCallbacks = {},
    closeCallbacks = [],
    errorCallbacks = {},
    rawDataCallback = null;

  this.onClose = function (callback) {
    closeCallbacks.push(callback);
  };

  this.onMessage = function (type, callback) {
    messageCallbacks[type] = callback;
  };

  this.onRawData = function (callback) {
    rawDataCallback = callback;
  };

  this.onError = function (code, callback) {
    errorCallbacks[code] = callback;
  };

  this.sendType = function (type, data) {
    sock.send(JSON.stringify({
      type : type, data : data
    }));
  };

  sock.onclose = function (e) {
    var it;
    for (it = 0; it < closeCallbacks.length; ++it) {
      closeCallbacks[it](e);
    }
  };

  sock.onmessage = function (event) {
    // Audio chunk for host room mode is the only binary message we get.
    // Everything else should be JSON.
    if (event.data instanceof Blob) {
      if (rawDataCallback) {
        rawDataCallback(event.data);
      }
      return;
    }

    var data;
    try {
      data = JSON.parse(event.data);
    } catch (err) {
      return onFatal("received message is not json");
    }
    if (data.hasOwnProperty("error")) {
      var code = data.code;
      if (code === undefined || errorCallbacks[code] === undefined) {
        return onFatal(data.error);
      }
      return errorCallbacks[code](data.error);
    }
    if (data.type === 'non-patient-firewall') {
      return that.sendType('non-patient-firewall', {when: myClock.clock()});
    }
    if (!messageCallbacks.hasOwnProperty(data.type)) {
      return console.log(
        "type '" + data.type + "' not registered.", data.data
      );
    }
    messageCallbacks[data.type](data.data);
  };

};
