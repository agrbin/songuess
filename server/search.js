/*jslint indent: 2, plusplus: true */
"use strict";

module.exports = {
  app: undefined,
  init: function (app) {
    this.app = app;
  },
  canHandleMethod: function (method) {
    return method === '/search/';
  },
  handle: function (method, params, req, res, errCallback) {
    var
      query = (params.q || '').toLowerCase(),
      words = query.split(' '),
      wordsLength = words.length,
      tree = this.app.library.tree,
      results = [];

    function matches(str) {
      var i;
      str = str.toLowerCase();
      for (i = 0; i < wordsLength; ++i) {
        if (str.indexOf(words[i]) === -1) {
          return false;
        }
      }
      return true;
    }

    function addNodeToResults(node, path) {
      var o = { path: path };
      if (node.children) {
        o.type = 'directory';
        o.count = node.filesCount;
      } else {
        o.type = 'file';
      }
      results.push(o);
    }

    function traverse(node, currentPath) {
      var
        addToResult = false,
        i,
        nextPath;

      currentPath += node.name;

      if (matches(currentPath)) {
        addToResult = true;
      } else if (node.children) {
        nextPath = currentPath.length > 1 ? currentPath + '/' : currentPath;
        for (i = 0; i < node.children.length; ++i) {
          traverse(node.children[i], nextPath);
        }
      } else {
        addToResult = matches(node.artist) ||
                      matches(node.album) ||
                      matches(node.title);
      }

      if (addToResult) {
        addNodeToResults(node, currentPath);
      }
    }

    traverse(tree, '/');
    res.end(JSON.stringify(results));
  }
};

