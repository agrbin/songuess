/*
 * killFile = function(file, done);
 * isFile = function(file, yes, no);
 * writeFile = function(file, data, done);
 *
 * readFile = function(file, done);
 */
function Auth(storage, onError) {

  var that = this;
  var COOKIE_FILE_NAME = "cookie";
  var token = null, haveToken, verifyToken;
  var oAuthParams = {
    response_type : 'token',
    client_id     : '156401229517.apps.googleusercontent.com',
    redirect_uri  : 'http://localhost/p/index.html',
    scope : 
      'https://www.googleapis.com/auth/userinfo.email' +
      ' https://www.googleapis.com/auth/userinfo.profile',
    state : location.hash || "#"
  };

  this.kill = function(done) {
    storage.killFile(COOKIE_FILE_NAME, done);
  };

  this.onReady = function(token) {}
  this.onVerified = function(user) {}

  haveToken = function() {
    debug("imam token");
    that.onReady(token);
  };

  this.verifyToken = function(ws) {
    ws.onmessage = function(msg) {
      ws.onclose = null;
      that.onVerified(JSON.parse(msg.data));
    };
    ws.onclose = function(e) {
      that.kill();
      onError("server couldn't verify token: " + e.reason);
    };
    ws.send(JSON.stringify(token));
  };

  storage.isFile(COOKIE_FILE_NAME,
    function() {
      debug("cookie file postoji.");
      storage.readFile(COOKIE_FILE_NAME, function(filedata) {
        var data;
        function bailOut() {
          debug("cookie file nije valjan.");
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
    },
    initiateHandshake
  );

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
      debug("fragment postoji");
      return true;
    }
  }

  function initiateHandshake() {
    if (!checkFragment()) {
      debug("redirectam se na oauth");
      // redirects to google oauth endpoint
      var url = "https://accounts.google.com/o/oauth2/auth?";
      var fragments = [];
      for (var field in oAuthParams)
        fragments.push(field + '=' + escape(oAuthParams[field]));
      document.location = url + fragments.join("&");
    }
  }

}

