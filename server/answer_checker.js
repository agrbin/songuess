/*jslint indent: 2, plusplus: true*/
"use strict";

module.exports = function (options) {
  var
    MISTAKES_BY_CHAR = 1/6, // on 6 chars you may mistype one.
    nonAlpha = /[^a-zA-Zšđčćž ]/g,
    mulSpace = /  +/g,
    trimSpace = /^ | $/g,
    trimParentheses = /\([^)]*\)/g,
    trimSquare = /\[[^\]]*\]/g,
    replacePairs = [
      ['ć', 'c'],
      ['č', 'c'],
      ['š', 's'],
      ['đ', 'dj'],
      ['ž', 'z']
    ];

  // O(n^2) hopefuly.
  function editDistance(s, t) {
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    return Math.min(
      editDistance(s.substr(1), t) + 1,
      editDistance(t.substr(1), s) + 1,
      editDistance(s.substr(1), t.substr(1)) + (s[0] !== t[0] ? 1 : 0)
    );
  }

  // editDistance(t1, t2) >= editDistanceUnderEstimate(t1, t2)
  // O(1)
  function editDistanceUnderEstimate(t1, t2) {
    return Math.abs(t1.length - t2.length);
  }

  // O(n)
  function editDistanceUnderEstimate2(t1, t2) {
    var chars = {}, it, sol = 0;
    for (it = 0; it < t1.length; chars[t1[it++]] = 0);
    for (it = 0; it < t2.length; chars[t2[it++]] = 0);
    for (it = 0; it < t1.length; ++chars[t1[it++]]);
    for (it = 0; it < t2.length; --chars[t2[it++]]);
    for (it in chars)
      sol += Math.abs(chars[it]);
    return Math.round(sol / 2);
  }

  // this function returns a string.
  function normalize(str) {
    var i;
    if (str === null || str === undefined) {
      return "null";
    }
    str = str.toString();
    str = str.toLowerCase();
    str = str.replace(trimParentheses, '');
    str = str.replace(trimSquare, '');
    str = str.replace(nonAlpha, '');
    str = str.replace(mulSpace, ' ');
    str = str.replace(trimSpace, '');
    for (i = 0; i < replacePairs.length; ++i) {
      // regexp used so all occurences are replaced
      str = str.replace(new RegExp(replacePairs[i][0], 'g'), replacePairs[i][1]);
    }
    return str;
  }

  this.checkAnswer = function (playlistItem, answer) {
    if (playlistItem === undefined) {
      return false;
    }

    var t1 = normalize(answer), t2 = normalize(playlistItem.title);
    var allowed_mistakes = Math.floor(t1.length * MISTAKES_BY_CHAR);

    if (t1 === t2) return true;
    if (editDistanceUnderEstimate2(t1, t2) > allowed_mistakes) return false;
    if (editDistanceUnderEstimate(t1, t2) > allowed_mistakes) return false;
    if (editDistance(t1, t2) > allowed_mistakes) return false;
    return true;
  };
};
