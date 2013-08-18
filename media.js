function Media(wsock, user, onFatal) {

  var that = this,
    ui = new MediaUI(this),
    nextCallback = null;

  function initialize() {
    that.handleTextQuery("ls");
  }

  wsock.onMessage("media", function (data) {
    if (nextCallback) {
      nextCallback(data);
    }
  });

  this.query = function (query, answerCallback) {
    wsock.sendType("media", query);
    nextCallback = answerCallback;
  };

  this.newRoom = function (name, onFinish) {
    ui.takeOver();
    this.handleTextQuery("ls media1:///");
  };

  this.handleTextQuery = function (text) {
    ui.setInput(text);
    var args = text.split(" ");
    if (args[0] === "ls") {
      var apath = this.pathToArray(args[1] || '');
      return this.query(
        {type : "ls", apath : apath},
        function (data) {
          ui.populateLeft(data, apath);
        }
      );
    }
    onFatal("unknown query " + text);
  };

  this.pathToArray = function (text) {
    var tmp1;
    if (!text.length) {
      return [];
    }
    try {
      tmp1 = text.split("://");
      return [tmp1[0]].concat(tmp1[1].split("/").filter(
        function (x) {return !!x.length;})
      );
    } catch (err) {
      onFatal(err);
    }
  };

  this.arrayToPath = function (apath) {
    if (apath.length) {
      return apath[0] + ":///" + apath.slice(1).join("/");
    } else {
      return "";
    }
  };

  wsock.onClose(function (e) {
    if (e.reason) {
      onFatal("server closed connection: " + e.reason);
    } else {
      onFatal("server closed connection with no reason.");
    }
  });

  initialize();

}
