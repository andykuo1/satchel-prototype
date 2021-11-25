import { Peerful } from '../peerful/Peerful.js';
import { copyToClipboard } from '../util/clipboard.js';
import { getCursorContext } from '../inventory/CursorHelper.js';
import { SatchelClient, SatchelServer } from './PeerSatchel.js';

export async function connectAsClient(ctx) {
  const remoteId = tryGetRemotePeerId(window.location);
  if (!remoteId) {
    return false;
  }

  if (!ctx.client) {
    // Initialize client
    const peerful = new Peerful();
    ctx.client = {
      peerful,
      instance: new SatchelClient(),
    };
    peerful.on('connect', (conn) => {
      console.log('Client connection established.');
      ctx.client.instance.onClientConnected(conn);
      conn.on('error', (error) => {
        console.error(`Client connection errored: ${error}`);
        conn.close();
      });
      conn.on('close', () => {
        console.error('Client connection closed.');
        ctx.client.instance.onClientDisconnected(conn);
      });
    });
  }

  const { peerful } = ctx.client;
  try {
    await peerful.connect(remoteId);
  } catch (error) {
    window.alert('Oh no! Failed to connect to server!');
    throw error;
  }

  window.alert('Hooray! Connected to server!');
  document.querySelector('#onlineStatus').classList.toggle('active', true);
  return true;
}

export function shouldConnnectAsClient() {
  return Boolean(tryGetRemotePeerId(window.location));
}

export function isServerSide() {
  const ctx = getCursorContext();
  return Boolean(ctx.server);
}

export async function connectAsServer(ctx) {
  if (!ctx.server) {
    // Initialize server
    const peerful = new Peerful();
    ctx.server = {
      peerful,
      instance: new SatchelServer(),
    };
    peerful.on('connect', (conn) => {
      console.log('Client connection established.');
      ctx.server.instance.onClientConnected(conn);
      conn.on('error', (error) => {
        console.error(`Client connection errored: ${error}`);
        conn.close();
      });
      conn.on('close', () => {
        console.error('Client connection closed.');
        ctx.server.instance.onClientDisconnected(conn);
      });
    });
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
  return `${location.origin}${location.pathname}?id=${peerful.id}`;
}
