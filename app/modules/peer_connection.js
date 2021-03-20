const AudioContext = window.AudioContext;

export class PeerConnection {

  constructor(playerId, isInitiator, sinkId, inputId, options) {
    this.playerId = playerId;
    this.isInitiator = isInitiator;
    this.sinkId = sinkId;
    this.inputId = inputId;
    this.options = options;
  }

  connect() {
    this.peer = new SimplePeer({initiator: this.isInitiator, config: {iceServers: [{'urls': 'stun:stun.l.google.com:19302'}]}});
    this.peer.on('signal', (signal) => {
      if(this.onSignalHandler) {
        console.debug(`[PEER-${this.playerId}] SEND ${JSON.stringify(signal)}`);
        this.onSignalHandler(signal);
      }
    });
    this.peer.on('stream', (stream) => {
      console.debug(`[PEER-${this.playerId}] Received stream!`);
      this.audio = document.createElement('audio');
      this.audio.srcObject = stream;

      if(this.sinkId !== 'default') {
        this.audio.setSinkId(this.sinkId);
      }
      document.body.appendChild(this.audio);

      const audioCtx = new AudioContext();
      const listener = audioCtx.listener;
      listener.positionX.value = 0;
      listener.positionY.value = 0;
      listener.positionZ.value = 0;

      const source = audioCtx.createMediaStreamSource(stream);
      this.gain = audioCtx.createGain();
      this.panner = audioCtx.createPanner();

      this.panner.refDistance = this.options['minDistance'];
      this.panner.panningModel = 'equalpower';
      this.panner.distanceModel = 'exponential';
      this.panner.rolloffFactor = this.options['rolloffFactor'];
      this.panner.coneOuterAngle = 360;
      this.panner.coneOuterGain = 1;
      this.panner.maxDistance = this.options['maxDistance'];

      source.connect(this.panner).connect(this.gain).connect(audioCtx.destination);

    });

    if(this.inputId !== 'default') {
      navigator.mediaDevices.getUserMedia({audio: {deviceId: this.inputId}, video: false}).then(audioOut => {
        this.inputStream = audioOut;
        this.peer.addStream(this.inputStream);
      });
    } else {
      navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(audioOut => {
        this.inputStream = audioOut;
        this.peer.addStream(this.inputStream);
      });
    }

  }

  disconnect() {
    this.peer.destroy();
    if(this.audio) {
      this.audio.remove();
    }
  }

  signal(data) {
    console.debug(`[PEER-${this.playerId}] REC ${JSON.stringify(data)}`);
    this.peer.signal(data);
  }

  onSignal(callback) {
    this.onSignalHandler = callback;
  }

  setPosition(x, y, z) {
    if(this.panner) {
      //Panner system has different axis
      console.debug(`[PEER-${this.playerId}] Panner position set to ${x},${y},${z}`);
      this.panner.positionX.setValueAtTime(y, this.panner.context.currentTime);
      this.panner.positionY.setValueAtTime(z, this.panner.context.currentTime);
      this.panner.positionZ.setValueAtTime(x, this.panner.context.currentTime);
    } else {
      console.debug(`[PEER-${this.playerId}] Panner not found!`);
    }
  }

  setGain(gain) {
    if(this.gain) {
      console.debug(`[PEER-${this.playerId}] Gain set to ${gain}!`);
      this.gain.gain.value = gain;
    } else {
      console.debug(`[PEER-${this.playerId}] Gain not found!`);
    }
  }

  setSinkId(sinkId) {
    this.sinkId = sinkId;
    this.audio.setSinkId(this.sinkId);
  }

  setInputId(inputId) {
    this.inputId = inputId;
    this.peer.removeStream(this.inputStream);

    if(inputId !== 'default') {
      navigator.mediaDevices.getUserMedia({audio: {deviceId: inputId}, video: false}).then(audioOut => {
        this.inputStream = audioOut;
        this.peer.addStream(this.inputStream);
      });
    } else {
      navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(audioOut => {
        this.inputStream = audioOut;
        this.peer.addStream(this.inputStream);
      });
    }
  }

  updateOptions(options) {
    this.options = options;
    this.panner.refDistance = options['minDistance'];
    this.panner.maxDistance = options['maxDistance'];
    this.panner.rolloffFactor = options['rolloffFactor'];
  }

  setMuted(muted) {
    this.peer._senderMap.keys().next().value.enabled = !muted;
  }

}