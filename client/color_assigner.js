/*jslint indent: 2, plusplus: true*/
"use strict";

// chooses colors around the HSB circle
// doesn't work very well, might regres to random

var predefinedColors = [
  "mediumblue",
  "crimson",
  "green",
  "saddlebrown",
  "dodgerblue",
  "magenta",
  "darkorange",
  "limegreen",
  "orangered",
  "mediumpurple"
];

function ColorAssigner() {
  var
    assignedColors = {},
    assignedColorsCount = 0,
    RND_COMPONENT_MARGIN = 50;

  function randomComponent() {
    return RND_COMPONENT_MARGIN + Math.floor(Math.random() * 255 - 2 * RND_COMPONENT_MARGIN);
  }

  function newColor() {
    if (assignedColorsCount === predefinedColors.length) {
      return "rgb("
             + randomComponent() + ","
             + randomComponent() + ","
             + randomComponent() + ")";
    }

    return predefinedColors[assignedColorsCount++];
  }

  this.colorForId = function (id) {
    if (id.split('.')[0] === '1166224657908994156540') { // irma
      return "purple";
    }

    var color = assignedColors[id];
    if (color === undefined) {
      assignedColors[id] = (color = newColor());
    }
    return color;
  };
}
