import { downloadText } from './util/downloader.js';
import { clearGround } from './inventory/GroundHelper.js';
import { openItemBuilder } from './app/ItemBuilder.js';
import { saveInventoryToJSON, loadInventoryFromJSON } from './inventory/InventoryLoader.js';
import { dispatchInventoryChange, getInventoryStore } from './inventory/InventoryStore.js';
import {
  connectAsClient,
  connectAsServer,
  isServerSide,
  shouldConnnectAsClient,
} from './app/PeerSatchelConnector.js';
import { getCursorContext } from './inventory/CursorHelper.js';
import { getExistingInventory } from './inventory/InventoryTransfer.js';

window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#editButton').addEventListener('click', onEditClick);
  document
    .querySelector('#deleteButton')
    .addEventListener('click', onDeleteClick);
  document
    .querySelector('#cloudButton')
    .addEventListener('click', onCloudClick);
  document
    .querySelector('#downloadButton')
    .addEventListener('click', onDownloadClick);
  document
    .querySelector('#uploadButton')
    .addEventListener('click', onUploadClick);
  document
    .querySelector('#uploadInput')
    .addEventListener('change', onUploadChange);
});

function onEditClick() {
  const editor = document.querySelector('#editor');
  if (editor.classList.contains('open')) {
    editor.classList.remove('open');
  } else {
    openItemBuilder(document.querySelector('#itemBuilder'));
    document.querySelector('#editor').classList.add('open');
  }
}

function onDeleteClick() {
  if (window.confirm('Clear all items on the ground?')) {
    clearGround();
  }
}

function onCloudClick() {
  document.querySelector('#cloudButton').toggleAttribute('disabled', true);
  if (shouldConnnectAsClient()) {
    let ctx = getCursorContext();
    connectAsClient(ctx).catch(e => {
      window.alert('Could not connect: ' + e);
      document.querySelector('#cloudButton').toggleAttribute('disabled', false);
    });
  } else {
    let ctx = getCursorContext();
    connectAsServer(ctx).catch(e => {
      window.alert('Could not connect: ' + e);
    }).finally(() => {
      document.querySelector('#cloudButton').toggleAttribute('disabled', false);
    });
  }
}

function onDownloadClick() {
  const timestamp = Date.now();
  if (isServerSide()) {
    let serverData;
    try {
      serverData = JSON.parse(localStorage.getItem('server_data'));
    } catch {
      serverData = {};
    }

    const wrappedData = {
      timestamp,
      datatype: 'server',
      data: serverData,
    };
    const dataString = JSON.stringify(wrappedData, null, 4);
    downloadText(`satchel-server-data-${timestamp}.json`, dataString);
  } else {
    const store = getInventoryStore();
    const jsonData = saveInventoryToJSON(getExistingInventory(store, 'main'));
    const wrappedData = {
      timestamp,
      datatype: 'client',
      data: jsonData,
    };
    const dataString = JSON.stringify(wrappedData, null, 4);
    downloadText(`satchel-data-${timestamp}.json`, dataString);
  }
}

function onUploadClick() {
  let input = /** @type {HTMLInputElement} */ (
    document.querySelector('#uploadInput')
  );
  input.click();
}

async function onUploadChange(e) {
  const file = e.target.files[0];

  let jsonData;
  try {
    jsonData = JSON.parse(await file.text());
  } catch {
    window.alert('Failed to load file.');
  }

  if (jsonData.datatype === 'server') {
    localStorage.setItem('server_data', JSON.stringify(jsonData.data));
    const ctx = getCursorContext();
    if (ctx.server && ctx.server.instance) {
      ctx.server.instance.localData = jsonData.data;
    }
  } else if (jsonData.datatype === 'client') {
    const store = getInventoryStore();
    let inv = getExistingInventory(store, 'main');
    loadInventoryFromJSON(jsonData.data, inv);
    dispatchInventoryChange(store, 'main');
  }
}
