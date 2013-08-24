/*jslint indent: 2, plusplus: true*/
"use strict";

function ColorAssigner() {
  var
    assignedColors = {},
    firstColorAngle = Math.random(),
    assignedColorsCount = 0,
    MAX_USERS = 1024,
    usedAngles = {},
    lastAngle = 0,
    currentJumpSize = MAX_USERS;

  // http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
  function hsv2rgb(h, s, v) {
    var r, g, b, i, f, p, q, t;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
    }
    return {
      r: Math.floor(r * 255),
      g: Math.floor(g * 255),
      b: Math.floor(b * 255)
    };
  }

  function rgbForAngle(angle) {
    var rgb = hsv2rgb(angle / MAX_USERS, 1, 1);
    return "rgb(" + [rgb.r, rgb.g, rgb.b].join() + ")";
  }

  function newColor() {
    var
      angle,
      i,
      j,
      done = false;

    for (j = 0; j < 2; ++j) {
      for (i = 0; i < MAX_USERS / currentJumpSize; ++i) {
        angle = (lastAngle + i * currentJumpSize) % MAX_USERS;
        if (usedAngles[angle] === undefined) {
          done = true;
          break;
        }
      }
      if (done === false) {
        currentJumpSize /= 2;
      }
    }

    usedAngles[angle] = true;
    lastAngle = angle;
    return rgbForAngle(angle);
  }

  this.colorForId = function (id) {
    var color = assignedColors[id];
    if (color === undefined) {
      assignedColors[id] = (color = newColor());
    }
    return color;
  };
}
