import {
  createPromiseStatus,
  createPromiseStatusPromise,
  isPromiseStatusPending,
  rejectPromiseStatus,
  resolvePromiseStatus,
} from './PromiseStatus.js';
import { debug } from './PeerfulUtil.js';

/**
 * @typedef {(error: Error|null, data: object|null, src?: string, dst?: string) => void} PeerJsSignalingHandler
 */

export const PeerJsSignalingErrorCode = {
  UNKNOWN: -1,
  ERROR: 1,
  ID_TAKEN: 2,
  INVALID_KEY: 3,
  LEAVE: 4,
  EXPIRE: 5,
};

export class PeerJsSignalingError extends Error {
  /**
   * @param {number} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);

    this.code = code;
  }
}

/**
 * @typedef PeerJsSignalingOptions
 * @property {string} protocol
 * @property {string} host
 * @property {string} path
 * @property {number} port
 * @property {string} key
 * @property {number} pingIntervalMillis
 */

/** @type {PeerJsSignalingOptions} */
const DEFAULT_OPTS = {
  protocol: 'wss',
  host: '0.peerjs.com',
  path: '/',
  port: 443,
  key: 'peerjs',
  pingIntervalMillis: 5000,
};

export class PeerJsSignaling {
  /**
   * @param {string} id
   * @param {PeerJsSignalingHandler} callback
   * @param {PeerJsSignalingOptions} [options]
   * @param options
   */
  constructor(id, callback, options = undefined) {
    options = {
      ...DEFAULT_OPTS,
      ...options,
    };
    /** @private */
    this.callback = callback;
    /** @private */
    this.webSocket = null;
    /** @private */
    this.closed = false;
    /** @private */
    this.opened = false;
    /** @private */
    this.id = id;
    /** @private */
    this.token = randomToken();
    /** @private */
    this.baseUrl = buildPeerJsSignalingUrl(
      options.protocol,
      options.host,
      options.port,
      options.path,
      options.key
    );
    /** @private */
    this.pingHandle = null;
    /** @private */
    this.pingInterval = options.pingIntervalMillis;
    /** @private */
    this.activeStatus = createPromiseStatus();

    /** @private */
    this.onSocketMessage = this.onSocketMessage.bind(this);
    /** @private */
    this.onSocketOpened = this.onSocketOpened.bind(this);
    /** @private */
    this.onSocketClosed = this.onSocketClosed.bind(this);
    /** @private */
    this.onHeartbeatTimeout = this.onHeartbeatTimeout.bind(this);
  }

  /**
   * @returns {Promise<PeerJsSignaling>}
   */
  async open() {
    debug('[SIGNAL]', 'Opening signaling socket...');
    if (this.closed) {
      throw new Error('Cannot open already closed connection to peerjs server.');
    }

    if (this.opened) {
      throw new Error('Already opened connection to peerjs server.');
    }

    if (isPromiseStatusPending(this.activeStatus)) {
      throw new Error('Already trying to open connection to peerjs server.');
    }

    const url = `${this.baseUrl}&id=${this.id}&token=${this.token}`;
    const webSocket = new WebSocket(url);
    this.webSocket = webSocket;

    webSocket.addEventListener('message', this.onSocketMessage);
    webSocket.addEventListener('close', this.onSocketClosed);
    webSocket.addEventListener('open', this.onSocketOpened);

    return createPromiseStatusPromise(this.activeStatus);
  }

  /** @private */
  onSocketOpened() {
    debug('[SOCKET]', 'Open!');
    if (this.closed) {
      return;
    }

    this.scheduleHeartbeat();
  }

