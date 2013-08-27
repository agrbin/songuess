/*jslint indent: 2, plusplus: true*/
"use strict";

module.exports = function (options) {
  var
    nonAlphanum = /[^a-zA-Z0-9 ]/g,
    mulSpace = /  +/g,
    trimSpace = /^ | $/g;

  function normalize(str) {
    if (str === null) {
      return "null";
    }
    str = str.toLowerCase();
    str = str.replace(nonAlphanum, '');
    str = str.replace(mulSpace, ' ');
    str = str.replace(trimSpace, '');
    return str;
  }

  this.checkName = function (name1, name2) {
    return normalize(name1) === normalize(name2);
  };

  this.checkAnswer = function (playlistItem, answer) {
    if (playlistItem === undefined) {
      return false;
    }

    return normalize(answer) === normalize(playlistItem.title);
  };
};

