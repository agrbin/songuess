// auth napravi svoje
// uzme socket i provjeri sebe
// onda dodje sync i synca sat :) pazi expires!

function initiateEverything(onReady, isOAuthReturn) {
  var storage, auth, socket, user;

  function initialize() {
    try {
      storage = new Storage(fatalError);
    } catch (err) {
      console.log("storage not available: " + err);
      storage = new DummyStorage(fatalError);
    }

    auth = new Auth(storage, onAuthReady, isOAuthReturn, fatalError);
  }

  function fatalError(err) {
    document.write("<h1>this is why we don't have nice things.</h1>"
                    + "<p>" + err + "</p>");
    console.log(err);
  }

  function onVerified(verified_user) {
    debug("user verified.");    
    user = verified_user;
    new Syncer(socket, onSynced);
  }

  function onSynced() {
    debug("synced.");
    onReady(socket, user, fatalError);
  }

  function onAuthReady(token) {
    var timer;
    if (!window.hasOwnProperty("songuess")) {
      return fatalError("config.js not available.");
    }
    socket = new WebSocket(songuess.master_server);
    socket.onopen = function() {
      clearTimeout(timer);
      auth.verifyToken(socket, onVerified);
    }
    timer = setTimeout(function() {
      if (socket.readyState != WebSocket.OPEN)
        fatalError("master server at " + songuess.master_server
                   + " not responding.");
      socket.onopen = null;
    }, 3000);
  };

  initialize();

};

// for debug.
function logout() {
  (new Storage()).killFile("cookie");
}

function debug() {
  console.log("auth", arguments);
}

