import { BUILD_VERSION } from './globals.js';

import { resolveSessionStatus } from './session/SatchelSession.js';
import { getCursorContext } from './inventory/CursorHelper.js';
import { connectAsClient } from './app/PeerSatchelConnector.js';
import { loadSatchelFromStorage, saveSatchelToStorage } from './session/SatchelStorage.js';

import './app/index.js';
import './inventory/element/index.js';
import './cards/index.js';
import './album/index.js';
import './toolbar.js';
import { getAlbumsInStore } from './album/Album.js';
import { getInventoryStore } from './inventory/InventoryStore.js';
import { ItemAlbumElement } from './album/ItemAlbumElement.js';

async function connect() {
  let session = resolveSessionStatus();
  let ctx = getCursorContext();
  ctx.sessionId = session.sessionId;
  ctx.remoteId = session.remoteId;
  try {
    if (session.sessionId === session.remoteId) {
      // Start a server...when they click the cloud.
    } else {
      // Start a client...now.
      await connectAsClient(ctx, session.remoteId);
    }
    document.querySelector('#cloudButton').toggleAttribute('disabled', false);
  } catch (e) {
    throw e;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Set build version
  document.querySelector('#appVersion').textContent = `v${BUILD_VERSION}`;

  // Prepare item context menu
  document.addEventListener('itemcontext', (e) => {
    e.preventDefault();
    e.stopPropagation();

    /** @type {import('./inventory/element/ItemDetailEditorElement.js').ItemDetailEditorElement} */
    const detailEditor = document.querySelector('#detailEditor');
    // @ts-ignore
    const { invId, itemId, clientX, clientY } = e.detail;
    if (invId && itemId) {
      detailEditor.open(invId, itemId, clientX, clientY, true);
    }
    return false;
  });
  
  if (document.hasFocus()) {
    setTimeout(onDocumentFocusUpdate, 300);
  } else {
    onDocumentFocusUpdate();
  }
});

async function onDocumentFocusUpdate() {
  if (!document.hasFocus()) {
    setTimeout(onDocumentFocusUpdate, 300);
    return;
  }
  // Connect session
  try {
    await connect();
  } catch (e) {
    window.alert('Could not connect: ' + e);
  } finally {
    // Initialize satchel from storage.
    loadSatchelFromStorage();
    // Add all albums to the panel
    const store = getInventoryStore();
    const albumContainer = document.querySelector('#albumList');
    for(let album of getAlbumsInStore(store)) {
      if (album.albumId === 'ground') {
        continue;
      }
      const albumElement = new ItemAlbumElement();
      albumElement.albumId = album.albumId;
      albumContainer.appendChild(albumElement);
    }
    setInterval(() => saveSatchelToStorage(), 1000);
  }
}
