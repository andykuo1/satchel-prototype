import { uuid } from '../util/uuid.js';
import { Eventable } from '../util/Eventable.js';
import { PeerJsSignaling } from './PeerJsSignaling.js';
import {
  PeerfulLocalConnection,
  PeerfulRemoteConnection,
} from './PeerfulConnection.js';

/**
 * @typedef {import('./PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 * @typedef PeerfulEvents
 * @property {(connection: PeerfulConnection) => void} connect
 * @property {(error: Error) => void} error
 */

/**
 * @augments Eventable<PeerfulEvents>
 */
export class Peerful extends Eventable {
  /**
   * @param {string} id
   */
  constructor(id = uuid()) {
    super();

    this.id = id;

    /** @protected */
    this.closed = false;

    /** @type {Record<string, PeerfulConnection>} */
    this.connections = {};

    /** @private */
    this.onPeerfulLocalConnectionOpen =
      this.onPeerfulLocalConnectionOpen.bind(this);
    /** @private */
    this.onPeerfulRemoteConnectionOpen =
      this.onPeerfulRemoteConnectionOpen.bind(this);

    /** @private */
    this.onSignaling = this.onSignaling.bind(this);
    /** @private */
    this.signaling = new PeerJsSignaling(id, this.onSignaling);
    /** @private */
    this.signalingPromise = this.signaling.open();
  }

  close() {
    this.closed = true;
    const conns = Object.values(this.connections);
    this.connections = {};
    for (const conn of conns) {
      conn.close();
    }

    this.signaling.close();
  }

  /**
   * @param {string} remoteId
   */
  async connect(remoteId) {
    if (this.id === remoteId) {
      throw new Error('Cannot connect to peer with the same id.');
    }

    if (this.closed) {
      throw new Error('Cannot connect to peers when already closed.');
    }

    await this.signalingPromise;
    const conn = new PeerfulLocalConnection(this.id, this.signaling).open();
    this.connections[remoteId] = conn;
    try {
      await conn.connect(remoteId);
    } catch {
      delete this.connections[remoteId];
    }

    this.onPeerfulLocalConnectionOpen(conn);
    return this;
  }

  async listen() {
    if (this.closed) {
      throw new Error('Cannot listen for peers when already closed.');
    }

    await this.signalingPromise;
    return this;
  }

  /** 
   * @private 
   * @returns {PeerfulRemoteConnection}
   */
  resolveRemoteConnection(dst, force = false) {
    let conn = /** @type {PeerfulRemoteConnection} */ (this.connections[dst]);
    if (force || !conn) {
      conn = new PeerfulRemoteConnection(
        this.id,
        this.signaling
      ).open();
      this.connections[dst] = conn;
    }
    return conn;
  }

  /**
   * @private
   * @param {PeerfulLocalConnection} conn
   */
  onPeerfulLocalConnectionOpen(conn) {
    this.emit('connect', conn);
  }

  /**
   * @private
   * @param {PeerfulRemoteConnection} conn
   */
  onPeerfulRemoteConnectionOpen(conn) {
    this.emit('connect', conn);
  }

  /**
   * @private
   * @param {Error} error
   * @param {RTCSessionDescriptionInit|RTCIceCandidateInit} sdp
   * @param {string} src
   * @param {string} dst
   */
  onSignaling(error, sdp, src, dst) {
    if (error) {
      const conn = this.connections[dst] || this.connections[src];
      if (conn) {
        conn.close();
      }
      this.emit('error', error);
    } else {
      switch (sdp.type) {
        case 'offer':
          {
            const conn = this.resolveRemoteConnection(dst, true);
            conn.listen().then(this.onPeerfulRemoteConnectionOpen);
            const init = /** @type {RTCSessionDescriptionInit} */ (sdp);
            const description = new RTCSessionDescription(init);
            conn.onSignalingResponse('offer', description, src, dst);
          }
          break;
        case 'answer':
          {
            const conn = this.connections[src];
            if (!conn) {
              console.warn('Received signaling attempt when not listening.');
              return;
            }
            const init = /** @type {RTCSessionDescriptionInit} */ (sdp);
            const description = new RTCSessionDescription(init);
            conn.onSignalingResponse('answer', description, src, dst);
          }
          break;
        default:
          if ('candidate' in sdp) {
            const conn = this.resolveRemoteConnection(dst, false);
            const init = /** @type {RTCIceCandidateInit} */ (sdp);
            const candidate = new RTCIceCandidate(init);
            conn.onSignalingResponse('candidate', candidate, src, dst);
          } else {
            console.warn('Received unknown signal:', sdp);
          }
      }
    }
  }
}
