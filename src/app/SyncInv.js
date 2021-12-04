import { addInventoryToStore, getInventoryInStore, getInventoryStore, isInventoryInStore } from '../inventory/InventoryStore.js';
import { getExistingInventory } from '../inventory/InventoryTransfer.js';
import { dispatchInventoryChange } from '../satchel/inv/InvEvents.js';
import { exportInventoryToJSON, importInventoryFromJSON } from '../satchel/inv/InvLoader.js';

export function onClientHeartbeatSync(store, conn) {
  const targetInvId = 'main';
  if (!isInventoryInStore(store, targetInvId)) {
    return;
  }
  const inv = getExistingInventory(store, 'main');
  const invData = exportInventoryToJSON(inv);
  sendClientSync(conn, invData);
}

function sendClientSync(conn, invData) {
  conn.send(JSON.stringify({
    type: 'sync',
    message: invData,
  }));
}

export function onServerMessageSync(localServer, remoteClient, message) {
  const name = remoteClient.name;
  const conn = remoteClient.connection;
  if (!name) {
    let dataToSend = { type: 'error', message: 'Not yet signed in.' };
    let stringToSend = JSON.stringify(dataToSend);
    conn.send(stringToSend);
    return;
  }
  console.log('Syncing client...', name);
  remoteClient.lastHeartbeat = performance.now(); // TODO: Disconnect if heartbeat is too much
  // Update server's copy of client data
  const clientDataName = `remote_data#${remoteClient.name}`;
  const clientData = message;
  localServer.localData[clientDataName] = clientData;
  try {
    const store = getInventoryStore();
    if (!isInventoryInStore(store, clientDataName)) {
      let inv = importInventoryFromJSON(clientData);
      // Override id
      inv.invId = clientDataName;
      addInventoryToStore(store, clientDataName, inv);
      let element = /** @type {import('../inventory/element/InventoryGridElement.js').InventoryGridElement} */ (
        document.createElement('inventory-grid')
      );
      element.id = clientDataName;
      element.invId = clientDataName;
      remoteClient.element = element;
      localServer.remoteElements[clientDataName] = element;
      document.querySelector('#workspace').appendChild(element);
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
}
