import { Eventable } from '../util/Eventable.js';
import {
  createPromiseStatus,
  createPromiseStatusPromise,
  resolvePromiseStatus,
} from './PromiseStatus.js';

/** @typedef {import('./PeerJsSignaling.js').PeerJsSignaling} PeerJsSignaling */

const DEFAULT_CONNECTION_OPTS = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:global.stun.twilio.com:3478',
      ],
    },
  ],
  sdpSemantics: 'unified-plan',
};

const SHOW_DEBUG = true;

/**
 * @param  {...any} messages
 */
function debug(...messages) {
  if (!SHOW_DEBUG) {
    return;
  }

  console.log(...messages);
}

/**
 * @typedef PeerfulConnectionEvents
 * @property {(data: string) => void} data
 * @property {(error: Error) => void} error
 * @property {() => void} close
 */

/**
 * @augments Eventable<PeerfulConnectionEvents>
 */
export class PeerfulConnection extends Eventable {
  /**
   * @param {string} id
   * @param {PeerJsSignaling} signaling
   * @param {object} [options]
   */
  constructor(id, signaling, options = undefined) {
    super();
    options = {
      ...DEFAULT_CONNECTION_OPTS,
      ...options,
    };

    /** @protected */
    this.opened = false;
    /** @protected */
    this.closed = false;

    this.localId = id;
    this.remoteId = null;

    /** @protected */
    this.signaling = signaling;

    /**
     * @protected
     * @type {import('./PromiseStatus.js').PromiseStatusResult<PeerfulConnection>}
     */
    this.connectedStatus = null;
    /**
     * @protected
     * @type {RTCPeerConnection}
     */
    this.peerConnection = null;
    /**
     * @protected
     * @type {Array<RTCIceCandidate>}
     */
    this.pendingCandidates = [];
    /**
     * @protected
     * @type {RTCDataChannel}
     */
    this.dataChannel = null;

    /** @private */
    this.onIceCandidate = this.onIceCandidate.bind(this);
    /** @private */
    this.onIceCandidateError = this.onIceCandidateError.bind(this);
    /** @private */
    this.onIceConnectionStateChange =
      this.onIceConnectionStateChange.bind(this);
    /** @private */
    this.onDataChannelClose = this.onDataChannelClose.bind(this);
    /** @private */
    this.onDataChannelError = this.onDataChannelError.bind(this);
    /** @private */
    this.onDataChannelMessage = this.onDataChannelMessage.bind(this);
    /** @private */
    this.onDataChannelOpen = this.onDataChannelOpen.bind(this);
  }

  /**
   * @protected
   * @param {RTCDataChannel} channel
   */
  setDataChannel(channel) {
    if (this.dataChannel) {
      const previous = this.dataChannel;
      this.dataChannel = null;
      previous.removeEventListener('message', this.onDataChannelMessage);
      previous.removeEventListener('error', this.onDataChannelError);
      previous.removeEventListener('close', this.onDataChannelClose);
      previous.removeEventListener('open', this.onDataChannelOpen);
      previous.close();
    }

    if (channel) {
      this.dataChannel = channel;
      channel.binaryType = 'arraybuffer';
      channel.addEventListener('message', this.onDataChannelMessage);
      channel.addEventListener('error', this.onDataChannelError);
      channel.addEventListener('close', this.onDataChannelClose);
      channel.addEventListener('open', this.onDataChannelOpen);
    }
  }

  /**
   * @param {string} data
   */
  send(data) {
    if (!this.dataChannel) {
      throw new Error('Cannot send message to un-opened connection.');
    }

    this.dataChannel.send(data);
  }

  /**
   * @param {RTCConfiguration} [options]
   */
  open(options = undefined) {
    if (this.opened) {
      throw new Error('Cannot open already opened connection.');
    }

    this.opened = true;
    this.closed = false;
    this.connectedStatus = createPromiseStatus();

    const peerConnection = new RTCPeerConnection(options);
    this.peerConnection = peerConnection;
    peerConnection.addEventListener('icecandidate', this.onIceCandidate);
    peerConnection.addEventListener(
      'icecandidateerror',
      this.onIceCandidateError
    );
    peerConnection.addEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange
    );
    return this;
  }

  close() {
    if (this.closed) {
      throw new Error('Cannot close already closed connection.');
    }

    this.closed = true;
    this.opened = false;
    this.connectedStatus = null;

    this.setDataChannel(null);

    const { peerConnection } = this;
    this.peerConnection = null;
    peerConnection.removeEventListener('icecandidate', this.onIceCandidate);
    peerConnection.removeEventListener(
      'icecandidateerror',
      this.onIceCandidateError
    );
    peerConnection.removeEventListener(
      'iceconnectionstatechange',
      this.onIceConnectionStateChange
    );
    peerConnection.close();
  }

  /**
   * Flushes any pending candidates. This is dependent on remote description.
   * @protected
   */
  flushPendingCandidates() {
    let candidates = this.pendingCandidates.slice();
    this.pendingCandidates.length = 0;
    for(let pending of candidates) {
      this.peerConnection
        .addIceCandidate(pending)
        .then(() => debug('[CHANNEL]', 'Received candidate.'))
        .catch((e) => debug('[CHANNEL]', 'Failed to add candidate.', e));
    }
  }

  /**
   * @param {string} type
   * @param {RTCSessionDescription|RTCIceCandidate} sdp
   * @param {string} src
   * @param {string} dst
   */
  onSignalingResponse(type, sdp, src, dst) {}

  /**
   * @private
   * @param {MessageEvent} e
   */
  onDataChannelMessage(e) {
    debug('[CHANNEL]', 'Received message:', e.data);
    this.emit('data', e.data);
  }

  /**
   * @private
   */
  onDataChannelClose() {
    debug('[CHANNEL]', 'Close!');
    this.emit('close');
  }

  /**
   * @private
   */
  onDataChannelOpen() {
    debug('[CHANNEL]', 'Open!');
    resolvePromiseStatus(this.connectedStatus, this);
  }

  /**
   * @private
   * @param {Event} e
   */
  onDataChannelError(e) {
    debug('[CHANNEL]', 'Error!', e);
    this.emit('error', e);
  }

  /**
   * @private
   * @param {RTCPeerConnectionIceEvent} e
   */
  onIceCandidate(e) {
    if (!e.candidate) {
      debug('[CHANNEL]', 'ICE complete');
      this.signaling.sendSignalMessage(
        this.localId,
        this.remoteId,
        this.peerConnection.localDescription
      );
      // Wait for peer response...
    } else {
      this.signaling.sendCandidateMessage(
        this.localId,
        this.remoteId,
        e.candidate
      );
    }
  }

  /**
   * @private
   * @param {RTCPeerConnectionIceErrorEvent|Event} e
   */
  onIceCandidateError(e) {
    debug('[CHANNEL]', 'ICE Error!', e);
  }

  /**
   * @private
   * @param {Event} e
   */
  onIceConnectionStateChange(e) {
    const state = /** @type {RTCPeerConnection} */ (e.target)
      .iceConnectionState;
    switch (state) {
      case 'failed':
        throw new Error('Ice connection failed.');
      case 'closed':
        throw new Error('Ice connection closed.');
      default:
        // Progress along as usual...
        break;
    }
  }
}

