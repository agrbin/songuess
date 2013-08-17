/*jslint indent: 2, plusplus: true */
"use strict";

module.exports = {
  fixPath: function (path) {
    if (path === undefined) {
      return '/';
    }

    if (path[path.length - 1] === '/') {
      path = path.substring(0, path.length - 1);
    }

    if (path[0] !== '/') {
      return '/' + path;
    }
    return path;
  },
  nodeForPath: function (libraryTree, path) {
    var
      pathComponents = this.fixPath(path).split('/'),
      i,
      j,
      node = libraryTree;

    for (i = 0; i < pathComponents.length; ++i) {
      if (pathComponents[i].length > 0) {
        for (j = 0; j < node.children.length; ++j) {
          if (pathComponents[i] === node.children[j].name) {
            break;
          }
        }
        if (j === node.children.length) {
          return undefined;
        }
        node = node.children[j];
      }
    }

    return node;
  }
};

