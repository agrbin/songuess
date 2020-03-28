// auth napravi svoje
// uzme socket i provjeri sebe
// onda dodje sync i synca sat :) pazi expires!

function initiateEverything(onReady, isOAuthReturn) {
  var storage, auth, socket, user, player;

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
    if ('Notification' in window) {
      document.addEventListener('keyup', function requestNotifPermission(e){
        document.removeEventListener('keyup', requestNotifPermission);
        Notification.requestPermission(function (permission) {
          if(!('permission' in Notification)) {
            // Chrome does not implement Notification.permission yet
            Notification.permission = permission;
          }
        });
      });
    }
  }

  function onSynced() {
    console.log("synced.");
    $(".warm_up_message").text('Network ready! Press any key to continue...');

    function warmUpAudio(e) {
      document.removeEventListener('keydown', warmUpAudio);
      document.removeEventListener('touchstart', warmUpAudio);
      document.removeEventListener('mousedown', warmUpAudio);

      e.preventDefault();
      player = new Player(myClock.clock, null, fatalError);
      try {
        onReady(socket, user, player, fatalError);
      } catch (err) {
        fatalError(err);
        throw err;
      }
    };

    document.addEventListener('keydown', warmUpAudio);
    document.addEventListener('touchstart', warmUpAudio);
    document.addEventListener('mousedown', warmUpAudio);
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
    };
    timer = setTimeout(function() {
      if (socket.readyState != WebSocket.OPEN)
        fatalError("master server at " + songuess.masterServer
                   + " not responding.");
      socket.onopen = null;
    }, 10000);
  }

  initialize();
}

window.initiateEverything(function (sock, user, player, onErr) {
  $(document).ready(function() {
    var ws = new SockWrapper(sock, onErr);
    new Chat(ws, user, new Media(ws), player, onErr);
  });
}, true);

