import { Logger } from '../util/Logger.js';

/**
 * @typedef {(error: Error|null, data: object|null, src?: string, dst?: string) => void} PeerJsSignalingHandler
 */

const LOGGER = new Logger('PeerJsSignaling');

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
 * @property {number} heartbeatTimeoutMillis
 * @property {number} connectionTimeoutMillis
 */

/** @type {PeerJsSignalingOptions} */
const DEFAULT_OPTS = {
  protocol: 'wss',
  host: '0.peerjs.com',
  path: '/',
  port: 443,
  key: 'peerjs',
  heartbeatTimeoutMillis: 1_000,
  connectionTimeoutMillis: 10_000,
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
    this.token = null;
    /** @private */
    this.baseUrl = buildPeerJsSignalingUrl(
      options.protocol,
      options.host,
      options.port,
      options.path,
      options.key
    );
    /** @private */
    this.heartbeatTimeoutHandle = null;
    /** @private */
    this.heartbeatTimeoutMillis = options.heartbeatTimeoutMillis;
    /** @private */
    this.heartbeatTimeoutAttempts = 0;

    /** @private */
    this.awaitPendings = [];
    /** @private */
    this.connectionTimeoutHandle = null;
    /** @private */
    this.connectionTimeoutMillis = options.connectionTimeoutMillis;

    /** @private */
    this.onSocketMessage = this.onSocketMessage.bind(this);
    /** @private */
    this.onSocketOpened = this.onSocketOpened.bind(this);
    /** @private */
    this.onSocketClosed = this.onSocketClosed.bind(this);
    /** @private */
    this.onSocketError = this.onSocketError.bind(this);

    /** @private */
    this.onHeartbeatTimeout = this.onHeartbeatTimeout.bind(this);
    /** @private */
    this.onConnectionTimeout = this.onConnectionTimeout.bind(this);
  }

  isActive() {
    return this.opened && !this.closed;
  }

  /**
   * @returns {Promise<PeerJsSignaling>}
   */
  async open() {
    return new Promise((resolve, reject) => {
      if (this.opened) {
        resolve(this);
        return;
      }
      if (this.closed) {
        reject(new Error('Cannot re-open already closed peerjs signaling connection.'));
        return;
      }
      const isPending = this.awaitPendings.length > 0;
      this.awaitPendings.push({ resolve, reject });
      if (isPending) {
        // Waiting...
        return;
      }
      LOGGER.debug('Opening signaling socket...');
      const token = randomToken();
      const url = `${this.baseUrl}&id=${this.id}&token=${token}`;
      const webSocket = new WebSocket(url);
      this.webSocket = webSocket;
      this.token = token;
      webSocket.addEventListener('message', this.onSocketMessage);
      webSocket.addEventListener('close', this.onSocketClosed);
      webSocket.addEventListener('open', this.onSocketOpened);
      webSocket.addEventListener('error', this.onSocketError);
      this.connectionTimeoutHandle = setTimeout(this.onConnectionTimeout, this.connectionTimeoutMillis);
    });
  }

  close() {
    if (this.closed) {
      return;
    }
    LOGGER.info('Signaling socket closed!');
    this.closed = true;

    const webSocket = this.webSocket;
    this.webSocket = null;
    if (!webSocket) {
      webSocket.removeEventListener('open', this.onSocketOpened);
      webSocket.removeEventListener('close', this.onSocketClosed);
      webSocket.removeEventListener('message', this.onSocketMessage);
      webSocket.removeEventListener('error', this.onSocketError);
      webSocket.close();
      this.token = null;
    }

    const heartbeatTimeoutHandle = this.heartbeatTimeoutHandle;
    this.heartbeatTimeoutHandle = null;
    if (heartbeatTimeoutHandle) {
      clearTimeout(heartbeatTimeoutHandle);
    }

    const connectionTimeoutHandle = this.connectionTimeoutHandle;
    this.connectionTimeoutHandle = null;
    if (connectionTimeoutHandle) {
      clearTimeout(connectionTimeoutHandle);
    }

    const awaitPendings = this.awaitPendings;
    this.awaitPendings = [];
    for(let pending of awaitPendings) {
      pending.reject(new Error('Signaling connection closed.'));
    }
    
    this.opened = false;
  }

  /** @private */
  error(err, forceClose = false) {
    if (this.closed) {
      LOGGER.warn('Ignoring error when already closed.', err);
      return;
    } else {
      LOGGER.error('Encountered error.', err);
    }
    if (this.opened) {
      this.callback(err, null);
    }
    if (forceClose || !this.opened) {
      this.close();
    }
  }

  /** @private */
  onConnectionTimeout() {
    const connectionTimeoutHandle = this.connectionTimeoutHandle;
    this.connectionTimeoutHandle = null;
    if (connectionTimeoutHandle) {
      clearTimeout(connectionTimeoutHandle);
    }
    if (this.opened || this.closed) {
      return;
    }
    LOGGER.error('Signaling socket connection timed out.');
    this.close();
  }

  /** @private */
  onSocketError(e) {
    this.error(new Error(`Signaling socket connection could not open web socket for ${e.target.url}`), true);
  }

  /** @private */
  onSocketOpened() {
    if (this.closed) {
      return;
    }
    LOGGER.debug('Signaling socket connection established.');
    this.heartbeatTimeoutAttempts = 0;
    this.scheduleHeartbeat();
  }

  /**
   * @private
   * @param {MessageEvent<?>} e
   */
  onSocketMessage(e) {
    if (this.closed) {
      return;
    }

    LOGGER.debug('Signaling socket received message:', e.data);
    let data;
    try {
      data = JSON.parse(e.data);
    } catch (error) {
      this.error(new Error(`Invalid signaling message from peerjs server: ${error.data}`));
      return;
    }

    const { type, payload, src, dst } = data;
    switch (type) {
      case 'OPEN':
        if (!this.opened) {
          LOGGER.info('Signaling socket opened!');
          this.opened = true;
          const awaitPendings = this.awaitPendings;
          this.awaitPendings = [];
          for(let pending of awaitPendings) {
            pending.resolve(this);
          }
        }
        break;
      case 'ERROR':
        this.error(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.ERROR, JSON.stringify(payload)));
        break;
      case 'ID-TAKEN':
        this.error(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.ID_TAKEN,
            'The requested signaling id is unavailable.'));
        break;
      case 'INVALID-KEY':
        this.error(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.INVALID_KEY,
            'The given signaling api key is invalid.'));
        break;
      case 'LEAVE':
        this.error(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.LEAVE,
            'Signaling connection left.'));
        break;
      case 'EXPIRE':
        this.error(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.EXPIRE,
            'Signaling connection expired.'));
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
        this.error(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.UNKNOWN,
            `Unknown signaling message from peerjs server: ${JSON.stringify(data)}`));
        break;
    }
  }

  /** @private */
  onSocketClosed() {
    if (this.closed) {
      return;
    }
    LOGGER.debug('Signaling socket closed!');
    this.closed = true;
    if (this.opened) {
      this.callback(new Error('Signaling socket connection closed unexpectedly to peerjs.'), null);
    }
    this.close();
  }

  /**
   * @param {string} src
   * @param {string} dst
   * @param {RTCIceCandidate} candidate
   */
  sendCandidateMessage(src, dst, candidate) {
    LOGGER.debug(`Sending candidate from ${src} to ${dst}...`);
    if (this.closed) {
      return;
    }
    const webSocket = this.webSocket;
    if (!isWebSocketOpen(webSocket)) {
      throw new Error('Cannot send candidate message to un-opened connection.');
    }
    const message = JSON.stringify({
      type: 'CANDIDATE',
      payload: candidate,
      dst,
    });
    webSocket.send(message);
  }

  /**
   * @param {string} src
   * @param {string} dst
   * @param {RTCSessionDescriptionInit} signal
   */
  sendSignalMessage(src, dst, signal) {
    if (this.closed) {
      return;
    }

    const { type } = signal;
    const webSocket = this.webSocket;
    LOGGER.debug(`Sending signal ${type} from ${src} to ${dst}...`);
    if (!isWebSocketOpen(webSocket)) {
      throw new Error('Cannot send signaling message to un-opened connection.');
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
        throw new Error(`Cannot send unknown signal type '${type}'.`);
    }
    webSocket.send(message);
  }

  sendHeartbeatMessage() {
    if (this.closed) {
      return;
    }
    const webSocket = this.webSocket;
    if (!isWebSocketOpen(webSocket)) {
      throw new Error('Cannot send signaling heartbeat to un-opened connection.');
    }
    const message = JSON.stringify({ type: 'HEARTBEAT' });
    webSocket.send(message);
  }

  /** @private */
  scheduleHeartbeat() {
    if (this.closed) {
      return;
    }
    if (this.heartbeatTimeoutHandle) {
      return;
    }
    this.heartbeatTimeoutHandle = setTimeout(this.onHeartbeatTimeout, this.heartbeatTimeoutMillis);
  }

  /** @private */
  onHeartbeatTimeout() {
    const heartbeatTimeoutHandle = this.heartbeatTimeoutHandle;
    this.heartbeatTimeoutHandle = null;
    if (heartbeatTimeoutHandle) {
      clearTimeout(heartbeatTimeoutHandle);
    }

    if (this.closed) {
      return;
    }
    
    LOGGER.debug('Sending heartbeat...');
    try {
      if (isWebSocketOpen(this.webSocket)) {
        this.sendHeartbeatMessage();
      } else if (this.opened) {
        throw new Error('Web socket is closed but connection is still opened!');
      }
    } catch (e) {
      this.error(new Error('Could not send heartbeat to peerjs server.'), true);
      return;
    }
    this.scheduleHeartbeat();
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
 * @returns {string}
 */
function randomToken() {
  return Math.random().toString(36).slice(2);
}
