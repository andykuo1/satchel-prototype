import { ActivityBase } from './ActivityBase.js';
import { ActivityPlayerHandshake } from './ActivityPlayerHandshake.js';
import { getPlayerName } from './PlayerState.js';

/**
 * @typedef {import('../app/PeerSatchel.js').SatchelServer} SatchelServer
 * @typedef {import('../app/PeerSatchel.js').SatchelClient} SatchelClient
 * @typedef {import('./SatchelLocal.js').SatchelRemote} SatchelRemote
 */

export class ActivityPlayerList extends ActivityBase {
  static get observedMessages() {
    return [
      'clients'
    ];
  }

  /** @override */
  static onRemoteServerConnected(localClient, remoteServer) {
    remoteServer.clientNames = [];
  }

  /** @override */
  static onRemoteServerMessage(localClient, remoteServer, messageType, messageData) {
    if (messageType !== 'clients') {
      return false;
    }
    remoteServer.clientNames = [...messageData];
    return true;
  }

  /** @override */
  static onRemoteClientNanny(localServer, remoteClient) {
    this.sendPlayerList(localServer, remoteClient);
  }

  /**
   * @param {SatchelServer} localServer 
   * @returns {Array<string>}
   */
  static getPlayerNameListOnServer(localServer) {
    return ActivityPlayerHandshake.getActiveClientNames(localServer).filter(name => name.length > 0);
  }

  /**
   * @param {SatchelClient} localClient 
   * @returns {Array<string>}
   */
  static getPlayerNameListOnClient(localClient) {
    const localPlayerName = getPlayerName(localClient);
    return localClient.remoteServer.clientNames.filter(name => name !== localPlayerName);
  }
  
  /**
   * @param {SatchelServer} localServer 
   * @param {SatchelRemote} remoteClient 
   */
  static sendPlayerList(localServer, remoteClient) {
    const validClientNames = this.getPlayerNameListOnServer(localServer);
    remoteClient.sendMessage('clients', validClientNames);
  }
}
