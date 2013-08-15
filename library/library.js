/*jslint indent: 2, plusplus: true */
"use strict";

var
  fs = require('fs'),
  LIB_NAME = 'library.json';

function findFiles(node) {
  var
    length,
    i,
    numberOfFiles = 0;

  if (node instanceof Array) {
    length = node.length;
    for (i = 0; i < length; ++i) {
      numberOfFiles += findFiles(node[i]);
    }
  } else if (node.children) {
    numberOfFiles = findFiles(node.children);
  } else {
    exports.filesById[node.inode] = node;
    numberOfFiles = 1;
  }

  return numberOfFiles;
}

exports.loadLibrary = function (callback) {
  exports.filesById = {};

  fs.exists(LIB_NAME, function (exists) {
    if (exists) {
      fs.readFile(LIB_NAME, { encoding: 'utf8' }, function (err, data) {
        exports.library = JSON.parse(data);
        callback(findFiles(exports.library));
      });
    } else {
      callback(0);
      exports.library = {};
    }
  });
};

exports.saveLibrary = function (newLibrary, callback) {
  fs.writeFile(LIB_NAME, JSON.stringify(newLibrary), callback);
};

