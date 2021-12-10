import { ActivityBase } from './ActivityBase.js';
import { SatchelLocal, SatchelRemote } from './SatchelLocal.js';

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
   * @param {SatchelLocal} localServer 
   * @param {SatchelRemote} remoteClient 
   */
  static sendPlayerList(localServer, remoteClient) {
    let clientNames = localServer.remotes.map((client) => client.name).filter((name) => name.length > 0);
    remoteClient.sendMessage('clients', clientNames);
  }
}
