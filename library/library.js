/*jslint regexp: true, indent: 2, plusplus: true */
"use strict";

var
  fs = require('fs'),
  calledAs = process.argv[1] || '.',
  dirname = calledAs.replace(/\/[^\/]*$/, ''),
  LIB_NAME = 'library.json',
  libPath = dirname + '/../library/' + LIB_NAME;
  // previous line means that this script needs to be loaded from project_root/some_folder/some_script.js

function findFiles(node) {
  var
    length,
    i,
    numberOfFiles = 0;

  if (node.children) {
    length = node.children.length;
    for (i = 0; i < length; ++i) {
      numberOfFiles += findFiles(node.children[i]);
    }
  } else {
    exports.filesById[node.inode] = node;
    numberOfFiles = 1;
  }

  return (node.filesCount = numberOfFiles);
}

exports.loadLibrary = function (callback) {
  exports.filesById = {};

  fs.exists(libPath, function (exists) {
    if (exists) {
      fs.readFile(libPath, { encoding: 'utf8' }, function (err, data) {
        var
          lib = JSON.parse(data),
          numFiles = findFiles(lib);

        exports.library = lib;

        if (callback) {
          callback(numFiles);
        }
      });
    } else {
      exports.library = {};
      if (callback) {
        callback(0);
      }
    }
  });
};

exports.saveLibrary = function (newLibrary, callback) {
  fs.writeFile(libPath, JSON.stringify(newLibrary), callback);
};

