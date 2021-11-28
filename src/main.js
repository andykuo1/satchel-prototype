import { setGroundContainer } from './inventory/GroundHelper.js';
import { BUILD_VERSION } from './globals.js';

import { resolveSessionStatus } from './session/SatchelSession.js';
import { getCursorContext } from './inventory/CursorHelper.js';
import { connectAsClient, connectAsServer } from './app/PeerSatchelConnector.js';
import { loadSatchelFromStorage, saveSatchelToStorage } from './session/SatchelStorage.js';

import './app/index.js';
import './inventory/element/index.js';
import './cards/index.js';
import './toolbar.js';

async function connect() {
  let session = resolveSessionStatus();
  let ctx = getCursorContext();
  if (session.sessionId === session.remoteId) {
    // Start a server.
    await connectAsServer(ctx, session.sessionId);
  } else {
    // Start a client.
    await connectAsClient(ctx, session.remoteId);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Set build version
  document.querySelector('#appVersion').textContent = `v${BUILD_VERSION}`;

  // Initialize store
  const ground = document.querySelector('#ground');
  setGroundContainer(ground);

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
    setInterval(() => saveSatchelToStorage(), 1000);
  }
}
