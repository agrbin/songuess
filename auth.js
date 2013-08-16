/*jslint indent: 2, plusplus: true*/
"use strict";

var request = require('request'),
  verifyURL = 'https://www.googleapis.com/oauth2/v1/tokeninfo',
  profileURL = 'https://www.googleapis.com/oauth2/v1/userinfo',
  expectedScope = 'https://www.googleapis.com/auth/userinfo.profile '
                  + 'https://www.googleapis.com/auth/userinfo.email';

var SPPED_UP = {
  id: '1010457635607266359490',
  email: 'anton.grbin@gmail.com',
  name: 'Anton',
  display: 'Anton Grbin',
  gender: 'male',
  picture: 'https://lh5.googleusercontent.com/-yb6aeubr2t0/AAAAAAAAAAI/AAAAAAAAFq0/dsJHPmBLFJA/photo.jpg'
};

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

exports.verifyToken = function (tokenMessage, done) {
  var sol = JSON.parse(JSON.stringify(SPPED_UP));
  sol.id += Math.random().toString();
  done(sol);
};

exports.verifyTokenReal = function (tokenMessage, done) {
  var token, url;
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
      if (data.scope !== expectedScope) {
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

