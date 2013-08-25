/*jslint indent: 2, plusplus: true*/
/*globals $, pretty*/
"use strict";

function UsersList(chat, listElement) {
  var
    currentPositionForId,
    currentIndexForId,
    ANIMATION_DURATION = 300;

  function pullOut() {
    var children = listElement.children();

    currentPositionForId = {};
    currentIndexForId = {};

    children.each(function (index) {
      var id = $(this).attr('id');
      currentPositionForId[id] = $(this).position();
      currentIndexForId[id] = index;
    });

    children.each(function (index) {
      var
        element = $(this),
        pos = currentPositionForId[element.attr('id')],
        width = element.width();

      element
        .css('position', 'absolute')
        .css('left', pos.left)
        .css('top', pos.top)
        .width(width);
    });
  }

  function putBack() {
    var
      yPositions = [],
      i,
      len;

    listElement.children().each(function (index) {
      var o = {
        y: $(this).position().top,
        element: $(this)
      };
      yPositions.push(o);
    });

    console.log(yPositions);
    
    yPositions.sort(function (a, b) {
      return a.y - b.y;
    });

    len = yPositions.length;
    for (i = 0; i < len; ++i) {
      listElement.append(yPositions[i].element); 
    }

    listElement.children().each(function (index) {
      $(this).css('position', 'static');
    });
  }

  function getClients() {
    var
      result = [],
      i,
      len = chat.getNumberOfClients(),
      client;

    for (i = 0; i < len; ++i) {
      client = chat.getClient(i);
      result.push(client);
    }

    result.sort(function (a, b) {
      return b.score - a.score;
    });
    return result;
  }

  this.updateList = function () {
    var
      clients = getClients(),
      clientsLength = clients.length,
      i,
      currentPosition,
      currentIndex,
      listLayout,
      element,
      yPos,
      children = listElement.children(),
      width,
      removedIndex,
      fullClient;

    if (children.length === 0) {
      for (i = 0; i < clientsLength; ++i) {
        listElement.append(pretty.fullClient(clients[i]));
      }
    } else {
      pullOut();

      element = $(children[0]);
      listLayout = {
        pos: element.position(),
        height: element.outerHeight(true)
      };

      children.each(function (index) {
        var id = $(this).attr('id');
        if (chat.getClient(id).id === undefined) {
          removedIndex = index;
          $(this).fadeOut(ANIMATION_DURATION, function () { $(this).remove(); });
        }
      });

      for (i = 0; i < clientsLength; ++i) {
        currentPosition = currentPositionForId[clients[i].id];
        currentIndex = currentIndexForId[clients[i].id];

        yPos = listLayout.pos.top + listLayout.height * i;

        fullClient = pretty.fullClient(clients[i]);

        if (currentIndex === undefined) { // this entry was added
          element = $(fullClient);
          if (i === clientsLength - 1) {
            listElement.append(element);
          } else {
            $(children[i]).before(element);
          }
          width = element.width();
          element
            .css('position', 'absolute')
            .css('top', yPos)
            .css('display', 'none')
            .css('left', listLayout.pos.left)
            .width(width)
            .fadeIn(ANIMATION_DURATION);
        } else {
          $(children[currentIndex])
            .html($(fullClient).html())
            .animate({ top: yPos }, ANIMATION_DURATION);
        }
      }

      setTimeout(putBack, ANIMATION_DURATION);
    }
  };
}

