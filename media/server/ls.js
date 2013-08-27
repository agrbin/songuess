/*jslint indent: 2, plusplus: true */
"use strict";

module.exports = {
  app: undefined,
  pathUtils: require('./pathUtils.js'),
  init: function (app) {
    this.app = app;
  },
  canHandleMethod: function (method) {
    return method === '/ls/';
  },
  handle: function (method, params, req, res, errCallback) {
    var
      path = this.pathUtils.fixPath(params.path),
      node = this.pathUtils.nodeForPath(this.app.library.tree, path),
      result = [],
      i,
      child,
      o,
      pathPrefix = (path === '/') ? '/' : path + '/';

    if (node === undefined) {
      errCallback('path not found');
    } else {
      for (i = 0; i < node.children.length; ++i) {
        child = node.children[i];
        o = { path: pathPrefix + child.name };
        o.name = child.name;

        if (child.children) { // folder
          o.type = 'directory';
          o.count = child.filesCount;
          if (o.count === 0) {
            continue;
          }
        } else {
          o.type = 'file';
          if (!child.numberOfChunks) {
            continue;
          }
        }

        result.push(o);
      }

      res.end(JSON.stringify(result));
    }
  }
};

