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
    /** @type {Array<SatchelRemote} */
    this.remotes = [];
    this.detail = {};

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
    const remote = new SatchelRemote(connection);
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
   * @param {object} message
   * @param {PeerfulConnection} connection
   */
  onMessage(message, connection) {
    try {
      const remote = this.getRemoteByConnection(connection);
      if (remote) {
        const { type, data } = JSON.parse(message);
        this.onRemoteMessage(remote, type, data);
      }
    } catch (e) {
      console.error(`Could not process remote message - ${message}`, e);
    }
  }

  /** @private */
  onInterval() {
    for (let remote of this.remotes) {
      this.onRemoteNanny(remote);
    }
  }
}

export class SatchelRemote {
  /**
   * @param {PeerfulConnection} connection
   */
  constructor(connection) {
    this.connection = connection;
    this.detail = {};
    /** @private */
    this.pending = {};
  }

  /**
   * @param {string} type
   * @param {object} data
   */
  sendMessage(type, data) {
    this.connection.send(JSON.stringify({ type, data }));
  }

  /**
   * @param {string} type
   * @param {number} timeout
   */
  async awaitMessage(type, timeout = 10_000) {
    return new Promise((resolve, reject) => {
      const pending = {
        resolve,
        reject,
        done: false,
      };
      if (type in this.pending) {
        this.pending[type].push(pending);
      } else {
        this.pending[type] = [pending];
      }
      setTimeout(() => {
        if (!pending.done) {
          pending.done = true;
          pending.reject(new Error('Timeout reached for message response.'));
        }
      }, timeout);
    });
  }

  /**
   * @param {string} type
   * @param {object} data
   * @returns {boolean}
   */
  handleMessage(type, data) {
    let flag = false;
    if (type in this.pending) {
      const pendings = this.pending[type];
      delete this.pending[type];
      for (let pending of pendings) {
        if (!pending.done) {
          pending.done = true;
          pending.resolve(data);
          flag = true;
        }
      }
    }
    return flag;
  }
}
