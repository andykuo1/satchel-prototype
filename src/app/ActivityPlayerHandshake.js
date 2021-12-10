import { ActivityBase } from './ActivityBase.js';
import { ActivityPlayerInventory } from './ActivityPlayerInventory.js';

export class ActivityPlayerHandshake extends ActivityBase {
  static get observedMessages() {
    return [
      'name'
    ];
  }

  /** @override */
  static onRemoteServerConnected(localClient, remoteServer) {
    let name;
    while (!name) {
      name = window.prompt('Who Art Thou? (cannot be changed yet, sry)');
      if (!name) {
        window.alert('Invalid name.');
      }
    }
    remoteServer.connection.send(JSON.stringify({ type: 'name', message: name }));
    localClient.clientName = name;
  }

  /** @override */
  static onRemoteClientMessage(localServer, remoteClient, messageType, messageData) {
    if (messageType !== 'name') {
      return false;
    }
    const conn = remoteClient.connection;
    const name = messageData.toLowerCase().replace(/\s/g, '_');
    if (!name) {
      let dataToSend = { type: 'error', message: 'Invalid user name.' };
      let stringToSend = JSON.stringify(dataToSend);
      conn.send(stringToSend);
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
