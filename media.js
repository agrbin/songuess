function Media(sock, user, err) {

  var that = this,
    ui = new MediaUI(this),
    nextCallback = null;

  sock.onmessage = function (message) {
    var data = JSON.parse(message.data);
    if (!(data.type in messageCallbacks)) {
      return console.log(
        "type '" + data.type + "' not registered.", data.data
      );
    }
    if (!ui) {
      return queue.push(data);
    }
    messageCallbacks[data.type](data.data);
    var data = JSON.parse(message.data);
    that.onMediaMessage(data);
  };

  function onMessage(type, callback) {
    messageCallbacks[type] = callback;
  }

  this.newRoom = function (name, onFinish) {
    ui.takeOver();
    this.handleTextQuery("ls media1:///");
  };

  this.onMediaMessage = function (data) {
    if (nextCallback) {
      nextCallback(data);
    }
  };

  this.query = function (query, answerCallback) {
    sendMedia(query);
    nextCallback = answerCallback;
  };

  function handleQuery(first) {
    var args = Array.prototype.slice.call(arguments, 0);
    args = args.filter(function (x) {
      return !!x.length;
    });
    if (first === "ls") {
      that.query(args, onLsReturn);
    }
  };

  this.handleTextQuery = function (text) {
    console.log(text);
    ui.setInput(text);
    var args = text.split(" ");
    if (args[0] === "ls") {
      handleQuery(args[0], args.slice(1).join(" "));
    } else {
      handleQuery(args);
    }
  };

  function onLsReturn(data) {
    ui.populateLeft(data);
  }
}
