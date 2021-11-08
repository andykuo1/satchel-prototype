import { Eventable } from '../util/Eventable.js';
import {
  createPromiseStatus,
  createPromiseStatusPromise,
  rejectPromiseStatus,
  resolvePromiseStatus,
} from './PromiseStatus.js';

import {
  debug,
  DEFAULT_ICE_SERVERS,
  FILTER_TRICKLE_SDP_PATTERN,
} from './PeerfulUtil.js';
import { PeerfulNegotiator } from './PeerfulNegotiator.js';

/** @typedef {import('./PeerJsSignaling.js').PeerJsSignaling} PeerJsSignaling */

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
      trickle: false,
      ...(options || {})
    };

    /** @protected */
    this.trickle = options.trickle;

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
     * @type {PeerfulNegotiator}
     */
    this.negotiator = null;
    /**
     * @protected
     * @type {RTCDataChannel}
     */
    this.dataChannel = null;

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
    this.peerConnection = new RTCPeerConnection({
      iceServers: DEFAULT_ICE_SERVERS,
      ...(options || {}),
    });
    this.negotiator = new PeerfulNegotiator(this.signaling, this.localId, this.peerConnection, this.trickle);
    return this;
  }

  close() {
    if (this.closed) {
      throw new Error('Cannot close already closed connection.');
    }

    this.closed = true;
    this.opened = false;
    if (this.connectedStatus) {
      rejectPromiseStatus(this.connectedStatus, new Error('Connection closed.'));
      this.connectedStatus = null;
    }
    if (this.dataChannel) {
      this.setDataChannel(null);
    }
    if (this.negotiator) {
      this.negotiator.destroy();
      this.negotiator = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
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

    this.remoteId = remoteId;

    // Create channel
    const channel = this.peerConnection.createDataChannel(
      'data',
      channelOptions
    );
    this.setDataChannel(channel);

    // Send offer
    await this.performOffer();
    // Wait to be connected...
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
        .then(() => this.negotiator.onRemoteDescription(this.remoteId))
        .then(() => debug('[LOCAL]', 'Successfully set remote description.'))
        .catch((e) => debug('[LOCAL]', 'Failed to set remote description.', e));
      // Wait for channel to open...
    } else if (type === 'candidate') {
      const candidate = /** @type {RTCIceCandidate} */ (sdp);
      this.negotiator.addCandidate(candidate);
    } else {
      throw new Error(
        `Received invalid response type '${type}' on local connection.`
      );
    }
  }

  /**
   * @private
   * @param {RTCOfferOptions} [options]
   */
  async performOffer(options = undefined) {
    // Create offer
    debug('[LOCAL]', 'Creating offer...');
    const offer = await this.peerConnection.createOffer(options);
    await this.peerConnection.setLocalDescription(offer);
    if (this.trickle) {
      debug('[LOCAL]', 'Trickling ICE...');
      // Just negotiate in the background...
      this.negotiator.negotiate();
    } else {
      debug('[LOCAL]', 'Waiting for ICE to complete...');
      // Remove trickle request from sdp
      offer.sdp = offer.sdp.replace(FILTER_TRICKLE_SDP_PATTERN, '');
      // Wait for negotiation
      await this.negotiator.negotiate();
    }
    // Send offer
    debug('[LOCAL]', 'Sending offer...');
    this.signaling.sendSignalMessage(this.localId, this.remoteId, this.peerConnection.localDescription || offer);
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
    this.setDataChannel(e.channel);
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
        .then(() => this.negotiator.onRemoteDescription(this.remoteId))
        .then(() =>
          debug('[REMOTE]', 'Successfully set remote description from offer.')
        )
        .catch((e) =>
          debug('[REMOTE]', 'Failed to set remote description from offer.', e)
        )
        .then(() => {
          // Send answer
          this.performAnswer();
          // Wait to be connected...
          return createPromiseStatusPromise(this.connectedStatus);
        });
    } else if (type === 'candidate') {
      const candidate = /** @type {RTCIceCandidate} */ (sdp);
      this.negotiator.addCandidate(candidate);
    } else {
      throw new Error(
        `Received invalid response type '${type}' on remote connection.`
      );
    }
  }

  /**
   * @private
   * @param {RTCOfferAnswerOptions} [options]
   */
  async performAnswer(options = undefined) {
    // Create answer
    debug('[REMOTE]', 'Creating answer...');
    const answer = await this.peerConnection.createAnswer(options);
    await this.peerConnection.setLocalDescription(answer);
    if (this.trickle) {
      debug('[REMOTE]', 'Trickling ICE...');
      // Just negotiate in the background...
      this.negotiator.negotiate();
    } else {
      debug('[REMOTE]', 'Waiting for ICE to complete...');
      // Remove trickle request from sdp
      answer.sdp = answer.sdp.replace(FILTER_TRICKLE_SDP_PATTERN, '');
      // Wait for negotiation
      await this.negotiator.negotiate();
    }
    // Send answer
    debug('[REMOTE]', 'Sending answer...');
    this.signaling.sendSignalMessage(this.localId, this.remoteId, this.peerConnection.localDescription || answer);
  }
}
