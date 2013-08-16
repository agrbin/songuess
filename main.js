// auth napravi svoje
// uzme socket i provjeri sebe
// onda dodje sync i synca sat :) pazi expires!
(function() {
  var storage = new Storage(fatalError);
  var auth = new Auth(storage, fatalError);
  var socket, user;

  function fatalError(err) {
    document.write("<h1>this is why we don't have nice things.</h1>"
                    + "<p>" + err + "</p>");
    console.log(err);
  }

  auth.onReady = function(token) {
    var timer;
    if (!window.hasOwnProperty("songuess")) {
      return fatalError("config.js not available.");
    }
    socket = new WebSocket(songuess.master_server);
    socket.onopen = function() {
      clearTimeout(timer);
      auth.verifyToken(socket);
    }
    timer = setTimeout(function() {
      if (socket.readyState != WebSocket.OPEN)
        fatalError("master server at " + songuess.master_server
                   + " not responding.");
      socket.onopen = null;
    }, 3000);
  };

  auth.onVerified = function(verified_user) {
    debug("user verified.");    
    user = verified_user;
    new Syncer(socket, onSynced);
  };

  function onSynced() {
    debug("synced.");
    new Chat(socket, user, fatalError);
  };

})();

// for debug.
function logout() {
  (new Storage()).killFile("cookie");
}

function debug() {
  console.log("auth", arguments);
}

