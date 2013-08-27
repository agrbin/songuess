/*jslint indent: 2, plusplus: true*/
"use strict";

module.exports = function (options) {
  var
    nonAlpha = /[^a-zA-Z ]/g,
    mulSpace = /  +/g,
    trimSpace = /^ | $/g,
    trimParentheses = /\([^)]*\)/g;


  function normalize(str) {
    if (str === null || str === undefined) {
      return "null";
    }
    str = str.toLowerCase();
    str = str.replace(trimParentheses, '');
    str = str.replace(nonAlpha, '');
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

