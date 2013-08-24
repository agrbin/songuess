/*jslint indent: 2, plusplus: true */
"use strict";

module.exports = {
  app: undefined,
  pathUtils: require('./pathUtils.js'),
  init: function (app) {
    this.app = app;
  },
  canHandleMethod: function (method) {
    return method === '/expand/';
  },
  handle: function (method, params, req, res, errCallback) {
    var that = this;

    req.content = '';
    req.addListener('data', function (data) {
      req.content += data;
    });
    req.addListener('end', function () {
      var
        arr = JSON.parse(req.content.toString()),
        i,
        item,
        result = [];

      function expandNode(node) {
        var i;
        if (node.children) {
          for (i = 0; i < node.children.length; ++i) {
            expandNode(node.children[i]);
          }
        } else {
          result.push({
            artist: node.artist,
            album: node.album,
            title: node.title,
            duration: node.duration,
            id: node.inode
          });
        }
      }

      for (i = 0; i < arr.length; ++i) {
        item = that.pathUtils.nodeForPath(that.app.library.tree, arr[i].path);
        if (item) {
          expandNode(item);
        }
      }

      res.end(JSON.stringify(result));
    });
  }
};

