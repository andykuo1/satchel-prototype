import { exportInventoryToJSON } from '../satchel/inv/InvLoader.js';
import {
  deleteInventoryFromStore,
  getInventoryInStore,
  getInventoryStore,
  isInventoryInStore,
} from '../inventory/InventoryStore.js';
import { getExistingInventory } from '../inventory/InventoryTransfer.js';
import { exportItemToJSON } from '../satchel/item/ItemLoader.js';

import { ActivityPlayerGift } from './ActivityPlayerGift.js';
import { ActivityPlayerList } from './ActivityPlayerList.js';
import { ActivityPlayerHandshake } from './ActivityPlayerHandshake.js';
import { ActivityPlayerInventory } from './ActivityPlayerInventory.js';
import { SatchelLocal } from './SatchelLocal.js';

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

    this.localData = {};

    this.onClientConnected = this.onClientConnected.bind(this);
    this.onClientDisconnected = this.onClientDisconnected.bind(this);
    this.onClientNanny = this.onClientNanny.bind(this);

    this.setup();
  }

  /** @override */
  onConnected(connection) {
    super.onConnected(connection);
    this.onClientConnected(connection);
  }

  /** @override */
  onDisconnected(connection) {
    super.onDisconnected(connection);
    this.onClientDisconnected(connection);
  }

  /** @override */
  onNanny(remote) {
    super.onNanny(remote);
    this.onClientNanny(remote);
  }

  /** @private */
  setup() {
    let serverData;
    try {
      serverData = JSON.parse(localStorage.getItem('server_data')) || {};
    } catch {
      serverData = {};
    }
    console.log('Loading server data...', serverData);
    this.localData = serverData;

    // Save to local storage every 5 seconds
    setInterval(() => {
      localStorage.setItem('server_data', JSON.stringify(this.localData));
    }, 5000);
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

  /**
   * @param {PeerfulConnection} conn
   */
  onClientConnected(conn) {
    console.log('Remote connection established.');
    let remoteClient = this.getRemoteByConnection(conn);
    remoteClient.element = null;
    remoteClient.lastHeartbeat = 0;
    for(let activity of ACTIVITY_REGISTRY) {
      activity.onRemoteClientConnected(this, remoteClient);
    }
    conn.on('data', (data) => {
      try {
        const { type, message } = JSON.parse(data);
        for(let activity of ACTIVITY_REGISTRY) {
          let result = activity.onRemoteClientMessage(this, remoteClient, type, message);
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
              conn.send(stringToSend);
            }
            break;
        }
      } catch (error) {
        console.error(`Found invalid message from client - ${data}`, error);
      }
    });
  }

  onClientNanny(client) {
    let now = performance.now();
    if (client.lastHeartbeat <= 0) {
      return;
    }
    if (client.connection.closed) {
      console.log('Closing connection since already closed.');
      this.onClientDisconnected(client.connection);
      return;
    }
    for(let activity of ACTIVITY_REGISTRY) {
      activity.onRemoteClientNanny(this, client);
    }
    // Calculate heartbeat
    let delta = now - client.lastHeartbeat;
    if (delta > 10_000) {
      console.log('Closing connection due to staleness.');
      client.connection.close();
      this.onClientDisconnected(client.connection);
    }
  }

  /**
   * @param {PeerfulConnection} conn
   */
  onClientDisconnected(conn) {
    const remote = this.getRemoteByConnection(conn);
    if (!remote) {
      return;
    }
    const clientDataName = `remote_data#${remote.name}`;
    try {
      let store = getInventoryStore();
      if (isInventoryInStore(store, clientDataName)) {
        let inv = getInventoryInStore(store, clientDataName);
        deleteInventoryFromStore(store, clientDataName, inv);
      }
      if (remote.element) {
        let child = /** @type {InventoryGridElement} */ (remote.element);
        child.parentElement.removeChild(child);
      }
    } catch (e) {
      console.error(`Failed to unload client inventory - ${e}`);
    }
  }
}

export class SatchelClient extends SatchelLocal {
  constructor(peerful) {
    super(peerful);

    this.remoteServer = null;
    this.localData = {};
    this.clientName = '';
  }

  /** @override */
  onConnected(connection) {
    super.onConnected(connection);
    this.onClientConnected(connection);
  }

  /** @override */
  onDisconnected(connection) {
    super.onDisconnected(connection);
    this.onClientDisconnected(connection);
  }

  /** @override */
  onNanny(remote) {
    super.onNanny(remote);
    this.onRemoteNanny(remote);
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

  /**
   * @private
   * @param {PeerfulConnection} conn
   */
  setup(conn) {
    // Send to server every 1 seconds
    setInterval(() => {
      const store = getInventoryStore();
      if (!isInventoryInStore(store, 'main')) {
        return;
      }
      const inv = getExistingInventory(store, 'main');
      const jsonData = exportInventoryToJSON(inv);
      const wrappedData = {
        type: 'sync',
        message: jsonData,
      };
      const stringToSend = JSON.stringify(wrappedData);
      conn.send(stringToSend);
    }, 1000);
  }

  /** @private */
  onRemoteNanny(remoteServer) {
    for(let activity of ACTIVITY_REGISTRY) {
      activity.onRemoteServerNanny(this, remoteServer);
    }
  }

  /**
   * @private
   * @param {PeerfulConnection} conn
   */
  onClientConnected(conn) {
    console.log('Local connection established.');
    const remoteServer = this.getRemoteByConnection(conn);
    remoteServer.data = null;
    this.remoteServer = remoteServer;
    for(let activity of ACTIVITY_REGISTRY) {
      activity.onRemoteServerConnected(this, remoteServer);
    }
    conn.on('data', (data) => {
      try {
        const { type, message } = JSON.parse(data);
        const remoteServer = this.remoteServer;
        for(let activity of ACTIVITY_REGISTRY) {
          let result = activity.onRemoteServerMessage(this, remoteServer, type, message);
          if (result) {
            return;
          }
        }
        switch (type) {
          case 'error':
            window.alert(`Oops! Server error message: ${data.message}`);
            conn.close();
            break;
          default:
            console.error(`Found unknown message from server - ${data}`);
            break;
        }
      } catch (e) {
        console.error('Found invalid message from server - ' + data, e);
      }
    });
    this.setup(conn);
  }

  /**
   * @private
   * @param {PeerfulConnection} conn
   */
  onClientDisconnected(conn) {
    console.error('Local connection closed.');
    this.remoteServer = null;
    window.alert('Connection lost! Please refresh the browser and try again.');
  }
}
