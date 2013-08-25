/*jslint indent: 2, plusplus: true*/
"use strict";

module.exports = function (options) {
  var 
    nonAlphanum = /[^a-zA-Z0-9 ]/g,
    mulSpace = /  +/g,
    trimSpace = /^ | $/g;

  function normalize(str) {
    str = str.toLowerCase();
    str = str.replace(nonAlphanum, '');
    str = str.replace(mulSpace, ' ');
    str = str.replace(trimSpace, '');
    return str;
  }

  this.checkAnswer = function (playlistItem, answer) {
    if (playlistItem === undefined) return false;

    return normalize(answer) === normalize(playlistItem.title);
  };
};

