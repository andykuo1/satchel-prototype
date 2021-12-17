/**
 * @typedef {import('../../peerful/PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 */

/**
 * 
 * @typedef LocalClient
 * @property {Array<RemoteServer>} remotes
 * 
 * @typedef LocalServer
 * @property {Array<RemoteClient>} remotes
 * 
 * @typedef RemoteClient
 * @property {PeerfulConnection} connection
 * 
 * @typedef RemoteServer
 * @property {PeerfulConnection} connection
 */
export class ActivityBase {
  /**
   * @abstract
   * @param {LocalServer} localServer
   */
  static onLocalServerCreated(localServer) {}
  /**
   * @abstract
   * @param {LocalClient} localClient
   */
  static onLocalClientCreated(localClient) {}
  
  /**
   * @abstract
   * @param {LocalServer} localServer
   */
  static onLocalServerDestroyed(localServer) {}
  /**
   * @abstract
   * @param {LocalClient} localClient
   */
  static onLocalClientDestroyed(localClient) {}

  /**
   * @abstract
   * @param {LocalClient} localClient 
   * @param {RemoteServer} remoteServer 
   */
  static onRemoteServerConnected(localClient, remoteServer) {}
  /**
   * @abstract
   * @param {LocalServer} localServer 
   * @param {RemoteClient} remoteClient 
   */
  static onRemoteClientConnected(localServer, remoteClient) {}

  /**
   * @abstract
   * @param {LocalClient} localClient 
   * @param {RemoteServer} remoteServer 
   */
  static onRemoteServerDisconnected(localClient, remoteServer) {}
  /**
   * @abstract
   * @param {LocalServer} localServer 
   * @param {RemoteClient} remoteClient 
   */
  static onRemoteClientDisconnected(localServer, remoteClient) {}
  
  /**
   * @abstract
   * @param {LocalClient} localClient 
   * @param {RemoteServer} remoteServer 
   * @param {string} messageType
   * @param {object} messageData
   * @returns {boolean}
   */
  static onRemoteServerMessage(localClient, remoteServer, messageType, messageData) {
    return false;
  }
  /**
   * @abstract
   * @param {LocalServer} localServer 
   * @param {RemoteClient} remoteClient 
   * @param {string} messageType
   * @param {object} messageData
   * @returns {boolean}
   */
  static onRemoteClientMessage(localServer, remoteClient, messageType, messageData) {
    return false;
  }

  /**
   * @abstract
   * @param {LocalClient} localClient 
   * @param {RemoteServer} remoteServer 
   * @param {number} now
   */
  static onRemoteServerNanny(localClient, remoteServer, now) {}
  /**
   * @abstract
   * @param {LocalServer} localServer 
   * @param {RemoteClient} remoteClient 
   * @param {number} now
   */
  static onRemoteClientNanny(localServer, remoteClient, now) {}
}