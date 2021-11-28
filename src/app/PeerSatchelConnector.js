import { Peerful } from '../peerful/Peerful.js';
import { copyToClipboard } from '../util/clipboard.js';
import { getCursorContext } from '../inventory/CursorHelper.js';
import { SatchelClient, SatchelServer } from './PeerSatchel.js';

export async function connectAsClient(ctx, remoteId) {
  if (!remoteId) {
    throw new Error('Missing remote id to start client.');
  }

  if (!ctx.client) {
    // Initialize client
    const peerful = new Peerful();
    ctx.client = {
      peerful,
      instance: new SatchelClient(),
    };
    peerful.on('error', err => {
      window.alert('Oh no! Failed to connect to server! ' + err);
    });
    peerful.on('connect', conn => {
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

export function isServerSide() {
  const ctx = getCursorContext();
  return Boolean(ctx.server);
}

export async function connectAsServer(ctx, localId) {
  if (!localId) {
    throw new Error('Missing local id to start server.');
  }
  if (!ctx.server) {
    // Initialize server
    const peerful = new Peerful(localId);
    ctx.server = {
      peerful,
      instance: new SatchelServer(),
    };
    peerful.on('error', err => {
      window.alert('Oh no! Failed to start server! ' + err);
    });
    peerful.on('connect', conn => {
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
      .then(() => console.log('Server started!'))
      .catch((error) => window.alert(error));
  }
  
  document.querySelector('#onlineStatus').classList.toggle('active', true);
}
