import { downloadText } from './util/downloader.js';
import { clearGround } from './inventory/GroundHelper.js';
import { openItemBuilder } from './app/ItemBuilder.js';
import { saveToJSON, loadFromJSON } from './inventory/InventoryLoader.js';
import { getInventoryStore } from './inventory/InventoryStore.js';
import {
  connectAsClient,
  connectAsServer,
  isServerSide,
  shouldConnnectAsClient,
} from './app/PeerSatchel.js';
import { getCursorContext } from './inventory/CursorHelper.js';

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
    connectAsClient().catch(e => {
      window.alert('Could not connect: ' + e);
      document.querySelector('#cloudButton').toggleAttribute('disabled', false);
    });
  } else {
    connectAsServer().catch(e => {
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
    const jsonData = saveToJSON(getInventoryStore());
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
    if (ctx.server) {
      ctx.server.data = jsonData.data;
    }
  }

  if (jsonData.datatype === 'client') {
    loadFromJSON(getInventoryStore(), jsonData.data);
  }
}
