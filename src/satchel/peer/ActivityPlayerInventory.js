import { ActivityBase } from './ActivityBase.js';

import { getInventoryStore, isInventoryInStore, createGridInventoryInStore, addInventoryToStore, getInventoryInStore, deleteInventoryFromStore } from '../../inventory/InventoryStore.js';
import { getExistingInventory } from '../../inventory/InventoryTransfer.js';
import { createGridInventory } from '../../satchel/inv/Inv.js';
import { dispatchInventoryChange } from '../../satchel/inv/InvEvents.js';
import { exportInventoryToJSON, importInventoryFromJSON } from '../../satchel/inv/InvLoader.js';
import { SatchelLocal, SatchelRemote } from './SatchelLocal.js';
import { getPlayerLastHeartbeat, getPlayerName, hasPlayerHeartbeat, setPlayerLastHeartbeat } from './PlayerState.js';
import { loadFromStorage, saveToStorage } from '../../Storage.js';

/** @typedef {import('../../inventory/element/InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

function onAutoSave(localServer) {
  const serverData = ActivityPlayerInventory.getLocalServerData(localServer);
  saveToStorage('server_data', JSON.stringify(serverData));
}

export class ActivityPlayerInventory extends ActivityBase {
  static get observedMessages() {
    return ['reset', 'sync'];
  }

  /** @override */
  static onLocalServerCreated(localServer) {
    // Load server data from storage...
    let serverData;
    try {
      serverData = JSON.parse(loadFromStorage('server_data')) || {};
    } catch {
      serverData = {};
    }
    localServer.localData = serverData;
    console.log('Loading server data...', serverData);
    // Start saving server data to storage...
    localServer.autoSave = onAutoSave.bind(undefined, localServer);
    localServer.autoSaveHandle = setInterval(localServer.autoSave, 5_000);
  }

  /** @override */
  static onLocalServerDestroyed(localServer) {
    // Stop saving server data
    clearInterval(localServer.autoSaveHandle);
    localServer.autoSaveHandle = null;
    localServer.autoSave = null;
    // Reset server data
    localServer.localData = {};
  }

  /** @override */
  static onRemoteClientConnected(localServer, remoteClient) {
    remoteClient.element = null;
  }

  /** @override */
  static onRemoteClientDisconnected(localServer, remoteClient) {
    const remotePlayerName = getPlayerName(remoteClient);
    const clientDataName = `remote_data#${remotePlayerName}`;
    try {
      let store = getInventoryStore();
      if (isInventoryInStore(store, clientDataName)) {
        let inv = getInventoryInStore(store, clientDataName);
        deleteInventoryFromStore(store, clientDataName, inv);
      }
      if (remoteClient.element) {
        let child = /** @type {InventoryGridElement} */ (remoteClient.element);
        child.parentElement.removeChild(child);
        remoteClient.element = null;
      }
    } catch (e) {
      console.error(`Failed to unload client inventory - ${e}`);
    }
  }

  /** @override */
  static onRemoteServerConnected(localClient, remoteServer) {
    remoteServer.remoteData = {};
  }

  /** @override */
  static onRemoteServerMessage(localClient, remoteServer, messageType, messageData) {
    switch(messageType) {
      case 'reset':
        const serverData = messageData;
        remoteServer.remoteData = serverData;
        const store = getInventoryStore();
        const invId = 'main';
        if (!isInventoryInStore(store, invId)) {
          createGridInventoryInStore(store, invId, 12, 7);
        }
        let inv = getExistingInventory(store, invId);
        importInventoryFromJSON(serverData, inv);
        dispatchInventoryChange(store, invId);
        return true;
    }
    return false;
  }

  /**
   * @override
   * @param {SatchelLocal} localClient
   * @param {SatchelRemote} remoteServer
   */
  static onRemoteServerNanny(localClient, remoteServer) {
    const store = getInventoryStore();
    if (!isInventoryInStore(store, 'main')) {
      return;
    }
    const inv = getExistingInventory(store, 'main');
    const jsonData = exportInventoryToJSON(inv);
    remoteServer.sendMessage('sync', jsonData);
  }

  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   * @param {number} now
   */
  static onRemoteClientNanny(local, remote, now) {
    if (!hasPlayerHeartbeat(remote)) {
      return;
    }
    const lastHeartbeat = getPlayerLastHeartbeat(remote);
    let delta = now - lastHeartbeat;
    if (delta > 10_000) {
      console.log('Closing connection due to staleness.');
      remote.connection.close();
    }
  }

  /**
   * @override
   * @param {SatchelLocal} localServer
   * @param {SatchelRemote} remoteClient
   */
  static onRemoteClientMessage(localServer, remoteClient, messageType, messageData) {
    switch(messageType) {
      case 'sync':
        const remotePlayerName = getPlayerName(remoteClient);
        if (!remotePlayerName) {
          throw new Error('Missing remote player name.');
        }
        console.log('Syncing client...', remotePlayerName);
        const now = performance.now();
        setPlayerLastHeartbeat(remoteClient, now);
        // Update server's copy of client data
        const clientDataName = `remote_data#${remotePlayerName}`;
        const clientData = messageData;
        localServer.localData[clientDataName] = clientData;
        let store = getInventoryStore();
        try {
          if (!isInventoryInStore(store, clientDataName)) {
            let inv = importInventoryFromJSON(clientData);
            // Override id
            inv.invId = clientDataName;
            addInventoryToStore(store, clientDataName, inv);
            let element = /** @type {InventoryGridElement} */ (
              document.createElement('inventory-grid')
            );
            element.id = clientDataName;
            element.invId = clientDataName;
            remoteClient.element = element;
            document.querySelector('#remoteWorkspace').appendChild(element);
          } else {
            let inv = getInventoryInStore(store, clientDataName);
            importInventoryFromJSON(clientData, inv);
            // Override id
            inv.invId = clientDataName;
            dispatchInventoryChange(store, clientDataName);
          }
        } catch (e) {
          console.error(`Failed to load client inventory - ${e}`);
        }
        return true;
    }
    return false;
  }

  /**
   * @param {SatchelRemote} remoteClient 
   * @param {object} invData 
   */
  static sendPlayerReset(remoteClient, invData) {
    if (!invData) {
      // Create a new inventory for a new user
      let inv = createGridInventory('main', 12, 7);
      const remotePlayerName = getPlayerName(remoteClient);
      inv.displayName = remotePlayerName.toUpperCase();
      let jsonData = exportInventoryToJSON(inv);
      invData = jsonData;
    }
    remoteClient.sendMessage('reset', invData);
  }

  static resetLocalServerData(localServer, serverData) {
    localServer.localData = serverData;
  }
  
  static getLocalServerData(localServer) {
    return localServer.localData;
  }
}
