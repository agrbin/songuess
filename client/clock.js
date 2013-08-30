/*
 * This is clock instance used for synchronization between clients and server.
 */
var myClock = new (function() {

  var that = this, offset = 0;

  this.originalClock = function () {
    return (new Date().getTime());
  };

  this.clock = function () {
    return (new Date().getTime() + offset);
  };

  this.skew = function (x) {
    offset += x;
  };

  this.timeTo = function (when) {
    return Math.max(0, when - that.clock());
  };

})();

