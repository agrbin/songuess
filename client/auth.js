/*
 * Auth will communicate with google to obtain acces token that can be
 * verified with server. location.hash will remain unchanged in process.
 * ClientID and scope can be changed in window.songuess config params.
 * This class have myClock for dependency.
 *
 * Constructor:
 * @param storage is object with interface:
 *  writeFile (file, data done)
 *  isFile (file, yes, no)
 *  readFile (file, done)
 *  killFile (file, done)
 *
 * @param onReady callback to invoke when access token is obtained.
 *  onReady (token); token is object with fields
 *    - access_token
 *    - expires_in
 *
 * @param isOAuthReturn boolean, if set to false Auth will fail if access token
 *  can't be loaded from storage. This is used when instantiating class from a
 *  location that is not registered in google apis.
 *
 * @onError
 *  will be invoked with error text message is something goes south.
 *
 *
 * Methods:
 * @method kill(done)
 *  will kill the token from storage and invoke done afterwards.
 *
 * @method verifyToken(ws, done)
 *  will send token over WebSocket and receive user data extracted from that
 *  token. Standard done convention is used: done(result, err);
 */
function Auth(storage, onReady, isOAuthReturn, onError) {

  var that = this,
    oAuthParams = {
      response_type : 'token',
      client_id     : window.songuess.authClientID,
      redirect_uri  : document.URL.replace(/#.*/, ''),
      scope         : window.songuess.authScope.join(" "),
      state         : location.hash || ""
    },
    COOKIE_FILE_NAME = "cookie",
    token;

  function log(msg) {
    console.log(msg);
  }

  function initialize() {
    storage.isFile(
      COOKIE_FILE_NAME,
      cookieFileExists,
      initiateHandshake
    );
  }

  // if cookie file exists, check whether it's valid.
  function cookieFileExists() {
    log("cookie file exists.");
    storage.readFile(COOKIE_FILE_NAME, function(filedata) {
      var data;
      function bailOut() {
        log("cookie file is not valid.");
        storage.killFile(COOKIE_FILE_NAME, initiateHandshake);
      }
      try {data = JSON.parse(filedata);}
      catch (e) {return bailOut();}
      if (!data) return bailOut();
      if (!('expires' in data)) return bailOut();
      if (data.expires < myClock.originalClock()) return bailOut();
      token = data;
      haveToken();
    });
  }

  function haveToken() {
    log("token obtained.");
    onReady(token);
  };

  // checks if this is redirected page already
  function checkFragment() {
    var params = {}, queryString = location.hash.substring(1),
        regex = /([^&=]+)=([^&]*)/g, m;
    while (m = regex.exec(queryString)) {
      params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    if ('access_token' in params) {
      params.expires = myClock.clock() + params.expires_in * 1000;
      token = params;
      location.hash = token.state || "";
      delete token.state;
      storage.writeFile(COOKIE_FILE_NAME, JSON.stringify(token), haveToken);
      log("fragment exists.");
      return true;
    }
  }

  // redirects to oauth endpoint.
  function initiateHandshake() {
    if (!isOAuthReturn) {
      onError("initiating handshake from isOAuthReturn =="
              + " false location will fail with endpoint"
              + " not registered error.");
      return;
    }
    if (!checkFragment()) {
      log("redirecting to oauth endpoint");
      var url = "https://accounts.google.com/o/oauth2/auth?",
        fragments = [], field;
      for (field in oAuthParams)
        fragments.push(field + '=' + escape(oAuthParams[field]));
      document.location = url + fragments.join("&");
    }
  }

  this.kill = function(done) {
    storage.killFile(COOKIE_FILE_NAME, done);
  };

  this.verifyToken = function(ws, onVerified) {
    ws.onmessage = function(msg) {
      ws.onclose = null;
      onVerified(JSON.parse(msg.data));
    };
    ws.onclose = function(e) {
      that.kill();
      onError("server couldn't verify token: " + e.reason);
    };
    ws.send(JSON.stringify(token));
  };

  initialize();

}

