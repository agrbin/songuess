/*jslint indent: 2, plusplus: true */
"use strict";

var
  fs = require('fs'),
  LIB_NAME = 'library.json',
  libraryContents;

exports.loadLibrary = function () {
  exports.filesById = [];

  if (fs.existsSync(LIB_NAME)) {
    libraryContents = fs.readfileSync(libName, { encoding: 'utf8' });
    exports.library = JSON.parse(libraryContents);
    findFiles(exports.library);
  } else {
    exports.library = {};
  }
};

function findFiles(node) {
  var
    children = node.children,
    childrenLength,
    i;

  if (children) {
    childrenLength = children.length;
    for (i = 0; i < childrenLength; ++i) {
      findFiles(children[i]);
    }
  } else {
    exports.filesById[node.inode] = node;
  }
}

