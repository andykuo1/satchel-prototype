import { ActivityBase } from './ActivityBase.js';
import { ActivityPlayerInventory } from './ActivityPlayerInventory.js';
import { SatchelLocal, SatchelRemote } from './SatchelLocal.js';

export class ActivityPlayerHandshake extends ActivityBase {
  static get observedMessages() {
    return [
      'name'
    ];
  }

  /**
   * @override
   * @param {SatchelLocal} localClient
   * @param {SatchelRemote} remoteServer
   */
  static onRemoteServerConnected(localClient, remoteServer) {
    let name;
    while (!name) {
      name = window.prompt('Who Art Thou? (cannot be changed yet, sry)');
      if (!name) {
        window.alert('Invalid name.');
      }
    }
    remoteServer.sendMessage('name', name);
    localClient.clientName = name;
  }

  /**
   * @override
   * @param {SatchelLocal} localServer
   * @param {SatchelRemote} remoteClient
   */
  static onRemoteClientMessage(localServer, remoteClient, messageType, messageData) {
    if (messageType !== 'name') {
      return false;
    }
    const name = messageData.toLowerCase().replace(/\s/g, '_');
    if (!name) {
      remoteClient.sendMessage('error', 'Invalid user name.');
      return;
    }
    console.log('Setting up client...', name);
    remoteClient.lastHeartbeat = performance.now();
    remoteClient.name = name;
    const clientDataName = `remote_data#${name}`;
    // Send to client their first data store
    ActivityPlayerInventory.sendPlayerReset(remoteClient, localServer.localData[clientDataName]);
    return true;
  }

  static getActiveClientNames(localServer) {
    return localServer.remotes.map((client) => client.name);
  }

  static getActiveClientByName(localServer, playerName) {
    for (let client of localServer.remotes) {
      if (client.name === playerName) {
        return client;
      }
    }
    return null;
  }
}