export class PeerfulLocalConnection extends PeerfulConnection {
  /**
   * @param {string} id
   * @param {PeerJsSignaling} signaling
   * @param {object} [options]
   */
  constructor(id, signaling, options = undefined) {
    super(id, signaling, options);
  }

  /**
   * @param {string} remoteId
   */
  async connect(remoteId) {
    debug('[LOCAL]', 'Connecting to', remoteId, '...');
    let channelOptions;
    let offerOptions;

    this.remoteId = remoteId;

    // Create channel
    const channel = this.peerConnection.createDataChannel(
      'data',
      channelOptions
    );
    this.setDataChannel(channel);

    // Create offer
    const offer = await this.peerConnection.createOffer(offerOptions);
    await this.peerConnection.setLocalDescription(offer);

    // Wait for ICE to complete before sending offer...
    return createPromiseStatusPromise(this.connectedStatus);
  }

  /**
   * @override
   * @param {'answer'|'candidate'} type
   * @param {RTCSessionDescription|RTCIceCandidate} sdp
   * @param {string} src
   * @param {string} dst
   */
  onSignalingResponse(type, sdp, src, dst) {
    debug('[LOCAL]', 'Received signal', type, src, dst);
    if (type === 'answer') {
      const description = /** @type {RTCSessionDescription} */ (sdp);
      // Process answer
      this.peerConnection
        .setRemoteDescription(description)
        .then(() => this.flushPendingCandidates())
        .then(() => debug('[LOCAL]', 'Successfully set remote description.'))
        .catch((e) => debug('[LOCAL]', 'Failed to set remote description.', e));
      // Wait for channel to open...
    } else if (type === 'candidate') {
      const candidate = /** @type {RTCIceCandidate} */ (sdp);
      this.pendingCandidates.push(candidate);
      if (this.peerConnection.remoteDescription) {
        this.flushPendingCandidates();
      }
    } else {
      throw new Error(
        `Received invalid response type '${type}' on local connection.`
      );
    }
  }
}

export class PeerfulRemoteConnection extends PeerfulConnection {
  /**
   * @param {string} id
   * @param {PeerJsSignaling} signaling
   * @param {object} [options]
   */
  constructor(id, signaling, options = undefined) {
    super(id, signaling, options);

    this.onDataChannel = this.onDataChannel.bind(this);
  }

  async listen() {
    debug('[REMOTE]', 'Listening...');
    this.peerConnection.addEventListener('datachannel', this.onDataChannel);
    return createPromiseStatusPromise(this.connectedStatus);
  }

  /**
   * @protected
   * @param {RTCDataChannelEvent} e
   */
  onDataChannel(e) {
    debug('[REMOTE]', 'Received data channel');
    // Create channel
    const { channel } = e;
    this.setDataChannel(channel);
    // Wait for channel to open...
  }

  /**
   * @override
   * @param {'offer'|'candidate'} type
   * @param {RTCSessionDescription|RTCIceCandidate} sdp
   * @param {string} src
   * @param {string} dst
   */
  onSignalingResponse(type, sdp, src, dst) {
    debug('[REMOTE]', 'Received signal', type, src, dst);
    if (type === 'offer') {
      this.remoteId = src;
      const description = /** @type {RTCSessionDescription} */ (sdp);
      // Receive offer
      this.peerConnection
        .setRemoteDescription(description)
        .then(() => this.flushPendingCandidates())
        .then(() => this.peerConnection.createAnswer())
        .then((answer) => this.peerConnection.setLocalDescription(answer))
        .then(() =>
          debug('[REMOTE]', 'Successfully set remote/local description.')
        )
        .catch((e) =>
          debug('[REMOTE]', 'Failed to set remote/local description.', e)
        );
      // Wait for ICE to complete before sending answer...
    } else if (type === 'candidate') {
      const candidate = /** @type {RTCIceCandidate} */ (sdp);
      this.pendingCandidates.push(candidate);
      if (this.peerConnection.remoteDescription) {
        this.flushPendingCandidates();
      }
    } else {
      throw new Error(
        `Received invalid response type '${type}' on remote connection.`
      );
    }
  }
}
