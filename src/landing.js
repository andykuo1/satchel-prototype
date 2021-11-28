
import { BUILD_VERSION } from './globals.js';
import { pasteFromClipboard } from './util/clipboard.js';
import { uuid } from './util/uuid.js';
import { prepareSessionStatus } from './session/SatchelSession.js';

import './app/DialogPromptElement.js';

const UUIDV4_PATTERN = /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/;

window.addEventListener('DOMContentLoaded', () => {
  // Set build version.
  document.querySelector('#appVersion').textContent = `v${BUILD_VERSION}`;

  document.querySelector('#buttonStart').addEventListener('click', () => {
    // Start a server.
    const newSessionId = uuid();
    const selfRemoteId = newSessionId;
    prepareSessionStatus(newSessionId, selfRemoteId);
    window.open(`./app.html?id=${selfRemoteId}`, '_parent');
  });
  document.querySelector('#sessionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Start a client.
    const formElement = /** @type {HTMLFormElement} */(e.target);
    const formData = new FormData(formElement);
    const targetRemoteId = formData.get('id');
    const newSessionId = uuid();
    prepareSessionStatus(newSessionId, targetRemoteId);
    window.open(`./app.html?id=${targetRemoteId}`, '_parent');
    return false;
  });
  document.querySelector('#buttonJoin').addEventListener('click', () => {
    document.querySelector('#sessionDialog').toggleAttribute('open', true);
  });
  document.querySelector('#sessionPaste').addEventListener('click', async (e) => {
    const text = await pasteFromClipboard();
    const result = UUIDV4_PATTERN.exec(text);
    /** @type {HTMLInputElement} */
    const sessionId = document.querySelector('#sessionId');
    if (result) {
      sessionId.value = result[0];
    } else {
      sessionId.value = text;
    }
    return false;
  });
});
