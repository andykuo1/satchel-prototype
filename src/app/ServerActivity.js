import { Peerful } from '../peerful/Peerful.js';
import { Logger } from '../util/Logger.js';
import { createLocalServerActivityContext, createRemoteClientActivityContext } from './ActivityContext.js';

/**
 * @typedef {import('../peerful/PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 */

const LOGGER = new Logger('ServerActivity');

const REMOTE_NANNY_INTERVAL_MILLIS = 1_000;
const LOCAL_NANNY_INTERVAL_MILLIS = 1_000;

export class ServerActivity {
  constructor(localId) {
    this.peerful = new Peerful(localId);
    this.context = createLocalServerActivityContext(localId);

    this.localNannyHandle = null;
    this.remoteNannyHandles = {};

    this.onServerStart = this.onServerStart.bind(this);
    this.onServerStop = this.onServerStop.bind(this);
    this.onServerMessage = this.onServerMessage.bind(this);
    this.onServerLocalNanny = this.onServerLocalNanny.bind(this);
    this.onServerRemoteNanny = this.onServerRemoteNanny.bind(this);

    this.onPeerfulError = this.onPeerfulError.bind(this);
    this.onPeerfulConnect = this.onPeerfulConnect.bind(this);
    this.onPeerfulConnectionError = this.onPeerfulConnectionError.bind(this);
    this.onPeerfulClose = this.onPeerfulClose.bind(this);
    this.onPeerfulData = this.onPeerfulData.bind(this);

    this.peerful.on('error', this.onPeerfulError);
    this.peerful.on('connect', this.onPeerfulConnect);
  }

  /** @protected */
  destroy() {
    this.peerful.off('error', this.onPeerfulError);
    this.peerful.off('connect', this.onPeerfulConnect);

    if (this.context.remotes.length > 0) {
      for(let remote of this.context.remotes) {
        remote.connection.close();
      }
    }

    if (this.localNannyHandle) {
      clearInterval(this.localNannyHandle);
      this.localNannyHandle = null;
    }
  }

  async start() {
    try {
      await this.peerful.listen();
    } catch (e) {
      LOGGER.error(e);
      window.alert(e);
      return;
    }

    this.localNannyHandle = setInterval(this.onServerLocalNanny, LOCAL_NANNY_INTERVAL_MILLIS);
    LOGGER.info('Server started!');
  }

  close() {
    LOGGER.info('Closing server...');
    this.destroy();
    this.peerful.close();
  }

  getRemoteContextById(id) {
    for(let ctx of this.context.remotes) {
      if (ctx.id === id) {
        return ctx;
      }
    }
    return null;
  }

  /**
   * @param {PeerfulConnection} connection 
   */
  onPeerfulConnect(connection) {
    LOGGER.info('Connecting client...');
    let remoteContext = createRemoteClientActivityContext(connection.remoteId);
    remoteContext.connection = connection;
    let localContext = this.context;
    localContext.remotes.push(remoteContext);
    const remoteId = remoteContext.id;

    // Setup listeners
    connection.on('error', this.onPeerfulConnectionError);
    connection.on('close', this.onPeerfulClose);
    connection.on('data', this.onPeerfulData);

    // Start server
    this.onServerStart();

    // Start remote nanny
    this.remoteNannyHandles[remoteId] = setInterval(this.onServerRemoteNanny, REMOTE_NANNY_INTERVAL_MILLIS);

    LOGGER.info('Client connection established.');
  }

  onPeerfulError(error) {
    LOGGER.error(error);
    window.alert(`Oh no! Server failed! ${error}`);
  }

  onPeerfulConnectionError(error, connection) {
    LOGGER.error(connection, error);
    window.alert(`Oh no! Connection failed! ${connection} ${error}`);
    connection.close();
  }

  onPeerfulClose(connection) {
    LOGGER.info('Closing connection...');
    const remoteContext = this.getRemoteContextById(connection.remoteId);
    const remoteId = remoteContext.id;

    // Teardown listeners
    connection.off('error', this.onPeerfulConnectionError);
    connection.off('close', this.onPeerfulClose);
    connection.off('data', this.onPeerfulData);

    // Stop server
    this.onServerStop(remoteContext);

    // Stop remote nanny
    clearInterval(this.remoteNannyHandles[remoteId]);
    delete this.remoteNannyHandles[remoteId];

    LOGGER.info('Client connection closed.');
  }

  onPeerfulData(data, connection) {
    try {
      const { t, d } = JSON.parse(data);
      this.onServerMessage(t, d);
    } catch (e) {
      // Ignore the malformed message.
    }
  }
  
  onServerStart(remoteClient) {
  }
  onServerStop(remoteClient) {
  }
  onServerMessage(remoteClient, messageType, messageData) {
  }
  onServerLocalNanny(remoteClient) {
  }
  onServerRemoteNanny(remoteClient) {
  }
}

export class ClientActivity {
  onClientStart(remoteServer) {

  }
  onClientStop(remoteServer) {

  }
  onClientMessage(remoteServer, messageType, messageData) {

  }
  onClientLocalNanny(remoteServer) {

  }
  onClientRemoteNanny(remoteServer) {

  }
}
