function Chat(sock, user, onFatal) {

  var that = this;
  var messageCallbacks = {}, commandCallbacks = {};
  var ui = null, queue = [];
  var clients = {}, ids = [];

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
      send("say", {
        from : user.id,
        to   : null,
        when : myClock.clock(),
        what : text
      });
    }
  };

  function send(type, data) {
    sock.send(JSON.stringify({type:type, data:data}));
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

  sock.onclose = function (e) {
    if (e.reason) {
      onFatal("server closed connection: " + e.reason);
    } else {
      onFatal("server closed connection with no reason.");
    }
  };

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
  };

  function resolveQueue() {
    var it;
    for (it = 0; it < queue.length; ++it)
      messageCallbacks[queue[it].type](queue[it].data);
  }

  function onCommand(cmd, callback) {
    commandCallbacks[cmd] = callback;
  }

  function onMessage(type, callback) {
    messageCallbacks[type] = callback;
  }

  function updateClientIds() {
    ids = [];
    for (var id in clients) {
      if (clients.hasOwnProperty(id)) {
        ids.push(id);
      }
    }
  }

  // rgh, jquery
  $(function () {
    ui = new ChatUI(that, user);
    resolveQueue();
  });

  onCommand("hello", function () {
    ui.addNotice("hello to you too.");
  });

  onMessage("say", ui.addMessage);

  onMessage("room_state", function (data) {
    clients = data;
    updateClientIds();
    ui.updateList();
  });

  onMessage("new_client", function (user) {
    clients[user.id] = user;
    updateClientIds();
    ui.userJoined(user.id);
    ui.updateList();
  });

  onMessage("old_client", function (pair) {
    ui.userLeft(pair[0], pair[1]);
    delete clients[pair[0]];
    updateClientIds();
    ui.updateList();
  });

}
