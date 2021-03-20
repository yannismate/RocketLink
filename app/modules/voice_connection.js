export class VoiceConnection {

  constructor(address) {
    if(!address.startsWith("http://") && !address.startsWith("https://")) {
      address = "http://" + address;
    }
    this.address = address;
  }

  connect() {
    console.log("[VOICE] Connecting...");
    this.connection = io(this.address, {reconnection : false, forceNew: true});
    this.connection.on('connect', ()=> {
      console.log("[VOICE] Connected!");
      if(this.onConnectHandler) {
        this.onConnectHandler();
      }
    });
    this.connection.on('disconnect',() => {
      console.log("[VOICE] Disconnected.");
      if(this.onDisconnectHandler) {
        this.onDisconnectHandler();
      }
    });
    this.connection.on('lobby_player_joined', (data) => {
      if(this.onPlayerJoinedHandler) {
        this.onPlayerJoinedHandler(data);
      }
    });
    this.connection.on('lobby_player_disconnect', (data) => {
      if(this.onPlayerLeaveHandler) {
        this.onPlayerLeaveHandler(data);
      }
    });
    this.connection.on('lobby_settings_changed', (data) => {
      if(this.onSettingsChangeHandler) {
        this.onSettingsChangeHandler(data);
      }
    });
    this.connection.on('peer_signal', (data) => {
      console.debug(`peer_signal: ${JSON.stringify(data)}`);
      if(this.onPeerSignalHandler) {
        console.debug(`peer_signal handled`);
        this.onPeerSignalHandler(data);
      }
    })
  }

  disconnect() {
    this.connection.close();
  }

  onConnect(callback) {
    this.onConnectHandler = callback;
  }

  onDisconnect(callback) {
    this.onDisconnectHandler = callback;
  }

  createLobby(room, password, playerId, playerName, settings, callback) {
    console.log(`[VOICE] Trying to create lobby ${room}`);
    this.connection.emit('lobby_create', {room, password, playerId, playerName, settings}, callback);
  }

  joinLobby(room, password, playerId, playerName, callback) {
    console.log(`[VOICE] Trying to join lobby ${room}`);
    this.connection.emit('lobby_join', {room, password, playerId, playerName}, callback);
  }

  leaveLobby(callback) {
    console.log(`[VOICE] Trying to leave lobby`);
    this.connection.emit('lobby_leave', {}, callback);
  }

  updateLobbySettings(minDistance, maxDistance, rolloffFactor, callback) {
    console.log(`[VOICE] Trying to update lobby settings`);
    this.connection.emit('lobby_update_settings', {minDistance, maxDistance, rolloffFactor}, callback);
  }

  kickPlayer(playerId, isBan, callback) {
    this.connection.emit('lobby_kick_player', {playerId, ban: isBan}, callback);
  }

  sendPeerSignal(toPlayerId, data, callback) {
    console.debug(`[PEER-${toPlayerId}] SEND ${{to: toPlayerId, data}}`);
    this.connection.emit('peer_signal', {to: toPlayerId, data}, callback);
  }

  onPlayerJoined(callback) {
    this.onPlayerJoinedHandler = callback;
  }

  onPlayerLeave(callback) {
    this.onPlayerLeaveHandler = callback;
  }

  onSettingsChange(callback) {
    this.onSettingsChangeHandler = callback;
  }

  onPeerSignal(callback) {
    this.onPeerSignalHandler = callback;
  }

}