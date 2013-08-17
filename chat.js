function Chat(wsock, user, onFatal) {

  var that = this,
    commandCallbacks = {},
    ui = new ChatUI(this, user),
    clients = {}, ids = [];

  // checks whether the sending message is maybe
  // a command to chat itself
  function checkCommand(text) {
    var params, cmd;
    if (text.substr(0, 1) !== "/") {
      return false;
    }
    params = text.substr(1).split(" ");
    cmd = params.shift();
    if (!commandCallbacks.hasOwnProperty(cmd)) {
      ui.addNotice("command '" + cmd + "' unavailable.");
      return true;
    }
    try {
      commandCallbacks[cmd].apply(that, params);
    } catch (e) {
      ui.addNotice("error: " + e);
    }
    return true;
  }

  this.handleSend = function (text) {
    if (!checkCommand(text)) {
      wsock.sendType("say", {
        from : user.id,
        to   : null,
        when : myClock.clock(),
        what : text
      });
    }
  };

  function updateClientIds() {
    ids = [];
    for (var id in clients) {
      if (clients.hasOwnProperty(id)) {
        ids.push(id);
      }
    }
  }

  this.getNumberOfClients = function () {
    return ids.length;
  };

  // by sequential number or by id.
  this.getClient = function (id) {
    if (id >= 0 && id < ids.length) {
      return clients[ids[id]];
    }
    if (!clients.hasOwnProperty(id)) {
      console.log(
        "tried to get client not in a room."
      );
      return {};
    }
    return clients[id];
  };

  function onCommand(cmd, callback) {
    commandCallbacks[cmd] = callback;
  }

  onCommand("hello", function () {
    ui.addNotice("hello to you too.");
  });

  wsock.onMessage("say", ui.addMessage);

  wsock.onMessage("room_state", function (data) {
    clients = data;
    updateClientIds();
    ui.updateList();
  });

  wsock.onMessage("new_client", function (user) {
    clients[user.id] = user;
    updateClientIds();
    ui.userJoined(user.id);
    ui.updateList();
  });

  wsock.onMessage("old_client", function (pair) {
    ui.userLeft(pair[0], pair[1]);
    delete clients[pair[0]];
    updateClientIds();
    ui.updateList();
  });

  wsock.onClose(function (e) {
    if (e.reason) {
      onFatal("server closed connection: " + e.reason);
    } else {
      onFatal("server closed connection with no reason.");
    }
  });

}
