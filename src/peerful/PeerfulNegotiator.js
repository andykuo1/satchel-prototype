import { Eventable } from '../util/Eventable.js';
import {
  createPromiseStatus,
  resolvePromiseStatus,
  rejectPromiseStatus,
  createPromiseStatusPromise,
} from './PromiseStatus.js';
import { debug } from './PeerfulUtil.js';

/** @typedef {import('./PeerJsSignaling.js').PeerJsSignaling} PeerJsSignaling */

/**
 * @typedef PeerfulNegotiatorEvents
 * @property {() => void} ready
 * @property {(error: Error) => void} error
 */

/**
 * @augments Eventable<PeerfulNegotiatorEvents>
 */
export class PeerfulNegotiator extends Eventable {
  /**
   * @param {PeerJsSignaling} signaling
   * @param {string} localId
   * @param {RTCPeerConnection} peerConnection
   * @param {number} timeout
   */
  constructor(signaling, localId, peerConnection, timeout = 5_000) {
    super();

    /** @private */
    this.signaling = signaling;
    /** @private */
    this.peerConnection = peerConnection;
    /** @private */
    this.localId = localId;
    /** @private */
    this.remoteId = null;
    /** @private */
    this.timeout = timeout;

    /**
     * @protected
     * @type {Array<RTCIceCandidate>}
     */
    this.pendingCandidates = [];

    /** @private */
    this.completed = false;
    /** @private */
    this.iceStatus = createPromiseStatus();
    /** @private */
    this.iceTimeoutHandle = null;

    /** @private */
    this.onIceTimeout = this.onIceTimeout.bind(this);

    /** @private */
    this.onIceCandidate = this.onIceCandidate.bind(this);
    /** @private */
    this.onIceCandidateError = this.onIceCandidateError.bind(this);
    /** @private */
    this.onIceConnectionStateChange = this.onIceConnectionStateChange.bind(this);
    /** @private */
    this.onIceGatheringStateChange = this.onIceGatheringStateChange.bind(this);
    /** @private */
    this.onSignalingStateChange = this.onSignalingStateChange.bind(this);

    peerConnection.addEventListener('icecandidate', this.onIceCandidate);
    peerConnection.addEventListener('icecandidateerror', this.onIceCandidateError);
    peerConnection.addEventListener('iceconnectionstatechange', this.onIceConnectionStateChange);
    peerConnection.addEventListener('icegatheringstatechange', this.onIceGatheringStateChange);
    peerConnection.addEventListener('signalingstatechange', this.onSignalingStateChange);
  }

  destroy() {
    if (this.iceTimeoutHandle) {
      clearTimeout(this.iceTimeoutHandle);
      this.iceTimeoutHandle = null;
    }
    this.pendingCandidates.length = 0;
    let peerConnection = this.peerConnection;
    peerConnection.removeEventListener('icecandidate', this.onIceCandidate);
    peerConnection.removeEventListener('icecandidateerror', this.onIceCandidateError);
    peerConnection.removeEventListener('iceconnectionstatechange', this.onIceConnectionStateChange);
    peerConnection.removeEventListener('icegatheringstatechange', this.onIceGatheringStateChange);
    peerConnection.removeEventListener('signalingstatechange', this.onSignalingStateChange);
    this.peerConnection = null;
    if (!this.completed) {
      this.completed = true;
      rejectPromiseStatus(this.iceStatus, new Error('Negotiator closed.'));
    }
    this.clearEventListeners();
  }

  async negotiate() {
    if (!this.completed) {
      return createPromiseStatusPromise(this.iceStatus);
    }
  }

  /**
   * @param {RTCIceCandidate} candidate
   */
  addCandidate(candidate) {
    this.pendingCandidates.push(candidate);
    if (this.remoteId && this.peerConnection.remoteDescription) {
      this.onRemoteDescription(this.remoteId);
    }
  }

  /**
   * Called to flush pending candidates to be considered for connection once remote description is available.
   * @param {string} remoteId
   */
  onRemoteDescription(remoteId) {
    if (this.completed) {
      return;
    } else if (this.remoteId && this.remoteId !== remoteId) {
      debug('[NEGOTIATOR]', 'Already negotiating connection with another remote id.');
      return;
    }

    this.remoteId = remoteId;

    let candidates = this.pendingCandidates.slice();
    this.pendingCandidates.length = 0;

    for (let pending of candidates) {
      this.peerConnection
        .addIceCandidate(pending)
        .then(() => debug('[NEGOTIATOR]', 'Received candidate.'))
        .catch((e) => debug('[NEGOTIATOR]', 'Failed to add candidate.', e));
    }
  }

  /** @private */
  onIceComplete() {
    debug('[NEGOTIATOR]', 'Completed ICE candidate negotiation.');
    this.completed = true;
    resolvePromiseStatus(this.iceStatus, undefined);
  }

  /** @private */
  onIceTimeout() {
    if (!this.completed) {
      debug('[NEGOTIATOR]', 'Timed out negotiation for ICE candidates.');
      this.onIceComplete();
    }
  }

  /** @private */
  onIceGatheringStateChange() {
    let connectionState = this.peerConnection.iceConnectionState;
    let gatheringState = this.peerConnection.iceGatheringState;
    debug('[NEGOTIATOR] ICE connection:', connectionState, ', gathering:', gatheringState);
  }

  /** @private */
  onSignalingStateChange() {
    let signalingState = this.peerConnection.signalingState;
    debug('[NEGOTIATOR]', 'ICE signaling:', signalingState);
  }

  /**
   * @private
   * @param {RTCPeerConnectionIceEvent} e
   */
  onIceCandidate(e) {
    if (!e.candidate) {
      debug('[NEGOTIATOR]', 'End of ICE candidates.');
      if (!this.completed) {
        this.onIceComplete();
      }
    } else {
      debug('[NEGOTIATOR]', 'Sending an ICE candidate.');
      this.signaling.sendCandidateMessage(this.localId, this.remoteId, e.candidate);
      // Start ice timeout if not yet started
      if (!this.iceTimeoutHandle) {
        this.iceTimeoutHandle = setTimeout(this.onIceTimeout, this.timeout);
      }
    }
  }

  /**
   * @private
   * @param {RTCPeerConnectionIceErrorEvent|Event} e
   */
  onIceCandidateError(e) {
    debug('[NEGOTIATOR]', 'ICE error!', e);
  }

  /**
   * @private
   * @param {Event} e
   */
  onIceConnectionStateChange(e) {
    const conn = /** @type {RTCPeerConnection} */ (e.target);
    let connectionState = conn.iceConnectionState;
    switch (connectionState) {
      case 'checking':
        debug('[NEGOTIATOR]', 'ICE checking...');
        break;
      case 'connected':
        debug('[NEGOTIATOR]', 'ICE connected!');
        this.emit('ready');
        break;
      case 'completed':
        debug('[NEGOTIATOR]', 'ICE completed!');
        this.emit('ready');
        break;
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
