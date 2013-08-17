/*jslint indent: 2, plusplus: true */
"use strict";

module.exports = {
  app: undefined,
  fs: require('fs'),
  init: function (app) {
    this.app = app;
  },
  canHandleMethod: function (method) {
    return method.substring(0, 7) === '/chunk/';
  },
  handle: function (method, params, req, res, errCallback) {
    var
      chunkInfo = this.app.chunksTable[method.substring(7)],
      path;

    if (chunkInfo === undefined) {
      errCallback('chunk not found');
    } else {
      path = '../chunks/' + chunkInfo.inode + '/' + chunkInfo.index + '.mp3';
      this.fs.readFile(path, function (err, data) {
        if (err) {
          errCallback('unexpected error, chunk file not found');
        } else {
          res.setHeader('Content-Type', 'text/plain'); // TODO:
          res.setHeader('Cache-Control', 'max-age=3600'); // 1 hour
          res.setHeader('Access-Control-Allow-Origin', '*'); // TODO:
          res.end(data);
        }
      });
    }
  }
};

