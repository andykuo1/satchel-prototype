import { ActivityBase } from './ActivityBase.js';

import { getInventoryStore, isInventoryInStore, createGridInventoryInStore, addInventoryToStore, getInventoryInStore } from '../../inventory/InventoryStore.js';
import { getExistingInventory } from '../../inventory/InventoryTransfer.js';
import { createGridInventory } from '../../satchel/inv/Inv.js';
import { dispatchInventoryChange } from '../../satchel/inv/InvEvents.js';
import { exportInventoryToJSON, importInventoryFromJSON } from '../../satchel/inv/InvLoader.js';
import { SatchelLocal, SatchelRemote } from './SatchelLocal.js';

/** @typedef {import('../../inventory/element/InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

export class ActivityPlayerInventory extends ActivityBase {
  static get observedMessages() {
    return ['reset', 'sync'];
  }

  /** @override */
  static onRemoteServerMessage(localClient, remoteServer, messageType, messageData) {
    switch(messageType) {
      case 'reset':
        const serverData = messageData;
        remoteServer.data = serverData;
        const store = getInventoryStore();
        if (!isInventoryInStore(store, 'main')) {
          createGridInventoryInStore(store, 'main', 12, 9);
        }
        let inv = getExistingInventory(store, 'main');
        importInventoryFromJSON(serverData, inv);
        dispatchInventoryChange(store, inv.invId);
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
   * @param {SatchelLocal} localServer
   * @param {SatchelRemote} remoteClient
   */
  static onRemoteClientMessage(localServer, remoteClient, messageType, messageData) {
    switch(messageType) {
      case 'sync':
        const name = remoteClient.name;
        if (!name) {
          remoteClient.sendMessage('error', 'Not yet signed in.');
          return;
        }
        console.log('Syncing client...', name);
        remoteClient.lastHeartbeat = performance.now(); // TODO: Disconnect if heartbeat is too much
        // Update server's copy of client data
        const clientDataName = `remote_data#${remoteClient.name}`;
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
      let inv = createGridInventory('main', 12, 9);
      inv.displayName = remoteClient.name.toUpperCase();
      let jsonData = exportInventoryToJSON(inv);
      invData = jsonData;
    }
    remoteClient.sendMessage('reset', invData);
  }
}
