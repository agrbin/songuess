/*jslint indent: 2, plusplus: true*/
"use strict";

var fs = require('fs'),
  config = require('./config.js').server,
  clientConfig = "window.songuess = " +
    JSON.stringify(require('./config.js').client) + ";";

exports.Server = function () {

  // files structure
  // {
  //   request_url : {
  //    data : 
  //    filename :
  //    headers : {
  //     name : value or null (if null, don't send) 
  //    }
  //   }
  // }
  var indexHtml = null,
    cacheHeader = null,
    files = {},
    contentTypeMap = {
      js : 'application/x-javascript',
      css : 'text/css',
      html : 'text/html'
    };

  function log(what) {
    // console.log(what);
  }

  function contentType(filename) {
    return contentTypeMap[filename.match(/\.([a-z]*)$/)[1]] || null;
  }

  function addFile(url, filename, data) {
    files[url] = {
      data : data,
      filename : filename,
      headers : {
        'Content-Type' : contentType(filename),
        'Content-Length' : data.length,
        'Cache-Control' : cacheHeader
      }
    };
  }

  function readAndAdd(url, filename, done) {
    fs.readFile(filename, function (err, data) {
      if (err) {
        log("while loading " + filename + ": ", err);
      } else {
        addFile(url, filename, data);
        log(filename + " loaded.");
      }
      if (done) {
        done();
      }
    });
  }

  function serve (res, file) {
    var header;
    for (header in file.headers) {
      if (file.headers.hasOwnProperty(header)) {
        if (file.headers[header] !== null) {
          res.setHeader(header, file.headers[header]);
        }
      }
    }
    res.end(file.data);
  }

  this.handleRequest = function (req, res) {
    var file = files[req.url];
    if (req.url === "/config.js") {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/x-javascript');
      res.setHeader('Content-Length', clientConfig.length);
      res.setHeader('Cache-Control', cacheHeader);
      res.end(clientConfig);
      return;
    }
    if (file === undefined) {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.statusCode = 200;
    if (config.readFileOnRequest) {
      readAndAdd(req.url, file.filename, function () {
        serve(res, file);
      });
    } else {
      serve(res, file);
    }
  };

  (function () {
    if (config.staticMaxAge !== null && !config.readFileOnRequest) {
      cacheHeader = 'max-age=' + config.staticMaxAge;
    }
    if (config.indexHtml !== null) {
      readAndAdd("/", config.indexHtml);
    }
    if (config.htdocsDir !== null) {
      fs.readdir(config.htdocsDir, function (err, files) {
        var it;
        if (err) {
          log("while loading static dir: ", err);
        } else {
          for (it = 0; it < files.length; ++it) {
            if (files[it][0] !== '.') {
              readAndAdd("/" + files[it], config.htdocsDir + files[it]);
            }
          }
        }
      });
    }
  }());

};

