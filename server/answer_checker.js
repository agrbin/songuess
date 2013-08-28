/*jslint indent: 2, plusplus: true*/
"use strict";

module.exports = function (options) {
  var
    nonAlphanum = /[^a-zA-Z0-9šđčćž ]/g,
    mulSpace = /  +/g,
    trimSpace = /^ | $/g,
    trimParentheses = /\([^)]*\)/g,
    replacePairs = [
      ['ć', 'c'],
      ['č', 'c'],
      ['š', 's'],
      ['đ', 'dj'],
      ['ž', 'z']
    ];

  function normalize(str) {
    var i;

    if (str === null || str === undefined) {
      return "null";
    }
    str = str.toLowerCase();
    str = str.replace(trimParentheses, '');
    str = str.replace(nonAlphanum, '');
    str = str.replace(mulSpace, ' ');
    str = str.replace(trimSpace, '');
    for (i = 0; i < replacePairs.length; ++i) {
      // regexp used so all occurences are replaced
      str = str.replace(new RegExp(replacePairs[i][0], 'g'), replacePairs[i][1]);
    }
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

