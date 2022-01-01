import { BUILD_VERSION } from './globals.js';

import { resolveSessionStatus } from './session/SatchelSession.js';
import { getCursorContext } from './inventory/CursorHelper.js';
import { connectAsClient } from './app/PeerSatchelConnector.js';
import { loadSatchelFromStorage, saveSatchelToStorage } from './session/SatchelStorage.js';
import { getInventoryStore } from './inventory/InventoryStore.js';
import { ItemAlbumElement } from './satchel/album/ItemAlbumElement.js';
import { getAlbumsInStore } from './satchel/album/AlbumStore.js';

import './satchel/item/index.js';
import './app/index.js';
import './inventory/element/index.js';
import './satchel/cards/index.js';
import './satchel/album/index.js';
import './satchel/profile/index.js';
import './toolbar.js';
import { isGroundAlbum } from './satchel/GroundAlbum.js';
import { setupActiveProfile } from './satchel/ActiveProfile.js';

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
    // Set up active profile
    setupActiveProfile();
    // Set up autosave
    setInterval(() => {
      saveSatchelToStorage();
    }, 1_000);
  }
}
