import { uuid } from '../../util/uuid.js';

/**
 * @typedef {import('../../peerful/Peerful.js').Peerful} Peerful
 * @typedef {import('../../peerful/PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 */

export class SatchelLocal {
  /**
   * @param {Peerful} peerful 
   */
  constructor(peerful) {
    this.peerful = peerful;
    this.remotes = [];

    /** @private */
    this.onConnected = this.onConnected.bind(this);
    /** @private */
    this.onDisconnected = this.onDisconnected.bind(this);
    /** @private */
    this.onError = this.onError.bind(this);
    /** @private */
    this.onMessage = this.onMessage.bind(this);
    
    /** @private */
    this.onInterval = this.onInterval.bind(this);
    /** @private */
    this.intervalHandle = setInterval(this.onInterval, 1_000);

    // Setup peerful
    peerful.on('connect', this.onConnected);
  }

  destroy() {
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;

    // Teardown peerful
    this.peerful.off('connect', this.onConnected);
  }

  /** @protected */
  getRemoteByConnection(connection) {
    for (let i = 0; i < this.remotes.length; ++i) {
      let remote = this.remotes[i];
      if (remote.connection === connection) {
        return remote;
      }
    }
    return null;
  }

  /**
   * @protected
   * @abstract
   * @param {SatchelRemote} remote
   */
  onRemoteConnected(remote) {}
  /**
   * @protected
   * @abstract
   * @param {SatchelRemote} remote
   */
  onRemoteDisconnected(remote) {}
  /**
   * @protected
   * @abstract
   * @param {SatchelRemote} remote
   * @param {string} type
   * @param {object} data
   */
  onRemoteMessage(remote, type, data) {}
  /**
   * @protected
   * @abstract
   * @param {SatchelRemote} remote
   */
  onRemoteNanny(remote) {}

  /**
   * @private
   * @param {PeerfulConnection} connection
   */
  onConnected(connection) {
    const remote = new SatchelRemote(connection, uuid());
    connection.on('error', this.onError);
    connection.on('close', this.onDisconnected);
    connection.on('data', this.onMessage);
    this.remotes.push(remote);
    this.onRemoteConnected(remote);
  }

  /**
   * @private
   * @param {PeerfulConnection} connection
   */
  onDisconnected(connection) {
    connection.off('error', this.onError);
    connection.off('close', this.onDisconnected);
    connection.off('data', this.onMessage);
    const remote = this.getRemoteByConnection(connection);
    let i = this.remotes.indexOf(remote);
    if (remote && i >= 0) {
      this.remotes.splice(i, 1);
      this.onRemoteDisconnected(remote);
    } else {
      console.error(`Unable to disconnect unknown connection - ${connection.localId}:${connection.remoteId}`);
    }
  }

  /**
   * @private
   * @param {Error} error
   * @param {PeerfulConnection} connection
   */
  onError(error, connection) {
    console.error(`Oh no! Connection errored: ${error}`);
    connection.close();
  }

  /**
   * @private
   * @param {object} data
   * @param {PeerfulConnection} connection
   */
  onMessage(data, connection) {
    try {
      const remote = this.getRemoteByConnection(connection);
      if (remote) {
        const { type, message } = JSON.parse(data);
        this.onRemoteMessage(remote, type, message);
      }
    } catch (e) {
      console.error(`Could not process remote message - ${data}`, e);
    }
  }

  /** @private */
  onInterval() {
    for(let remote of this.remotes) {
      this.onRemoteNanny(remote);
    }
  }
}

export class SatchelRemote {
  constructor(connection, name) {
    this.connection = connection;
    this.name = name;
  }
}
