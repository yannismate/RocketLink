export class RlConnection {

  constructor() {

  }

  connect() {
    this.isReconnecting = false;
    console.log("[RL] Connecting...");
    this.connection = new WebSocket("ws://127.0.0.1:49122");
    this.connection.onopen = () => {
      console.log("[RL] Connected!");
      if(this.onConnectHandler) {
        this.onConnectHandler();
      }
    };
    this.connection.onclose = () => {
      console.log("[RL] Connection closed.");
      if(this.onDisconnectHandler) {
        this.onDisconnectHandler();
      }
      this.reconnect();
    }
    this.connection.onerror = (error) => {
      console.log(`[RL] Connection error. ${error}`);
      this.connection.close();
      this.reconnect();
    }
    this.connection.onmessage = (message) => {
      let data = message.data;
      if(data.charAt(0) !== '{') {
        data = atob(data);
      }
      data = JSON.parse(data);
      if(data['event'] === 'game:update_state') {
        if(this.onStateUpdateHandler) {
          this.onStateUpdateHandler(data['data']);
        }
      }
    }
  }

  reconnect() {
    if(this.isReconnecting) {
      return;
    }
    this.isReconnecting = true;
    setTimeout(() => {
      this.connect();
    }, 5000);
  }

  onConnect(callback) {
    this.onConnectHandler = callback;
  }

  onDisconnect(callback) {
    this.onDisconnectHandler = callback;
  }

  onStateUpdate(callback) {
    this.onStateUpdateHandler = callback;
  }


}