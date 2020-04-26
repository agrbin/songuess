console.log('hi from popup');

// TODO add stop streaming button.

function showSpinner() {
  $('#spinner').show();
  $('#statusMessage').hide();
}

function showMessage(message) {
  $('#spinner').hide();
  $('#statusMessage').text(message);
  $('#statusMessage').show();
}

$(function() {
  chrome.runtime.sendMessage({cmd: 'isAttached'}, function(response) {
    if (response == false) {
      $('#attach_ui').show();
      $('#detach_ui').hide();
    } else {
      $('#detach_ui').show();
      $('#attach_ui').hide();
    }
  });

  $('#attach_button').click(function() {
    showSpinner();

    const rawName = $('#room_name').val();
    const name = rawName.startsWith('#')? rawName: ('#' + rawName);

    chrome.runtime.sendMessage({
      cmd: 'attachToRoom',
      roomName: name
    });
  });

  $('#detach_button').click(function() {
    $('#attach_ui').show();
    $('#detach_ui').hide();
    chrome.runtime.sendMessage({cmd: 'detach'});
  });
});

$(document).on('keypress', 'input', function(e) {
  if (e.keyCode == 13) { // enter pressed
    $('#attach_button').click();
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('got message: ', request);

  if (request.cmd == 'startedStreaming') {
    showMessage('');
    $('#detach_ui').show();
    $('#attach_ui').hide();
  } else if (request.cmd == 'errorAttaching') {
    showMessage(request.message);
  }
});
