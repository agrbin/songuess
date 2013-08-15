/*jslint indent: 2, plusplus: true */
"use strict";

var
  fs = require('fs'),
  calledAs = process.argv[1],
  dirname = calledAs.replace(/\/[^\/]*$/, ''),
  LIB_NAME = 'library.json',
  libPath = dirname + '/../library/' + LIB_NAME;
  // previous line means that this script needs to be loaded from project_root/some_folder/some_script.js

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

  fs.exists(libPath, function (exists) {
    if (exists) {
      fs.readFile(libPath, { encoding: 'utf8' }, function (err, data) {
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
  fs.writeFile(libPath, JSON.stringify(newLibrary), callback);
};

