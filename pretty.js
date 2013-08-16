var Pretty = {
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
  time : function(when) {
    var d = new Date(when);
    var minutes = Pretty.leadingZero(d.getHours()) + ":"
        + Pretty.leadingZero(d.getMinutes());
    var full = minutes + ":"
        + Pretty.leadingZero(d.getSeconds()) + "."
        + Pretty.leadingZero(d.getMilliseconds(), 3);
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
  fullClient : function (client) {
    return $("<span>")
      .addClass("full-client")
      .css({color: Pretty.colorStyle(client.id)})
      .text(client.display)
      [0].outerHTML;
  },
  nameClient : function (client) {
    return $("<span>")
      .addClass("full-client")
      .css({color: Pretty.colorStyle(client.id)})
      .text(client.name)
      [0].outerHTML;
  }
};

