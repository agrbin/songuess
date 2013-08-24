/*jslint indent: 2, plusplus: true*/
"use strict";

var request = require('request'),
  config = require('./config.js').auth,
  verifyURL = config.verifyURL,
  profileURL = config.profileURL,
  expectedScope = config.scope,
  clientID = config.clientID;

function tryDecode(json, done, errmsg) {
  var data;
  try {
    data = JSON.parse(json);
  } catch (err) {
    done(null, errmsg);
    return undefined;
  }
  return data;
}

function checkScope(scope) {
  var arr = scope.split(" "), it;
  arr.sort();
  expectedScope.sort();
  if (arr.length !== expectedScope.length) {
    return false;
  }
  for (it = 0; it < arr.length; ++it) {
    if (arr[it] !== expectedScope[it]) {
      return false;
    }
  }
  return true;
}

function fetchProfile(token, done) {
  var url = profileURL + "?access_token=" + token;
  request(url, function (e, response, body) {
    var user;
    if (!e && response.statusCode === 200) {
      user = tryDecode(body, done, "profile response body is not JSON");
      if (user !== undefined) {
        done({
          id: user.id + Math.random().toString(),
          email: user.email,
          name: user.given_name,
          display: user.name,
          gender: user.gender,
          picture: user.picture
        });
      }
    } else {
      return done(null, "error while fetching profile");
    }
  });
}

// simple class that can:
//  ::issueToken(email) -> returns hash
//  ::checkToken(hash) -> returns email issued to.
exports.MediaAuthenticator = (function () {
  var tokens = {};
  function rndString() {
    return Math.random().toString(36).substring(2)
     + Math.random().toString(36).substring(2);
  }
  return (function () {
    var that = this;
    this.issueToken = function (email) {
      var sol = rndString();
      if (!tokens.hasOwnProperty(email)) {
        tokens[email] = {};
      }
      tokens[email][sol] = 1;
      return sol;
    };
    this.checkToken = function (token) {
      for (var email in tokens) {
        if (tokens.hasOwnProperty(email)) {
          if (tokens[email].hasOwnProperty(token)) {
            return email;
          }
        }
      }
      return null;
    };
  });
}());

exports.verifyToken = function (tokenMessage, done) {
  var token, url, user;

  if (config.bypassVerification !== undefined) {
    user = JSON.parse(JSON.stringify(config.bypassVerification));
    user.id += Math.random().toString();
    return done(user);
  }

  token = tryDecode(tokenMessage.data, done, "token is not json");
  if (token === undefined) {
    return;
  }

  url = verifyURL + "?access_token=" + token.access_token;

  request(url, function (e, response, body) {
    if (!e && response.statusCode === 200) {
      var data;
      data = tryDecode(body, done, "profile response body is not json");
      if (data.hasOwnProperty('error')) {
        return done(null, "google: " + data.error);
      }
      if (!data.hasOwnProperty('verified_email') ||
          !data.hasOwnProperty('scope')) {
        return done(null, "google: verify response not formatted as ecpected");
      }
      if (!data.verified_email) {
        return done(null, "google: mail not verified");
      }
      if (data.audience !== clientID) {
        return done(null, "token is not for this app.");
      }
      if (!checkScope(data.scope)) {
        return done(null, "token scope is not as expected.");
      }
      return fetchProfile(token.access_token, done);
    }
    if (e) {
      return done(null,
        "error while making request: " + e.toString());
    }
    return done(null,
      "status code not 200 while making request: "
      + response.statusCode);
  });
};
