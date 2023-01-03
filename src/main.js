import { BUILD_VERSION } from '@satchel/globals.js';

import './components/index.js';
import { setupActiveProfile } from './satchel/ActiveProfile.js';
import { getCursorContext } from './satchel/inv/CursorHelper.js';
import { connectAsClient } from './satchel/peer/PeerSatchelConnector.js';
import { resolveSessionStatus } from './satchel/session/SatchelSession.js';
import { loadSatchelFromStorage, saveSatchelToStorage } from './satchel/session/SatchelStorage.js';
import './toolbar.js';

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
