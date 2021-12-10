import { uuid } from '../util/uuid.js';

/**
 * @typedef {import('../peerful/Peerful.js').Peerful} Peerful
 * @typedef {import('../peerful/PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 */

export class SatchelLocal {
  /**
   * @param {Peerful} peerful 
   */
  constructor(peerful) {
    this.peerful = peerful;
    this.remotes = [];

    this.onConnected = this.onConnected.bind(this);
    this.onDisconnected = this.onDisconnected.bind(this);
    this.onError = this.onError.bind(this);
    this.onNanny = this.onNanny.bind(this);
    
    /** @private */
    this.onInterval = this.onInterval.bind(this);
    /** @private */
    this.interval = setInterval(this.onInterval, 1_000);

    // Setup peerful
    peerful.on('connect', this.onConnected);
  }

  destroy() {
    clearInterval(this.interval);
    this.interval = null;

    // Teardown peerful
    this.peerful.off('connect', this.onConnected);
  }

  /**
   * @protected
   * @param {PeerfulConnection} connection
   */
  onConnected(connection) {
    let newRemote = new SatchelRemote(connection, uuid());
    connection.on('error', this.onError);
    connection.on('close', this.onDisconnected);
    this.remotes.push(newRemote);
  }

  /**
   * @protected
   * @param {PeerfulConnection} connection
   */
  onDisconnected(connection) {
    connection.off('error', this.onError);
    connection.off('close', this.onDisconnected);
    let remote = this.getRemoteByConnection(connection);
    let i = this.remotes.indexOf(remote);
    if (remote && i >= 0) {
      this.remotes.splice(i, 1);
    } else {
      console.error(`Unable to disconnect unknown connection - ${connection.localId}:${connection.remoteId}`);
    }
  }

  /**
   * @protected
   * @param {Error} error
   * @param {PeerfulConnection} connection
   */
  onError(error, connection) {
    console.error(`Oh no! Connection errored: ${error}`);
    connection.close();
  }

  /**
   * @protected
   * @param {SatchelRemote} remote 
   */
  onNanny(remote) {
  }

  /** @private */
  onInterval() {
    for(let remote of this.remotes) {
      this.onNanny(remote);
    }
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
}

export class SatchelRemote {
  constructor(connection, name) {
    this.connection = connection;
    this.name = name;
  }
}
