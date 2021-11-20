import { dropOnGround } from '../inventory/GroundHelper.js';
import { createGridInventory } from '../inventory/Inv.js';
import { exportItemToJSON, importItemFromJSON, loadInventoryFromJSON, saveInventoryToJSON } from '../inventory/InventoryLoader.js';
import {
  addInventoryToStore,
  createGridInventoryInStore,
  deleteInventoryFromStore,
  dispatchInventoryChange,
  getInventoryInStore,
  getInventoryStore,
  isInventoryInStore,
} from '../inventory/InventoryStore.js';
import { getExistingInventory } from '../inventory/InventoryTransfer.js';
import { copyItem } from '../inventory/Item.js';

/**
 * @typedef {import('../peerful/PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 * @typedef {import('../inventory/element/InventoryGridElement.js').InventoryGridElement} InventoryGridElement
 */

export class SatchelServer {
  constructor() {
    this.remoteClients = [];
    this.localData = {};

    this.onClientConnected = this.onClientConnected.bind(this);
    this.onClientDisconnected = this.onClientDisconnected.bind(this);

    this.setup();
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
    return this.remoteClients.map(client => client.name);
  }

  getActiveClientByName(clientName) {
    for(let client of this.remoteClients) {
      if (client.name === clientName) {
        return client;
      }
    }
    return null;
  }

  sendItemTo(clientName, item) {
    let client = this.getActiveClientByName(clientName);
    if (!client || !client.connection) {
      return false;
    }
    console.log('Sending item to client...', clientName);
    let dataToSend = { type: 'gift', message: exportItemToJSON(item) };
    let stringToSend = JSON.stringify(dataToSend);
    client.connection.send(stringToSend);
    return true;
  }

  /**
   * @param {PeerfulConnection} conn 
   */
  onClientConnected(conn) {
    console.log('Remote connection established.');
    let remoteClient = {
      connection: conn,
      name: '',
      element: null,
    };
    this.remoteClients.push(remoteClient);
    conn.on('data', data => {
      try {
        const jsonData = JSON.parse(data);
        switch (jsonData.type) {
          case 'name': {
            const name = jsonData.message.toLowerCase().replace(/\s/g, '_');
            if (!name) {
              let dataToSend = { type: 'error', message: 'Invalid user name.' };
              let stringToSend = JSON.stringify(dataToSend);
              conn.send(stringToSend);
              return;
            }
            remoteClient.name = name;
            console.log('Setting up client...', name);
            const clientDataName = `remote_data#${name}`;
            // Send to client their first data store
            let dataToSend;
            if (clientDataName in this.localData) {
              dataToSend = this.localData[clientDataName];
            } else {
              // Create a new slate for a new user
              let inv = createGridInventory('main', 12, 9);
              inv.displayName = name.toUpperCase();
              let jsonData = saveInventoryToJSON(inv, {});
              dataToSend = jsonData;
            }
            let stringToSend = JSON.stringify({
              type: 'reset',
              message: dataToSend,
            });
            conn.send(stringToSend);
          } break;
          case 'sync': {
            const name = remoteClient.name;
            if (!name) {
              let dataToSend = { type: 'error', message: 'Not yet signed in.' };
              let stringToSend = JSON.stringify(dataToSend);
              conn.send(stringToSend);
              return;
            }
            console.log('Syncing client...', name);
            // Update server's copy of client data
            const clientDataName = `remote_data#${remoteClient.name}`;
            const clientData = jsonData.message;
            this.localData[clientDataName] = clientData;
            let store = getInventoryStore();
            try {
              if (!isInventoryInStore(store, clientDataName)) {
                let inv = loadInventoryFromJSON(clientData);
                // Override id
                inv.invId = clientDataName;
                addInventoryToStore(store, clientDataName, inv);
                let element = /** @type {InventoryGridElement} */ (document.createElement('inventory-grid'));
                element.id = clientDataName;
                element.invId = clientDataName;
                remoteClient.element = element;
                document.querySelector('#workspace').appendChild(element);
              } else {
                let inv = getInventoryInStore(store, clientDataName);
                loadInventoryFromJSON(clientData, inv);
                // Override id
                inv.invId = clientDataName;
                dispatchInventoryChange(store, clientDataName);
              }
            } catch (e) {
              console.error(`Failed to load client inventory - ${e}`);
            }
          } break;
          default: {
            console.error(`Found unknown message from client - ${data}`);
            let dataToSend = { type: 'error', message: 'Unknown message.' };
            let stringToSend = JSON.stringify(dataToSend);
            conn.send(stringToSend);
          } break;
        }
      } catch (error) {
        console.error(`Found invalid message from client - ${data}`, error);
      }
    });
  }

