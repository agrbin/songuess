/*jslint indent: 2, plusplus: true*/
"use strict";

exports.clock = function () {
  return (new Date().getTime());
};

exports.time = function () {
  return (new Date()).toString();
};

exports.Timer = function () {
  var start = null;
  this.reset = function () {
    start = exports.clock();
  };
  this.get = function () {
    return exports.clock() - start;
  };
  this.reset();
};
