/*jslint indent: 2, plusplus: true*/
/*globals $, pretty*/
"use strict";

var ANIMATION_DURATION = 300;

function GroupedUsersList(chat, listElement) {
  var containers = [], divs = [], usersLists = [],
    MAX_GROUPS = 10;

  // helper class
  function ClientContainer(group) {
    var score = null, size = null, that = this,
      ids = [];
    this.refresh = function () {
      var it, client, bio = {}, pid;
      score = 0; size = 0; ids = [];
      for (it = 0; it < chat.getNumberOfClients(); ++it) {
        client = chat.getClient(it);
        pid = chat.id2Pid(client.id);
        if (client.group === group) {
          if (!bio.hasOwnProperty(pid)) {
            score += client.score;
            bio[pid] = 1;
          }
          ids.push(client.id);
          ++size;
        }
      }
    };
    // returns client with this id only if it's in a group group.
    this.getClient = function (id) {
      var sol;
      if (score === null) throw "call refresh firstly";
      if (id < size) {
        sol = chat.getClient(ids[id]);
      } else {
        sol = chat.getClient(id);
      }
      if (sol.group !== group) {
        return {};
      }
      return sol;
    };
    // returns number of clients in group group
    this.getNumberOfClients = function () {
      if (score === null) throw "call refresh firstly";
      return size;
    };
    // only after getNumberOfClients is called!
    this.getScore = function () {
      if (score === null) throw "call refresh firstly";
      return score;
    };
  };

  this.updateList = function () {
    var it;
    for (it = 0; it < MAX_GROUPS; ++it) {
      containers[it].refresh();
      containers[it].getNumberOfClients() ?
        divs[it].show() : divs[it].hide();
      $('.group-score', divs[it]).text(containers[it].getScore());
      usersLists[it].updateList();
    }
  };

  // creates everything for one user list.
  function createGroup(it) {
    var
      innerDiv = $('<div>'),
      scoreSpan = $('<span>')
          .addClass('group-score')
          .text(''),
      outerDiv = $('<div>')
          .hide()
          .addClass('grouped-users ' + (it ? '' : 'zero-group'))
          .append(scoreSpan).append(innerDiv).appendTo(listElement);
    if (!it) scoreSpan.hide();
    divs.push(outerDiv);
    containers.push(new ClientContainer(it));
    usersLists.push(new UsersList(containers[it], innerDiv, outerDiv));
  }

  $(function () {
    var it = 0;
    for (it = 0; it < MAX_GROUPS; ++it)
      createGroup(it);
  });
}

function UsersList(clientContainer, listElement, outerElement) {
  var
    currentPositionForId,
    currentIndexForId;

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
      len = clientContainer.getNumberOfClients(),
      client;

    for (i = 0; i < len; ++i) {
      client = clientContainer.getClient(i);
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
      clientWithScore,
      layoutHeight;

    if (children.length === 0) {
      for (i = 0; i < clientsLength; ++i) {
        listElement.append(pretty.clientWithScore(clients[i]));
      }
    } else {
      layoutHeight = outerElement.height();
      outerElement.css('height', layoutHeight);
      pullOut();

      element = $(children[0]);
      listLayout = {
        pos: element.position(),
        height: element.outerHeight(true)
      };

      children.each(function (index) {
        var id = $(this).attr('id');
        if (clientContainer.getClient(id).id === undefined) {
          removedIndex = index;
          $(this).fadeOut(ANIMATION_DURATION, function () { $(this).remove(); });
        }
      });

      for (i = 0; i < clientsLength; ++i) {
        currentPosition = currentPositionForId[clients[i].id];
        currentIndex = currentIndexForId[clients[i].id];

        yPos = listLayout.pos.top + listLayout.height * i;

        clientWithScore = pretty.clientWithScore(clients[i]);

        if (currentIndex === undefined) { // this entry was added
          element = $(clientWithScore);
          if (i === clientsLength - 1) {
            listElement.append(element);
          } else {
            $(children[i]).before(element);
          }
          outerElement.css('height', layoutHeight + element.outerHeight());
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
            .html($(clientWithScore).html())
            .animate({ top: yPos }, ANIMATION_DURATION);
        }
      }

      setTimeout(function () {
        putBack();
        outerElement.css('height', '');
      }, ANIMATION_DURATION);
    }
  };
}