  /**
   * @private
   * @param {MessageEvent<?>} e
   */
  onSocketMessage(e) {
    debug('[SOCKET]', 'Received message:', e.data);
    if (this.closed) {
      return;
    }

    let data;
    try {
      data = JSON.parse(e.data);
    } catch (error) {
      this.callback(new Error(`Invalid signaling message from peerjs server: ${error.data}`), null);
      return;
    }

    const { type, payload, src, dst } = data;
    switch (type) {
      case 'OPEN':
        if (!this.opened) {
          this.opened = true;
          resolvePromiseStatus(this.activeStatus, this);
        }
        break;
      case 'ERROR':
        this.callback(
          new PeerJsSignalingError(PeerJsSignalingErrorCode.ERROR, JSON.stringify(payload)),
          null
        );
        break;
      case 'ID-TAKEN':
        this.callback(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.ID_TAKEN,
            'The requested signaling id is unavailable.'
          ),
          null
        );
        break;
      case 'INVALID-KEY':
        this.callback(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.INVALID_KEY,
            'The given signaling api key is invalid.'
          ),
          null
        );
        break;
      case 'LEAVE':
        this.callback(
          new PeerJsSignalingError(PeerJsSignalingErrorCode.LEAVE, 'Signaling connection left.'),
          null
        );
        break;
      case 'EXPIRE':
        this.callback(
          new PeerJsSignalingError(PeerJsSignalingErrorCode.EXPIRE, 'Signaling connection expired.'),
          null
        );
        break;
      case 'OFFER':
        this.callback(undefined, payload, src, dst);
        break;
      case 'ANSWER':
        this.callback(undefined, payload, src, dst);
        break;
      case 'CANDIDATE':
        this.callback(undefined, payload, src, dst);
        break;
      default:
        this.callback(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.UNKNOWN,
            `Unknown signaling message from peerjs server: ${JSON.stringify(data)}`
          ),
          null
        );
    }
  }

  /** @private */
  onSocketClosed() {
    debug('[SOCKET]', 'Close!');
    if (this.closed) {
      return;
    }

    this.destroy();
    this.closed = true;
    this.callback(new Error('Signaling connection closed unexpectedly to peerjs server.'), null);
  }

  /**
   *
   * @param {string} src
   * @param {string} dst
   * @param {RTCIceCandidate} candidate
   */
  sendCandidateMessage(src, dst, candidate) {
    debug('[SIGNAL]', 'Sending candidate from', src, 'to', dst);
    if (this.closed) {
      return;
    }

    if (!isWebSocketOpen(this.webSocket)) {
      this.callback(new Error('Cannot send candidate message to un-opened connection.'), null);
      return;
    }

    const message = JSON.stringify({
      type: 'CANDIDATE',
      payload: candidate,
      dst,
    });
    this.webSocket.send(message);
  }

  /**
   * @param {string} src
   * @param {string} dst
   * @param {RTCSessionDescriptionInit} signal
   */
  sendSignalMessage(src, dst, signal) {
    const { type } = signal;
    debug('[SIGNAL]', 'Sending', type, 'from', src, 'to', dst);
    if (this.closed) {
      return;
    }

    if (!isWebSocketOpen(this.webSocket)) {
      this.callback(new Error('Cannot send signaling message to un-opened connection.'), null);
      return;
    }

    let message;
    switch (type) {
      case 'offer':
        message = JSON.stringify({
          type: 'OFFER',
          payload: signal,
          dst,
        });
        break;
      case 'answer':
        message = JSON.stringify({
          type: 'ANSWER',
          payload: signal,
          dst,
        });
        break;
      case 'pranswer':
        // TODO: What is this?
        break;
      case 'rollback':
        // TODO: What is this?
        break;
      default:
      // TODO: Unknown signal type?
    }

    this.webSocket.send(message);
  }

  sendHeartbeatMessage() {
    debug('[SIGNAL]', 'Sending heartbeat');
    if (this.closed) {
      return;
    }

    if (!isWebSocketOpen(this.webSocket)) {
      this.callback(new Error('Cannot send signaling heartbeat to un-opened connection.'), null);
      return;
    }

    const message = JSON.stringify({ type: 'HEARTBEAT' });
    this.webSocket.send(message);
  }

  close() {
    if (this.closed) {
      return;
    }

    this.destroy();
    this.closed = true;
  }

  /** @private */
  scheduleHeartbeat() {
    if (!this.pingHandle) {
      this.pingHandle = setTimeout(this.onHeartbeatTimeout, this.pingInterval);
    }
  }

  /** @private */
  onHeartbeatTimeout() {
    if (this.closed || !isWebSocketOpen(this.webSocket)) {
      return;
    }

    const { pingHandle } = this;
    if (pingHandle) {
      clearTimeout(pingHandle);
      this.pingHandle = null;
    }

    this.sendHeartbeatMessage();
    this.scheduleHeartbeat();
  }

  /** @private */
  destroy() {
    const { webSocket } = this;
    if (!webSocket) {
      webSocket.removeEventListener('open', this.onSocketOpened);
      webSocket.removeEventListener('close', this.onSocketClosed);
      webSocket.removeEventListener('message', this.onSocketMessage);
      webSocket.close();
      // Refresh token for the re-connection
      this.token = randomToken();
      this.webSocket = null;
    }

    const { pingHandle } = this;
    if (pingHandle) {
      clearTimeout(pingHandle);
      this.pingHandle = null;
    }

    const { activeStatus } = this;
    if (isPromiseStatusPending(activeStatus)) {
      rejectPromiseStatus(activeStatus, new Error('Signaling connection closed.'));
    }

    this.opened = false;
  }
}

/** @param {WebSocket} webSocket */
function isWebSocketOpen(webSocket) {
  return webSocket && webSocket.readyState === 1;
}

/**
 * @param {string} protocol
 * @param {string} host
 * @param {number} port
 * @param {string} path
 * @param {string} key
 */
function buildPeerJsSignalingUrl(protocol, host, port, path, key) {
  return `${protocol}://${host}:${port}${path}peerjs?key=${key}`;
}

/**
 *
 */
function randomToken() {
  return Math.random().toString(36).slice(2);
}
