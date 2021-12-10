import {
  deleteInventoryFromStore,
  getInventoryInStore,
  getInventoryStore,
  isInventoryInStore,
} from '../inventory/InventoryStore.js';
import { exportItemToJSON } from '../satchel/item/ItemLoader.js';

import { ActivityPlayerGift } from '../satchel/peer/ActivityPlayerGift.js';
import { ActivityPlayerList } from '../satchel/peer/ActivityPlayerList.js';
import { ActivityPlayerHandshake } from '../satchel/peer/ActivityPlayerHandshake.js';
import { ActivityPlayerInventory } from '../satchel/peer/ActivityPlayerInventory.js';
import { SatchelLocal } from '../satchel/peer/SatchelLocal.js';

/**
 * @typedef {import('../peerful/PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 * @typedef {import('../inventory/element/InventoryGridElement.js').InventoryGridElement} InventoryGridElement
 */

const ACTIVITY_REGISTRY = [
  ActivityPlayerInventory,
  ActivityPlayerHandshake,
  ActivityPlayerGift,
  ActivityPlayerList,
];

export class SatchelServer extends SatchelLocal {
  constructor(peerful) {
    super(peerful);

    // Load from local storage
    this.onAutoLoad();

    // Save to local storage every 5 seconds
    /** @private */
    this.onAutoSave = this.onAutoSave.bind(this);
    /** @private */
    this.autoSaveHandle = setInterval(this.onAutoSave, 5_000);
  }

  destroy() {
    clearInterval(this.autoSaveHandle);
    this.autoSaveHandle = null;
  }

  /** @private */
  onAutoLoad() {
    let serverData;
    try {
      serverData = JSON.parse(localStorage.getItem('server_data')) || {};
    } catch {
      serverData = {};
    }
    this.localData = serverData;
    console.log('Loading server data...', serverData);
  }

  /** @private */
  onAutoSave() {
    localStorage.setItem('server_data', JSON.stringify(this.localData));
  }

  /** @override */
  onRemoteConnected(remoteClient) {
    console.log('Remote connection established.');
    remoteClient.element = null;
    remoteClient.lastHeartbeat = 0;
    for(let activity of ACTIVITY_REGISTRY) {
      activity.onRemoteClientConnected(this, remoteClient);
    }
  }

  /** @override */
  onRemoteDisconnected(remoteClient) {
    const clientDataName = `remote_data#${remoteClient.name}`;
    try {
      let store = getInventoryStore();
      if (isInventoryInStore(store, clientDataName)) {
        let inv = getInventoryInStore(store, clientDataName);
        deleteInventoryFromStore(store, clientDataName, inv);
      }
      if (remoteClient.element) {
        let child = /** @type {InventoryGridElement} */ (remoteClient.element);
        child.parentElement.removeChild(child);
      }
    } catch (e) {
      console.error(`Failed to unload client inventory - ${e}`);
    }
  }

  /** @override */
  onRemoteMessage(remoteClient, type, data) {
    for(let activity of ACTIVITY_REGISTRY) {
      let result = activity.onRemoteClientMessage(this, remoteClient, type, data);
      if (result) {
        return;
      }
    }
    switch (type) {
      default:
        {
          console.error(`Found unknown message from client - ${data}`);
          let dataToSend = { type: 'error', message: 'Unknown message.' };
          let stringToSend = JSON.stringify(dataToSend);
          remoteClient.connection.send(stringToSend);
        }
        break;
    }
  }

  /** @override */
  onRemoteNanny(remote) {
    let now = performance.now();
    if (remote.lastHeartbeat <= 0) {
      return;
    }
    if (remote.connection.closed) {
      console.log('Closing connection since already closed.');
      return;
    }
    for(let activity of ACTIVITY_REGISTRY) {
      activity.onRemoteClientNanny(this, remote);
    }
    // Calculate heartbeat
    let delta = now - remote.lastHeartbeat;
    if (delta > 10_000) {
      console.log('Closing connection due to staleness.');
      remote.connection.close();
      return;
    }
  }

  getActiveClientNames() {
    return ActivityPlayerHandshake.getActiveClientNames(this);
  }

  getActiveClientByName(clientName) {
    return ActivityPlayerHandshake.getActiveClientByName(this, clientName);
  }

  sendItemTo(clientName, item) {
    const client = ActivityPlayerHandshake.getActiveClientByName(this, clientName);
    if (!client || !client.connection) {
      return false;
    }
    ActivityPlayerGift.sendPlayerItem(client, clientName, item);
  }
}

export class SatchelClient extends SatchelLocal {
  constructor(peerful) {
    super(peerful);

    this.remoteServer = null;
    this.localData = {};
    this.clientName = '';
  }

  destroy() {
    // Do nothing. No clean up needed.
  }

  /** @override */
  onRemoteConnected(remoteServer) {
    console.log('Local connection established.');
    remoteServer.data = null;
    this.remoteServer = remoteServer;
    for(let activity of ACTIVITY_REGISTRY) {
      activity.onRemoteServerConnected(this, remoteServer);
    }
  }

  /** @override */
  onRemoteDisconnected(remoteServer) {
    console.error('Local connection closed.');
    this.remoteServer = null;
    window.alert('Connection lost! Please refresh the browser and try again.');
  }

  /** @override */
  onRemoteMessage(remoteServer, type, data) {
    for(let activity of ACTIVITY_REGISTRY) {
      let result = activity.onRemoteServerMessage(this, remoteServer, type, data);
      if (result) {
        return;
      }
    }
    switch (type) {
      case 'error':
        window.alert(`Oops! Server error message: ${data.message}`);
        remoteServer.connection.close();
        break;
      default:
        console.error(`Found unknown message from server - ${data}`);
        break;
    }
  }

  /** @override */
  onRemoteNanny(remoteServer) {
    for(let activity of ACTIVITY_REGISTRY) {
      activity.onRemoteServerNanny(this, remoteServer);
    }
  }

  getOtherClientNames() {
    if (this.remoteServer) {
      return this.remoteServer.clientNames.filter((name) => name !== this.clientName);
    } else {
      return [];
    }
  }

  sendItemTo(clientName, item) {
    if (!this.remoteServer.clientNames.includes(clientName)) {
      return false;
    }
    console.log('Sending item to client...', clientName);
    let dataToSend = {
      type: 'gift',
      message: {
        from: this.clientName,
        target: clientName,
        item: exportItemToJSON(item),
      },
    };
    let stringToSend = JSON.stringify(dataToSend);
    this.remoteServer.connection.send(stringToSend);
    return true;
  }
}
