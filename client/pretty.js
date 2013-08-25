/*jslint indent: 2, plusplus: true*/
/*globals myClock, $, ColorAssigner*/
"use strict";

var pretty = {
  t0 : null,
  colorStyle : (function () {
    var colorAssigner = new ColorAssigner();

    return function (id) {
      return colorAssigner.colorForId(id);
    };
  }()),
  leadingZero : function (number, num) {
    var sol = number.toString();
    if (num === undefined) {
      num = 2;
    }
    while (sol.length < num) {
      sol = "0" + sol;
    }
    return sol;
  },
  relativeTime : function (songStarts) {
    if (!songStarts) {
      pretty.t0 = null;
    } else {
      pretty.t0 = songStarts;
    }
  },
  timeInterval : function (ms) {
    var sol = (Math.round(ms) / 1000).toString();
    if (ms >= 0) {
      sol = "+" + sol;
    }
    if (sol.indexOf('.') === -1) {
      sol = sol + '.';
    }
    while (sol.length < 5) {
      sol = sol + "0";
    }
    while (sol.length > 5) {
      sol = sol.substr(0, sol.length - 1);
    }
    if (sol.substr(-1) === ".") {
      sol = "+ " + sol.substr(1, sol.length - 2);
    }
    return sol;
  },
  delimit : function (flag) {
    if (!flag) {
      flag = "|";
    }
    return $("<span>")
      .addClass("time")
      .html("&nbsp;&nbsp;&nbsp;&nbsp;" + flag)[0]
      .outerHTML;
  },
  playTime : function (offset) {
    return $("<span>")
      .addClass("time")
      .html(pretty.timeInterval(offset))[0]
      .outerHTML;
  },
  text : function (info, css_class) {
    return $("<span>")
      .addClass(css_class)
      .text(info)[0]
      .outerHTML;
  },
  song : function (song) {
    return '"' + pretty.text(song.title, "bold") + '"';
  },
  fullClient : function (client) {
    return $("<div>")
      .addClass("full-client")
      .attr('id', client.id)
      .css({color: pretty.colorStyle(client.id)})
      .text(client.display)
      .append($("<span>").text(client.score))[0]
      .outerHTML;
  },
  nameClient : function (client) {
    return $("<span>")
      .addClass("full-client")
      .css({color: pretty.colorStyle(client.id)})
      .text(client.name)[0]
      .outerHTML;
  }
};

