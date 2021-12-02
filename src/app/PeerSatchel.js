import { dropOnGround } from '../inventory/GroundHelper.js';
import { createGridInventory } from '../inventory/Inv.js';
import { exportInventoryToJSON, importInventoryFromJSON } from '../inventory/InventoryLoader.js';
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
import { exportItemToJSON, importItemFromJSON } from '../inventory/ItemLoader.js';

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
    this.onClientNanny = this.onClientNanny.bind(this);

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
    let dataToSend = { type: 'gift', message: { from: '', target: clientName, item: exportItemToJSON(item) } };
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
      lastHeartbeat: 0,
      nannyInterval: null,
    };
    this.remoteClients.push(remoteClient);
    let clientNames = this.remoteClients.map(client => client.name).filter(name => name.length > 0);
    for(let client of this.remoteClients) {
      client.connection.send(JSON.stringify({ type: 'clients', message: clientNames }))
    }
    remoteClient.nannyInterval = setInterval(() => this.onClientNanny(remoteClient), 1000);
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
            console.log('Setting up client...', name);
            remoteClient.lastHeartbeat = performance.now();
            remoteClient.name = name;
            const clientDataName = `remote_data#${name}`;
            // Send to client their first data store
            let dataToSend;
            if (clientDataName in this.localData) {
              dataToSend = this.localData[clientDataName];
            } else {
              // Create a new slate for a new user
              let inv = createGridInventory('main', 12, 9);
              inv.displayName = name.toUpperCase();
              let jsonData = exportInventoryToJSON(inv);
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
            remoteClient.lastHeartbeat = performance.now(); // TODO: Disconnect if heartbeat is too much
            // Update server's copy of client data
            const clientDataName = `remote_data#${remoteClient.name}`;
            const clientData = jsonData.message;
            this.localData[clientDataName] = clientData;
            let store = getInventoryStore();
            try {
              if (!isInventoryInStore(store, clientDataName)) {
                let inv = importInventoryFromJSON(clientData);
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
                importInventoryFromJSON(clientData, inv);
                // Override id
                inv.invId = clientDataName;
                dispatchInventoryChange(store, clientDataName);
              }
            } catch (e) {
              console.error(`Failed to load client inventory - ${e}`);
            }
          } break;
          case 'gift': {
            const target = jsonData.message.target;
            let client = this.getActiveClientByName(target);
            if (client) {
              // Forward the request to the target client.
              client.connection.send(JSON.stringify(jsonData));
            } else {
              conn.send(JSON.stringify({ type: 'giftnak' }));
            }
          } break;
          case 'giftack': {
            const from = jsonData.message.from;
            if (from) {
              let client = this.getActiveClientByName(from);
              if (client) {
                // Forward the request to the source client.
                client.connection.send(JSON.stringify(jsonData));
              } else {
                // Consume this request.
              }
            } else {
              // This is a server gift.
              let { target } = jsonData.message;
              window.alert(`Gift sent to ${target}!`);
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

  onClientNanny(client) {
    let now = performance.now();
    if (client.lastHeartbeat <= 0) {
      return;
    }
    let delta = now - client.lastHeartbeat;
    console.log(delta);
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
    let flag = false;
    for(let i = 0; i < this.remoteClients.length; ++i) {
      let client = this.remoteClients[i];
      if (client.connection === conn) {
        console.log('Disconnecting client...', client.name);
        this.remoteClients.splice(i, 1);
        clearInterval(client.nannyInterval);
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
    let clientNames = this.remoteClients.map(client => client.name).filter(name => name.length > 0);
    for(let client of this.remoteClients) {
      client.connection.send(JSON.stringify({ type: 'clients', message: clientNames }))
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
    this.clientName = '';

    this.onClientConnected = this.onClientConnected.bind(this);
    this.onClientDisconnected = this.onClientDisconnected.bind(this);
  }

  getOtherClientNames() {
    if (this.remoteServer) {
      return this.remoteServer.clientNames.filter(name => name !== this.clientName);
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
        item: exportItemToJSON(item)
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

    this.clientName = name;

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

  /**
   * @param {PeerfulConnection} conn 
   */
  onClientConnected(conn) {
    console.log('Local connection established.');
    this.remoteServer = {
      connection: conn,
      data: null,
      clientNames: [],
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
            importInventoryFromJSON(jsonData.message, inv);
            dispatchInventoryChange(store, inv.invId);
          } break;
          case 'gift': {
            let { from, target, item } = jsonData.message;
            let newItem = importItemFromJSON(item);
            dropOnGround(newItem);
            window.alert(`You received a gift from ${from || 'the server'}! Remember to pick it up before closing the browser!`);
            this.remoteServer.connection.send(JSON.stringify({ type: 'giftack', message: { from, target } }));
          } break;
          case 'giftack': {
            let { target } = jsonData.message;
            window.alert(`Gift sent to ${target}!`);
          } break;
          case 'giftnak': {
            let { target } = jsonData.message;
            window.alert(`Gift failed to send to ${target}!`);
          } break;
          case 'clients': {
            this.remoteServer.clientNames = [...jsonData.message];
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
