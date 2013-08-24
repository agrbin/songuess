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
    storage = new window[songuess.cookieStorage](fatalError);
    auth = new Auth(storage, onAuthReady, isOAuthReturn, fatalError);
  }

  function onSynced() {
    console.log("synced.");
    try {
      // this will start the app.
      onReady(socket, user, fatalError);
    } catch (err) {
      fatalError(err);
      throw err;
    }
  }

  function onVerified(verified_user) {
    console.log("user verified.");    
    user = verified_user;
    new Syncer(socket, onSynced);
  }

  function onAuthReady(token) {
    var timer;
    if (!window.hasOwnProperty("songuess")) {
      return fatalError("config.js not available.");
    }
    socket = new WebSocket(songuess.masterServer);
    socket.onopen = function() {
      clearTimeout(timer);
      auth.verifyToken(socket, onVerified);
    }
    timer = setTimeout(function() {
      if (socket.readyState != WebSocket.OPEN)
        fatalError("master server at " + songuess.masterServer
                   + " not responding.");
      socket.onopen = null;
    }, 3000);
  }

  initialize();
}

window.initiateEverything(function (sock, user, onErr) {
  $(document).ready(function() {
    var ws = new SockWrapper(sock, onErr);
    new Chat(ws, user, new Media(ws), onErr);
  });
}, true);

