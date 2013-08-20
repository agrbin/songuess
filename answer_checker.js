/*jslint indent: 2, plusplus: true*/
"use strict";

module.exports = function (options) {
  this.checkAnswer = function (playlistItem, answer) {
    return answer.toLowerCase() === playlistItem.title.toLowerCase();
  }
};

