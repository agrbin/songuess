/*jslint indent: 2, plusplus: true*/
"use strict";

function UsersList(listElement) {
  this.updateList = function (correctAnswerId, resetedScoreId) {
    var
      it,
      client,
      clientElement;

    $(listElement).empty();
    for (it = 0; it < chat.getNumberOfClients(); ++it) {
      client = chat.getClient(it);
      clientElement = $(pretty.fullClient(client));
      $(listElement).append(clientElement);
      if (correctAnswerId === client.id || resetedScoreId === client.id) {
        clientElement.css('webkitAnimationName', 'blink-element');
      }
    }
  };
}

