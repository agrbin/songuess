/*jslint indent: 2, plusplus: true*/
"use strict";

var config = require('./config.js').proxy,
  httpRoot = require('./config.js').server.httpRoot,
  url = require('url'),
  request = require('request');

exports.HttpProxy = function () {

  var that = this,
    resourceOnReady = {},
    resourceData = {},
    inMemory = 0;

  function log(what) {
    console.log( (new Date()).toString() + " proxy: " + what);
  }

  // this is called only when we are sure that resourceData has the id data.
  function sendData(id, req, res) {
    var data = resourceData[id][0],
      err = resourceData[id][1];

    if (err) {
      if (err.code === 'ETIMEDOUT') {
        log("504: " + id + " err: " + err);
        res.statusCode = 504;
        return res.end("Gateway timeout (media server too slow).");
      }
      if (err.code === 'ECONNREFUSED') {
        log("502: " + id + " err: " + err);
        res.statusCode = 502;
        return res.end("Bad gateway (media server refused connection).");
      }
      log("502: " + id + " err: " + err);
      res.statusCode = 502;
      return res.end("Bad gateway (media server).");
    }

    log(" HIT: " + id);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'max-age=' + config.maxAge); // 1m

    res.end(data);
  }

  // this URL starts with config.urlPrefix
  // (caller must check that)
  // function will end response with blob and 
  // valid CORS headers for javasciprt
  // hash, req, res
  //
  function fetch (id, req, res) {
    // first of all, this is fetched trough ajax:
    res.setHeader('Access-Control-Allow-Origin', '*');
    // now, possible scenarios:
    // 1. resourceData for this id can already be loaded
    if (resourceData.hasOwnProperty(id)) {
      return sendData(id, req, res);
    }
    // 2. we may see event mounting point for this id
    log("WAIT: " + id);
    if (resourceOnReady.hasOwnProperty(id)) {
      return resourceOnReady[id].push(function () {
        sendData(id, req, res); 
      });
    }
    // 3. we haven't heard for this id.
    res.statusCode = 404;
    res.end("Resource not found.");
  };

  function randomId() {
    return Math.random().toString(36).substring(2);
  }

  function fireOnReady(id) {
    for (var it = 0; it < resourceOnReady[id].length; ++it) {
      resourceOnReady[id][it]();
    }
  }

  // loads resource as buffer!
  function loadResource(url, done) {
    request(
      {
        url: url,
        timeout: config.maxDelay * 1000,
        encoding:null
      },
      function (e, response, body) {
        if (!e && response.statusCode === 200) {
          done(body);
        } else {
          done(null, e);
        }
      }
    );
  }

  // announces that someone will fetch a resource soon.
  // function receives url and returns changed url that points to
  // http://server/PREFIX/hash
  // which should be routed to function fetch(sth);
  //
  this.proxify = function (url) {
    var id;

    if (!config.enable) {
      return url;
    }
    // decide the URL of a new resource
    // create resourceReady subscribe point for this resource.
    id = randomId();
    log (" NEW: " + id);
    resourceOnReady[id] = [];

    // start loading the resource
    //  when ready: fire the resourceReady handlers for this event
    loadResource(url, function (data, err) {
      // this should evaluate to true always
      // if maxDelay < maxAge.
      if (resourceOnReady.hasOwnProperty(id)) {
        ++inMemory;
        resourceData[id] = [data, err];
        fireOnReady(id);
      }
    });

    // register purge event.
    setTimeout(function () {
      log("PURG: " + id + " size: " + inMemory);
      --inMemory;
      delete resourceOnReady[id];
      delete resourceData[id];
    }, config.maxAge * 1000);

    return httpRoot + config.urlPrefix + id;
  };

  // returns true if request was for us. in that case, response will be ended.
  // false if request should be handled afterwards.
  this.handleRequest = function (req, res) {
    var prefix = config.urlPrefix,
      method = url.parse(req.url).pathname;
    if (method.substr(0, prefix.length) === prefix) {
      return fetch(
        method.substr(prefix.length), req, res
      );
    }
    return false;
  };

};
