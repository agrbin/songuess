/*jslint indent: 2, plusplus: true*/
"use strict";

function ColorAssigner() {
  var
    assignedColors = {},
    assignedColorsCount = 0,
    RND_COMPONENT_MARGIN = 50,
    predefinedColors = [
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

  function randomComponent() {
    return RND_COMPONENT_MARGIN + Math.floor(Math.random() * (255 - 2 * RND_COMPONENT_MARGIN));
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
    if (id.split('.')[0] === '1050245385503464203080') { // dora
      return 'deeppink';
    }
    if (id.split('.')[0] === '1166224657908994156540') { // irma
      return "darkorchid";
    }
    if (id.split('.')[0] === '1025491752763741231750') { // braut
      return "rgb(243, 227, 38)";
    }

    var color = assignedColors[id];
    if (color === undefined) {
      assignedColors[id] = (color = newColor());
    }
    return color;
  };
}
