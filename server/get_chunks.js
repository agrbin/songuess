/*jslint indent: 2, plusplus: true */
"use strict";

module.exports = {
  app: undefined,
  urlsTable: {},
  init: function (app) {
    this.app = app;
  },
  canHandleMethod: function (method) {
    return method === '/get_chunks/';
  },
  rndString: function () {
    return Math.random().toString(36).substring(2);
  },
  handle: function (method, params, req, res, errCallback) {
    var
      id = params.id,
      fileInfo = this.app.library.filesById[id],
      i,
      urls = [],
      rndUrl;

    if (fileInfo === undefined) {
      errCallback('invalid id');
    } else {
      if (this.urlsTable[id] === undefined) {
        for (i = 0; i < fileInfo.numberOfChunks; ++i) {
          rndUrl = this.rndString();
          this.app.chunksTable[rndUrl] = {
            inode: id,
            index: i
          };
          urls.push(rndUrl);
        }
        this.urlsTable[id] = {
          urls: urls,
          timestamp: (new Date()).getTime()
        };
      }

      res.end(JSON.stringify(this.urlsTable[id].urls));
    }
  }
};

