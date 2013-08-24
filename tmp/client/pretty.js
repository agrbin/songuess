var pretty = {
  t0 : null,
  colorStyle : function(id) {
    id = id.split(".")[1];
    var r = Math.floor(id%256*0.8); id /= 256;
    var g = Math.floor(id%256*0.8); id /= 256;
    var b = Math.floor(id%256*0.8); id /= 256;
    return "rgb(" + [r,g,b].join() + ")";
  },
  leadingZero : function(number, num) {
    var sol = number.toString();
    if (num === undefined) {
      num = 2;
    }
    while (sol.length < num)
      sol = "0" + sol;
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
    var sol = (Math.round(ms)/1000).toString();
    if (sol[0] !== '-') sol = "+" + sol;
    if (sol.indexOf('.') === -1) sol = sol + '.';
    while (sol.length < 5) sol = sol + "0";
    while (sol.length > 5) sol = sol.substr(0, sol.length-1);
    if (sol.substr(-1) === ".") sol = "+ " + sol.substr(1, sol.length - 2);
    return sol.replace(/d/g, '&nbsp;');
  },
  time : function(when, forceAbsolute) {
    if (pretty.t0 && !forceAbsolute) {
      return $("<span>")
        .addClass("time")
        .attr('title', full)
        .html(pretty.timeInterval(when - pretty.t0))
        [0].outerHTML;
    }
    var d, minutes, full;
    if (!when) {
      when = myClock.clock();
    }
    d = new Date(when);
    minutes = pretty.leadingZero(d.getHours()) + ":"
        + pretty.leadingZero(d.getMinutes());
    full = minutes + ":"
        + pretty.leadingZero(d.getSeconds()) + "."
        + pretty.leadingZero(d.getMilliseconds(), 3);
    return $("<span>")
      .addClass("time")
      .attr('title', full)
      .text(minutes)
      [0].outerHTML;
  }, 
  text : function (info, css_class) {
    return $("<span>")
      .addClass(css_class)
      .text(info)
      [0].outerHTML;
  },
  song : function (song) {
    return '"' + pretty.text(song.title, "bold") + '"';
  },
  fullClient : function (client) {
    return $("<div>")
      .addClass("full-client")
      .css({color: pretty.colorStyle(client.id)})
      .text(client.display)
      .append($("<span>").text(client.score))
      [0].outerHTML;
  },
  nameClient : function (client) {
    return $("<span>")
      .addClass("full-client")
      .css({color: pretty.colorStyle(client.id)})
      .text(client.name)
      [0].outerHTML;
  }
};

