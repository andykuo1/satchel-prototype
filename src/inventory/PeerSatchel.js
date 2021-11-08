import { Peerful } from '../peerful/Peerful.js';
import { copyToClipboard } from '../util/clipboard.js';
import { getCursorContext } from './CursorHelper.js';
import { saveToJSON } from './InventoryLoader.js';
import { getInventoryStore, resetInventoryStore } from './InventoryStore.js';

// Const BASE_URL = 'http://127.0.0.1:5500';
const BASE_URL = 'https://andykuo1.github.io/satchel';

export async function connectAsClient() {
  const remoteId = tryGetRemotePeerId(window.location);
  if (!remoteId) {
    return false;
  }

  const ctx = getCursorContext();
  if (!ctx.client) {
    // Initialize client
    ctx.client = {
      peerful: null,
      server: null,
    };
    const peerful = new Peerful();
    ctx.client.peerful = peerful;
    peerful.on('connect', onLocalClientConnection);
  }

  const { peerful } = ctx.client;
  try {
    await peerful.connect(remoteId);
  } catch (error) {
    window.alert('Failed to connect to server!');
    throw error;
  }

  window.alert('Hooray! Connected to server!');
  document.querySelector('#onlineStatus').classList.toggle('active', true);
  return true;
}

export function isServerSide() {
  const ctx = getCursorContext();
  return Boolean(ctx.server);
}

export async function connectAsServer() {
  const ctx = getCursorContext();
  if (!ctx.server) {
    // Initialize server
    let serverData;
    try {
      serverData = JSON.parse(localStorage.getItem('server_data')) || {};
    } catch {
      serverData = {};
    }

    console.log('Loading server data...', serverData);
    ctx.server = {
      peerful: null,
      clients: [],
      data: serverData,
    };
    const peerful = new Peerful();
    ctx.server.peerful = peerful;
    peerful.on('connect', onRemoteClientConnection);
    peerful
      .listen()
      .then(() => window.alert('Server started!'))
      .catch((error) => window.alert(error));
  }

  const { peerful } = ctx.server;
  const shareable = generateShareableLink(peerful);
  await copyToClipboard(shareable);
  window.alert(`Link copied!\n${shareable}`);
  document.querySelector('#onlineStatus').classList.toggle('active', true);
  // Save to local storage every 1 seconds
  setInterval(() => {
    const ctx = getCursorContext();
    localStorage.setItem('server_data', JSON.stringify(ctx.server.data));
  }, 5000);
}

function onLocalClientConnection(conn) {
  const ctx = getCursorContext();
  const server = {
    connection: conn,
  };
  ctx.client.server = server;
  conn.on('data', (data) => {
    try {
      const jsonData = JSON.parse(data);
      switch (jsonData.type) {
        case 'new':
          {
            const defaultInv = {
              name: 'main',
              items: [],
              width: 12,
              height: 9,
              type: 'grid',
            };
            resetInventoryStore(getInventoryStore(), {
              data: {
                inventory: {
                  main: defaultInv,
                },
              },
            });
          }
          break;
        case 'reset':
          {
            resetInventoryStore(getInventoryStore(), jsonData.message);
          }
          break;
        default:
          console.error(`Found unknown message from server - ${data}`);
          break;
      }
    } catch (e) {
      console.error('Found invalid message from server - ' + data, e);
    }
  });
  conn.on('error', (error) => {
    console.error(error);
    window.alert('Server connection failed due to error!');
  });
  conn.on('close', () => {
    window.alert('Server connection closed!');
  });

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
    const jsonData = saveToJSON(store);
    const wrappedData = {
      type: 'sync',
      message: jsonData,
    };
    const string = JSON.stringify(wrappedData);
    conn.send(string);
  }, 1000);
}

/**
 * @param conn
 */
function onRemoteClientConnection(conn) {
  const ctx = getCursorContext();
  const client = {
    connection: conn,
    name: '',
    data: null,
  };
  ctx.server.clients.push(client);
  conn.on('data', (data) => {
    try {
      const jsonData = JSON.parse(data);
      switch (jsonData.type) {
        case 'name':
          {
            console.log('Setting up client...', client.name);
            client.name = jsonData.message.toLowerCase().replace(/\s/g, '_');
            const clientDataName = `remote_data#${client.name}`;
            // Send to client their first data store
            const clientData = ctx.server.data[clientDataName] || null;
            if (clientData) {
              conn.send(
                JSON.stringify({
                  type: 'reset',
                  message: clientData,
                })
              );
            } else {
              conn.send(JSON.stringify({ type: 'new' }));
            }
          }
          break;
        case 'sync':
          {
            console.log('Syncing client...', client.name);
            // Update server's copy of client data
            if (!client.name) {
              return;
            }

            const clientDataName = `remote_data#${client.name}`;
            ctx.server.data[clientDataName] = jsonData.message;
          }
          break;
        default:
          console.error(`Found unknown message from client - ${data}`);
          break;
      }
    } catch (error) {
      console.error(`Found invalid message from client - ${data}`, error);
    }
  });
  conn.on('error', (error) => {
    console.error(`client errored: ${error}`);
  });
  conn.on('close', () => {
    console.error('client closed.');
  });
}

/**
 * @param {Location} url
 * @returns {string|null}
 */
function tryGetRemotePeerId(url) {
  const parameters = new URLSearchParams(url.search);
  if (parameters.has('id')) {
    return parameters.get('id');
  }

  return null;
}

/**
 * @param {Peerful} peerful
 * @returns {string}
 */
function generateShareableLink(peerful) {
  return `${BASE_URL}/index.html?id=${peerful.id}`;
}