  /**
   * @param {PeerfulConnection} conn 
   */
  onClientDisconnected(conn) {
    let flag = false;
    for(let i = 0; i < this.remoteClients.length; ++i) {
      let client = this.remoteClients[i];
      if (client.connection === conn) {
        console.log('Disconnecting client...', client.name);
        this.remoteClients.splice(i, 1);
        const clientDataName = `remote_data#${client.name}`;
        try {
          let store = getInventoryStore();
          if (isInventoryInStore(store, clientDataName)) {
            let inv = getInventoryInStore(store, clientDataName);
            deleteInventoryFromStore(store, clientDataName, inv);
          }
          if (client.element) {
            let child = /** @type {InventoryGridElement} */ (client.element);
            child.parentElement.removeChild(child);
          }
        } catch (e) {
          console.error(`Failed to unload client inventory - ${e}`);
        }
        flag = true;
        break;
      }
    }
    if (!flag) {
      console.error(`Unable to disconnect unknown connection - ${conn.localId}:${conn.remoteId}`);
    }
  }
}

export class SatchelClient {
  constructor() {
    this.remoteServer = null;
    this.localData = {};

    this.onClientConnected = this.onClientConnected.bind(this);
    this.onClientDisconnected = this.onClientDisconnected.bind(this);
  }

  /**
   * @private
   * @param {PeerfulConnection} conn 
   */
  setup(conn) {
    let name;
    while (!name) {
      name = window.prompt('Who Art Thou? (cannot be changed yet, sry)');
      if (!name) {
        window.alert('Invalid name.');
      }
    }

    conn.send(
      JSON.stringify({
        type: 'name',
        message: name,
      })
    );

    // Send to server every 1 seconds
    setInterval(() => {
      const store = getInventoryStore();
      if (!isInventoryInStore(store, 'main')) {
        return;
      }
      const inv = getExistingInventory(store, 'main');
      const jsonData = saveInventoryToJSON(inv, {});
      const wrappedData = {
        type: 'sync',
        message: jsonData,
      };
      const stringToSend = JSON.stringify(wrappedData);
      conn.send(stringToSend);
    }, 1000);
  }

  /**
   * @param {PeerfulConnection} conn 
   */
  onClientConnected(conn) {
    console.log('Local connection established.');
    this.remoteServer = {
      connection: conn,
      data: null,
    };
    conn.on('data', data => {
      try {
        const jsonData = JSON.parse(data);
        switch (jsonData.type) {
          case 'reset': {
            this.remoteServer.data = jsonData.message;
            const store = getInventoryStore();
            if (!isInventoryInStore(store, 'main')) {
              createGridInventoryInStore(getInventoryStore(), 'main', 12, 9);
            }
            let inv = getExistingInventory(getInventoryStore(), 'main');
            loadInventoryFromJSON(jsonData.message, inv);
            dispatchInventoryChange(store, inv.invId);
          } break;
          case 'gift': {
            let item = importItemFromJSON(jsonData.message);
            dropOnGround(item);
            window.alert('You received a gift! Remember to pick it up before closing the browser!');
          } break;
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
   * @param {PeerfulConnection} conn 
   */
  onClientDisconnected(conn) {
    this.remoteServer = null;
    window.alert('Connection lost! Please refresh the browser and try again.');
  }
}
