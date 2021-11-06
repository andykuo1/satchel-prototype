import { Peerful } from '../peerful/Peerful.js';
import { copyToClipboard } from '../util/clipboard.js';
import { getCursorContext } from './CursorHelper.js';
import { saveToJSON } from './InventoryLoader.js';
import { getInventoryStore, resetInventoryStore } from './InventoryStore.js';

// const BASE_URL = 'http://127.0.0.1:5500';
const BASE_URL = 'https://andykuo1.github.io/satchel';

export async function connectAsClient() {
    let remoteId = tryGetRemotePeerId(window.location);
    if (!remoteId) return false;

    let ctx = getCursorContext();
    if (!ctx.client) {
        // Initialize client
        ctx.client = {
            peerful: null,
            server: null,
        };
        let peerful = new Peerful();
        ctx.client.peerful = peerful;
        peerful.on('connect', onLocalClientConnection);
    }
    let peerful = ctx.client.peerful;
    try {
        await peerful.connect(remoteId);
    } catch(e) {
        window.alert('Failed to connect to server!');
        throw e;
    }
    window.alert('Hooray! Connected to server!');
    document.querySelector('#onlineStatus').classList.toggle('active', true);
    return true;
}

export function isServerSide() {
    let ctx = getCursorContext();
    return Boolean(ctx.server);
}

export async function connectAsServer() {
    let ctx = getCursorContext();
    if (!ctx.server) {
        // Initialize server
        let serverData;
        try {
            serverData = JSON.parse(localStorage.getItem('server_data')) || {};
        } catch(e) {
            serverData = {};
        }
        console.log('Loading server data...');
        ctx.server = {
            peerful: null,
            clients: [],
            data: serverData,
        };
        let peerful = new Peerful();
        ctx.server.peerful = peerful;
        peerful.on('connect', onRemoteClientConnection);
        peerful.listen()
            .then(() => window.alert('Server started!'))
            .catch(reason => window.alert(reason));
    }
    let peerful = ctx.server.peerful;
    let shareable = generateShareableLink(peerful);
    await copyToClipboard(shareable);
    window.alert('Link copied!\n' + shareable);
    document.querySelector('#onlineStatus').classList.toggle('active', true);
    // Save to local storage every 1 seconds
    setInterval(() => {
        let ctx = getCursorContext();
        localStorage.setItem('server_data', JSON.stringify(ctx.server.data));
    }, 1000);
}

function onLocalClientConnection(conn) {
    let ctx = getCursorContext();
    let server = {
        connection: conn,
    };
    ctx.client.server = server;
    conn.on('data', (data) => {
        try {
            let jsonData = JSON.parse(data);
            switch(jsonData.type) {
                case 'new': {
                    let defaultInv = {
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
                            }
                        }
                    });
                } break;
                case 'reset': {
                    resetInventoryStore(getInventoryStore(), jsonData.message);
                } break;
                default:
                    console.error('Found unknown message from server - ' + data);
                    break;
            }
        } catch(e) {
            console.error('Found invalid message from server - ' + data);
        }
    });
    conn.on('error', (err) => {
        console.error(err);
        window.alert('Server connection failed due to error!');
    });
    conn.on('close', () => {
        window.alert('Server connection closed!');
    });

    let name;
    while(!name) {
        name = window.prompt('Who Art Thou? (cannot be changed yet, sry)');
        if (!name) {
            window.alert('Invalid name.');
        }
    }
    conn.send(JSON.stringify({
        type: 'name',
        message: name,
    }));

    // Send to server every 1 seconds
    setInterval(() => {
        let store = getInventoryStore();
        let jsonData = saveToJSON(store);
        let wrappedData = {
            type: 'sync',
            message: jsonData,
        };
        let string = JSON.stringify(wrappedData);
        conn.send(string);
    }, 1000);
}

function onRemoteClientConnection(conn) {
    let ctx = getCursorContext();
    let client = {
        connection: conn,
        name: '',
        data: null,
    };
    ctx.server.clients.push(client);
    conn.on('data', (data) => {
        try {
            let jsonData = JSON.parse(data);
            switch(jsonData.type) {
                case 'name': {
                    client.name = jsonData.message.toLowerCase().replace(/\s/g, '_');
                    let clientDataName = `remote_data#${client.name}`;
                    // Send to client their first data store
                    let clientData = ctx.server.data[clientDataName] || null;
                    if (clientData) {
                        conn.send(JSON.stringify({ type: 'reset', message: clientData }));
                    } else {
                        conn.send(JSON.stringify({ type: 'new' }));
                    }
                } break;
                case 'sync': {
                    // Update server's copy of client data
                    if (!client.name) return;
                    let clientDataName = `remote_data#${client.name}`;
                    ctx.server.data[clientDataName] = jsonData.message;
                } break;
                default:
                    console.error('Found unknown message from client - ' + data);
                    break;
            }
        } catch(e) {
            console.error(e);
            console.error('Found invalid message from client - ' + data);
        }
    });
    conn.on('error', (err) => {
        console.error('client errored: ' + err);
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
    let params = new URLSearchParams(url.search);
    if (params.has('id')) {
        return params.get('id');
    } else {
        return null;
    }
}

/**
 * @param {Peerful} peerful 
 * @returns {string}
 */
function generateShareableLink(peerful) {
    return `${BASE_URL}/index.html?id=${peerful.id}`;
}
