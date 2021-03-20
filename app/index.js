import {RlConnection} from "./modules/rl_connection.js";
import {VoiceConnection} from "./modules/voice_connection.js";
import {PeerConnection} from "./modules/peer_connection.js";

const DEFAULT_OPTIONS = {
  minDistance: 400,
  maxDistance: 6000,
  rolloffFactor: 1.2
}

let voiceConnection;
let rlConnection;

//playerId -> PeerConnection
let peerConnections = {};

let playerId;
let playerName;
let currentOptions = DEFAULT_OPTIONS;

let muted = false;
let isHost = false;

export let toggleMute;

$(document).ready(() => {
  //Status segment
  const $statusRlIcon = $('#status_rl_icon');
  const $statusRlText = $('#status_rl_text');
  const $statusVoiceIcon = $('#status_voice_icon');
  const $statusVoiceText = $('#status_voice_text');

  //Voice connection
  const $inputVoiceServer = $('#input_voice_server');
  const $voiceConnectButton = $('#button_voice_connect');
  const $voiceDisconnectButton = $('#button_voice_disconnect');

  //Room settings
  const $inputRoom = $('#input_room');
  const $inputPassword = $('#input_password');
  const $roomJoinButton = $('#button_room_join');
  const $roomHostButton = $('#button_room_host');
  const $roomLeaveButton = $('#button_room_leave');
  const $roomOptionsButton = $('#button_room_options');

  //Device inputs
  const $inputInputDevice = $('#input_voice_input');
  const $inputOutputDevice = $('#input_voice_output');
  const $buttonMute = $('#button_mute');

  //Playerlist
  const $playerContainer = $('#player_container');
  const $playerListHeader = $('#text_player_list_header');

  //Options modal
  const $inputOptionsMinDistance = $('#input_options_mindistance');
  const $inputOptionsMaxDistance = $('#input_options_maxdistance');
  const $inputOptionsRolloffFactor = $('#input_options_rollofffactor');
  const $modalLobbyOptions = $('#modal_lobby_options');
  const $buttonModalOptionsApply = $('#button_modal_options_apply');

  M.AutoInit();

  //Options modal
  $roomOptionsButton.click(() => {
    $inputOptionsMinDistance.val(currentOptions.minDistance);
    $inputOptionsMaxDistance.val(currentOptions.maxDistance);
    $inputOptionsRolloffFactor.val(currentOptions.rolloffFactor);
    $modalLobbyOptions.modal('open');
  });

  $buttonModalOptionsApply.click(() => {
    if($inputOptionsMinDistance.val() && $inputOptionsMinDistance.val() !== ""
      && $inputOptionsMaxDistance.val() && $inputOptionsMaxDistance.val() !== ""
      && $inputOptionsRolloffFactor.val() && $inputOptionsRolloffFactor.val() !== "") {

      voiceConnection.updateLobbySettings(Number($inputOptionsMinDistance.val()),
          Number($inputOptionsMaxDistance.val()),  Number($inputOptionsRolloffFactor.val()), (result) => {
        if(result['status'] === 'ok') {
          currentOptions.minDistance = Number($inputOptionsMinDistance.val());
          currentOptions.maxDistance = Number($inputOptionsMaxDistance.val());
          currentOptions.rolloffFactor = Number($inputOptionsRolloffFactor.val());
          M.toast({html: "Settings updated!"});

          Object.values(peerConnections).forEach(peer => {
            peer.updateOptions(currentOptions);
          });

        } else {
          M.toast({html: `Error updating lobby settings: ${result['error']}`});
        }
      })

    } else {
      M.toast({html: "Options can't be empty!"});
    }
  });


  //Audio device selection
  navigator.mediaDevices.enumerateDevices().then(devices => {
    devices.forEach(device => {
      if(device.kind === 'audioinput') {
        $("#input_voice_input").append(new Option(device.label.trim(), device.deviceId));
      } else if(device.kind === 'audiooutput') {
        $("#input_voice_output").append(new Option(device.label.trim(), device.deviceId));
      }
    });
    $("select").formSelect();
  });

  $inputInputDevice.change(() => {
    Object.values(peerConnections).forEach(peer => {
      peer.setInputId($inputInputDevice.val());
    });
  });

  $inputOutputDevice.change(() => {
    Object.values(peerConnections).forEach(peer => {
      peer.setSinkId($inputOutputDevice.val());
    });
  });


  rlConnection = new RlConnection();
  rlConnection.onConnect(() => {
    $statusRlIcon.removeClass("red-text");
    $statusRlText.removeClass("red-text");
    $statusRlIcon.addClass("green-text");
    $statusRlText.addClass("green-text");
    $statusRlText.text("Connected");
  });
  rlConnection.onDisconnect(() => {
    $statusRlIcon.removeClass("green-text");
    $statusRlText.removeClass("green-text");
    $statusRlIcon.addClass("red-text");
    $statusRlText.addClass("red-text");
    $statusRlText.text("Disconnected");
  });
  rlConnection.onStateUpdate((state) => {
    if(!playerId) {
      playerId = state['self_id'];
      playerName = state['self_name'];
    }

    const posData = state['players'];

    Object.values(peerConnections).forEach(peer => {

      let found = false;
      for(let pos of Object.values(posData)) {
        if(pos.id === peer.playerId) {
          found = true;
          peer.setPosition(pos.x, pos.y, pos.z);
          if(pos['distance'] > currentOptions.maxDistance) {
            //set gain to 0 by setting found to false
            found = false;
          }
        }
      }

      if(found) {
        peer.setGain(1);
      } else {
        peer.setGain(0);
      }

    });
  });
  rlConnection.connect();

  $voiceConnectButton.click(() => {
    if($inputVoiceServer.val() && $inputVoiceServer.val() !== "") {
      $voiceConnectButton.addClass("disabled");
      $voiceDisconnectButton.removeClass("disabled");

      voiceConnection = new VoiceConnection($inputVoiceServer.val());
      voiceConnection.onConnect(() => {
        $statusVoiceIcon.removeClass("red-text");
        $statusVoiceText.removeClass("red-text");
        $statusVoiceIcon.addClass("green-text");
        $statusVoiceText.addClass("green-text");
        $statusVoiceText.text("Connected");

        $roomHostButton.removeClass("disabled");
        $roomJoinButton.removeClass("disabled");
      });
      voiceConnection.onDisconnect(() => {
        $statusVoiceIcon.removeClass("green-text");
        $statusVoiceText.removeClass("green-text");
        $statusVoiceIcon.addClass("red-text");
        $statusVoiceText.addClass("red-text");
        $statusVoiceText.text("Disconnected");
        $voiceConnectButton.removeClass("disabled");
        $voiceDisconnectButton.addClass("disabled");

        $roomHostButton.addClass("disabled");
        $roomJoinButton.addClass("disabled");
        $roomLeaveButton.addClass("disabled");
        $roomOptionsButton.addClass("disabled");
        clearPlayerDivs();
        Object.values(peerConnections).forEach(pc => pc.disconnect());
        peerConnections = {};
      });
      voiceConnection.onPlayerJoined((data) => {
        M.toast({html: `${data['playerName']} joined!`});
        if(peerConnections[data['playerId']]) {
          M.toast({html: `WARNING: Connection to ID ${data['playerId']} already existed!`});
          peerConnections[data['playerId']].disconnect();
          delete peerConnections[data['playerId']];
        }
        peerConnections[data['playerId']] = new PeerConnection(data['playerId'],
            true, $inputOutputDevice.val(), $inputInputDevice.val(), currentOptions);
        peerConnections[data['playerId']].onSignal(signal => {
          voiceConnection.sendPeerSignal(data['playerId'], signal, (result) => {
            if(result['status'] === 'error') {
              M.toast({html: `Error communicating with peer ${data['playerId']}: ${result['error']}`});
              peerConnections[data['playerId']].disconnect();
              delete peerConnections[data['playerId']];
            }
          });
        });
        peerConnections[data['playerId']].connect();
        addPlayerDiv(data['playerId'], data['playerName'], isHost);
      });
      voiceConnection.onPlayerLeave((data) => {
        if(data['playerId'] === playerId && data['reason'] === "KICKED") {
          $roomHostButton.removeClass("disabled");
          $roomJoinButton.removeClass("disabled");
          $roomLeaveButton.addClass("disabled");
          $roomOptionsButton.addClass("disabled");
          clearPlayerDivs();
          Object.values(peerConnections).forEach(pc => pc.disconnect());
          peerConnections = {};
          return;
        }
        M.toast({html: `${data['playerName']} left.`});
        if(peerConnections[data['playerId']]) {
          peerConnections[data['playerId']].disconnect();
          delete peerConnections[data['playerId']];
        }
        removePlayerDiv(data['playerId']);
      });
      voiceConnection.onPeerSignal((data) => {
        console.debug('signal received: ' + JSON.stringify(data));
        if(!peerConnections[data['from']]) {
          peerConnections[data['from']] = new PeerConnection(data['from'],
              false, $inputOutputDevice.val(), $inputInputDevice.val(), currentOptions);
          peerConnections[data['from']].onSignal(signal => {
            voiceConnection.sendPeerSignal(data['from'], signal, (result) => {
              if(result['status'] === 'error') {
                M.toast({html: `Error communicating with peer ${data['from']}: ${result['error']}`});
                peerConnections[data['from']].disconnect();
                delete peerConnections[data['from']];
              }
            });
          });
          peerConnections[data['from']].connect();
          peerConnections[data['from']].signal(data['data']);
        } else {
          peerConnections[data['from']].signal(data['data']);
        }
      });

      voiceConnection.onSettingsChange((data) => {
        currentOptions = data['settings'];
        Object.values(peerConnections).forEach(peer => {
          peer.updateOptions(currentOptions);
        });
        M.toast({html: "The host updated the lobby settings!"});
      });

      voiceConnection.connect();
    } else {
      M.toast({html: "Server address can't be empty!"});
    }
  });

  $voiceDisconnectButton.click(() => {
    voiceConnection.disconnect();
    voiceConnection.onDisconnectHandler();
    voiceConnection = null;
  });

  $roomJoinButton.click(() => {
    if($inputRoom.val() && $inputRoom.val() !== ""
      && $inputPassword.val() && $inputPassword.val() !== "") {
      if(playerId) {
        voiceConnection.joinLobby($inputRoom.val(), $inputPassword.val(),
            playerId, playerName, (result) => {
          isHost = false;

          if(result['status'] === 'ok') {
            M.toast({html: "Joined!"});
            $roomHostButton.addClass("disabled");
            $roomJoinButton.addClass("disabled");
            $roomLeaveButton.removeClass("disabled");
            result['data']['players'].forEach(player => {
              addPlayerDiv(player['playerId'], player['playerName'], isHost);
            });
          } else {
            M.toast({html: `Error joining lobby: ${result['error']}`});
          }

        });
      } else {
        M.toast({html: "Please join a game first!"});
      }
    } else {
      M.toast({html: "Room name and password can't be empty!"});
    }

  });

  $roomHostButton.click(() => {
    if($inputRoom.val() && $inputRoom.val() !== ""
        && $inputPassword.val() && $inputPassword.val() !== "") {
      if(playerId) {
        voiceConnection.createLobby($inputRoom.val(), $inputPassword.val(),
            playerId, playerName, DEFAULT_OPTIONS,(result) => {

              if(result['status'] === 'ok') {
                isHost = true;
                M.toast({html: "Lobby created!"});
                $roomHostButton.addClass("disabled");
                $roomJoinButton.addClass("disabled");
                $roomLeaveButton.removeClass("disabled");
                $roomOptionsButton.removeClass("disabled");

                addPlayerDiv(playerId, playerName, isHost);

              } else {
                M.toast({html: `Error creating lobby: ${result['error']}`});
              }

            });
      } else {
        M.toast({html: "Please join a game first!"});
      }
    } else {
      M.toast({html: "Room name and password can't be empty!"});
    }

  });

  $roomLeaveButton.click(() => {
    voiceConnection.leaveLobby((result) => {
      if(result['status'] === 'ok') {
        M.toast({html: "Lobby left."});
      } else {
        M.toast({html: `Error leaving lobby: ${result['error']}`});
      }
      clearPlayerDivs();
      $roomHostButton.removeClass("disabled");
      $roomJoinButton.removeClass("disabled");
      $roomLeaveButton.addClass("disabled");
      $roomOptionsButton.addClass("disabled");
      Object.values(peerConnections).forEach(pc => pc.disconnect());
      peerConnections = {};
    });
  });


  //Mute button
  $buttonMute.click(() => {
    toggleMute();
  });

  toggleMute = () => {
    muted = !muted;
    if(muted) {
      $buttonMute.removeClass("green");
      $buttonMute.removeClass("darken-3");
      $buttonMute.addClass("deep-orange");
      $buttonMute.addClass("darken-4");
      const anchor = $buttonMute.children().first().text("mic_off").clone();
      $buttonMute.text("Unmute").prepend(anchor);
    } else {
      $buttonMute.removeClass("deep-orange");
      $buttonMute.removeClass("darken-4");
      $buttonMute.addClass("green");
      $buttonMute.addClass("darken-3");
      const anchor = $buttonMute.children().first().text("mic").clone();
      $buttonMute.text("Mute").prepend(anchor);
    }
    Object.values(peerConnections).forEach(peer => {
      peer.setMuted(muted);
    });
  }


  function addPlayerDiv(addedPlayerId, playerName, isHost) {
    addedPlayerId = escapeHtml(addedPlayerId);
    playerName = escapeHtml(playerName);
    let buttons = '';
    if(isHost && !(addedPlayerId === playerId)) {
      buttons = `<a id="button_kick_${addedPlayerId}" class="btn-floating btn-small waves-effect waves-light deep-orange darken-2 kick-button" data-playerid="${addedPlayerId}"><i class="material-icons">delete</i></a>
          <a id="button_ban_${addedPlayerId}" class="btn-floating btn-small waves-effect waves-light deep-orange darken-4 ban-button" data-playerid="${addedPlayerId}"><i class="material-icons">remove_circle</i></a>`;
    }

    const playerDiv =
        `<div id="player_${addedPlayerId}" class="player">
            <div class="player-name">${playerName}</div>
            ${buttons}
        </div>`;
    $playerContainer.append(playerDiv);

    $(`#button_kick_${addedPlayerId}`).click((event) => {
      const playerId = unescapeHtml($(event.target).parent().data('playerid'));
      voiceConnection.kickPlayer(playerId, false, (result) => {
        if(result['status'] === 'ok') {
          M.toast({html: "Player kicked."});
        } else {
          M.toast({html: `Error kicking player: ${result['error']}`});
        }
      });
    });

    $(`#button_ban_${addedPlayerId}`).click((event) => {
      const playerId = unescapeHtml($(event.target).parent().data('playerid'));
      console.log(`banbutton click with ${playerId}`);
      voiceConnection.kickPlayer(playerId, true, (result) => {
        if(result['status'] === 'ok') {
          M.toast({html: "Player banned."});
        } else {
          M.toast({html: `Error kicking player: ${result['error']}`});
        }
      });
    });

    $playerListHeader.text(`Players (${$playerContainer.children().length}):`);
  }

  function removePlayerDiv(playerId) {
    $(`#player_${escapeHtml(playerId)}`).remove();
    $playerListHeader.text(`Players (${$playerContainer.children().length}):`);
  }
  function clearPlayerDivs() {
    $(`.player`).remove();
    $playerListHeader.text(`Players (0):`);
  }


});


function escapeHtml(html){
  const text = document.createTextNode(html);
  const p = document.createElement('p');
  p.appendChild(text);
  return p.innerHTML;
}

function unescapeHtml(escaped){
  const text = document.createTextNode('');
  const p = document.createElement('p');
  p.innerHTML = escaped;
  return p.textContent;
}