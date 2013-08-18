// auth napravi svoje
// uzme socket i provjeri sebe
// onda dodje sync i synca sat :) pazi expires!

function initiateEverything(onReady, isOAuthReturn) {
  var storage, auth, socket, user;

  function fatalError(err) {
    document.open();
    document.write("<h2>this is why we don't have nice things.</h2>"
                    + "<p>" + err + "</p>");
    document.write("<!--");
    document.close();
    console.log(err);
  }

  function initialize() {
    if (!window.hasOwnProperty("songuess")) {
      return fatalError("config.js is missing");
    }
    storage = new songuess.cookie_storage(fatalError);
    auth = new Auth(storage, onAuthReady, isOAuthReturn, fatalError);
  }

  function onSynced() {
    debug("synced.");
    try {
      // this will start the app.
      onReady(socket, user, fatalError);
    } catch (err) {
      fatalError(err);
      throw err;
    }
  }

  function onVerified(verified_user) {
    debug("user verified.");    
    user = verified_user;
    new Syncer(socket, onSynced);
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
  }

  initialize();

}

// for debug.
function logout() {
  (new Storage()).killFile("cookie");
}

function debug() {
  console.log(arguments);
}

