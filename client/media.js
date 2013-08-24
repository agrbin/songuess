function Media(wsock, onFatal) {

  var that = this,
    ui = new MediaUI(this),
    nextCallback = null,
    playlist,
    onFinish;

  function initialize() {
    that.handleTextQuery("ls");
  }

  wsock.onMessage("media", function (data) {
    if (nextCallback) {
      nextCallback(data);
    }
  });

  function packPlaylist() {
    var url, sol = [];
    for (url in playlist) {
      if (playlist.hasOwnProperty(url)) {
        sol.push(playlist[url].apath);
      }
    }
    return sol;
  }

  this.newRoomDialog = function (name, pOnFinish) {
    onFinish = pOnFinish;
    playlist = {};
    ui.updatePlaylist(playlist);
    ui.showDialog(name);
  };

  this.handleNewRoom = function (room) {
    wsock.sendType("create_room", {
      room : room,
      playlist : packPlaylist()
    });
    wsock.onMessage("create_room", function (data) {
      if (data === true) {
        ui.hideDialog();
        onFinish(room.name);
      } else {
        onFatal("unknown error while creating room.");
      }
    });
  };

  this.query = function (query, answerCallback) {
    wsock.sendType("media", query);
    nextCallback = answerCallback;
  };

  this.removeFromPlaylist = function (url) {
    delete playlist[url];
    ui.updatePlaylist(playlist);
  };

  this.addToPlaylist = function (one) {
    var it, prefix;
    for (it = 0; it < one.apath.length; ++it) {
      var prefix = this.apathToUrl(one.apath.slice(0, it));
      // we already have your parent.
      if (playlist[prefix] !== undefined) {
        return;
      }
    }
    playlist[one.url] = one;
    ui.updatePlaylist(playlist);
  };

  this.handleTextQuery = function (text) {
    ui.setInput(text);
    var args = text.split(" ");
    var params = args.slice(1).join(" ");
    if (args[0] === "ls") {
      var apath = this.urlToApath(params);
      return this.query(
        {type : "ls", apath : apath},
        function (data) {
          ui.populateLeft(data, apath);
        }
      );
    }
    onFatal("unknown query " + text);
  };

  this.urlToApath = function (text) {
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

  this.apathToUrl = function (apath) {
    if (apath.length) {
      return apath[0] + ":///" + apath.slice(1).join("/");
    } else {
      return "";
    }
  };

  initialize();

}
