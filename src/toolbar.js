import { downloadText } from './util/downloader.js';
import { dropOnGround } from './inventory/GroundHelper.js';
import { exportItemToJSON, exportInventoryToJSON, importInventoryFromJSON, importItemFromJSON, exportDataToJSON } from './inventory/InventoryLoader.js';
import { dispatchAlbumChange, dispatchInventoryChange, getInventoryStore } from './inventory/InventoryStore.js';
import { connectAsServer, isServerSide } from './app/PeerSatchelConnector.js';
import { getCursorContext } from './inventory/CursorHelper.js';
import { getExistingInventory } from './inventory/InventoryTransfer.js';
import { addItemToAlbum, createAlbumInStore, exportAlbumToJSON, getAlbumInStore, getExistingAlbum, importAlbumFromJSON } from './album/Album.js';
import { uploadFile } from './util/uploader.js';
import { copyToClipboard } from './util/clipboard.js';
import { ItemBuilder } from './inventory/Item.js';
import { uuid } from './util/uuid.js';
import { ItemAlbumElement } from './album/ItemAlbumElement.js';

function elementEventListener(selector, event, callback) {
  document.querySelector(selector).addEventListener(event, callback);
}

window.addEventListener('DOMContentLoaded', () => {
  elementEventListener('#editButton', 'click', onEditClick);
  elementEventListener('#downloadButton', 'click', onDownloadClick);
  elementEventListener('#uploadButton', 'click', onUploadClick);
  elementEventListener('#cloudButton', 'click', onCloudClick);

  elementEventListener('#actionExportToFile', 'click', onActionExportToFile);
  elementEventListener('#actionSendToPlayer', 'click', onActionSendToPlayer);
  elementEventListener('#actionSaveToAlbum', 'click', onActionSaveToAlbum);
  elementEventListener('#actionAlbumOpen', 'click', onActionAlbumOpen);
  elementEventListener('#actionAlbumImport', 'click', onActionAlbumImport);
  elementEventListener('#actionDropToGround', 'click', onActionDropToGround);
  elementEventListener('#actionNewItem', 'click', onActionNewItem);
  elementEventListener('#actionAlbumNew', 'click', onActionAlbumNew);

  elementEventListener('#giftSubmit', 'click', onGiftSubmit);
});

function onActionAlbumNew() {
  const store = getInventoryStore();
  const albumId = uuid();
  createAlbumInStore(store, albumId);
  const albumContainer = document.querySelector('#albumList');
  const albumElement = new ItemAlbumElement();
  albumElement.albumId = albumId;
  albumContainer.appendChild(albumElement);
}

function onActionNewItem() {
  let item = new ItemBuilder().default().width(2).height(2).build();
  if (item) {
    dropOnGround(item);
  }
}

function onActionSaveToAlbum() {
  /** @type {import('./inventory/element/ItemEditorElement.js').ItemEditorElement} */
  const itemEditor = document.querySelector('#editor');
  try {
    let item = itemEditor.getSocketedItem();
    if (item) {
      addItemToAlbum(getInventoryStore(), 'main', item);
      itemEditor.clearEditor();
    }
  } catch (e) {
    console.error('Failed to export item', e);
  }
};

function onActionExportToFile() {
  /** @type {import('./inventory/element/ItemEditorElement.js').ItemEditorElement} */
  const itemEditor = document.querySelector('#editor');
  try {
    let item = itemEditor.getSocketedItem();
    if (item) {
      let jsonData = exportItemToJSON(item);
      downloadText(`${item.displayName || 'New Item'}.json`, JSON.stringify(jsonData, null, 4));
    }
  } catch (e) {
    console.error('Failed to export item', e);
  }
}

function onActionDropToGround() {
  /** @type {import('./inventory/element/ItemEditorElement.js').ItemEditorElement} */
  const itemEditor = document.querySelector('#editor');
  let item = itemEditor.getSocketedItem();
  if (item) {
    dropOnGround(item);
    itemEditor.clearEditor();
  }
}

function onActionAlbumView(e) {
  /** @type {import('./cards/CardAlbumElement.js').CardAlbumElement} */
  const albumElement = document.querySelector('#album');
  albumElement.changeView(e.target.value);
}

function onActionAlbumOpen(e) {
  let albumContainer = document.querySelector('.albumContainer');
  albumContainer.classList.toggle('open');
}

async function onActionAlbumImport() {
  await onUploadClick();
}

function onEditClick() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('open');
  /** @type {import('./inventory/element/ItemEditorElement.js').ItemEditorElement} */
  const editor = document.querySelector('#editor');
  if (!editor.isEditing()) {
    editor.newEditor();
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
    const jsonData = exportDataToJSON('server_v1', serverData, {});
    const dataString = JSON.stringify(jsonData, null, 4);
    downloadText(`satchel-server-data-${timestamp}.json`, dataString);
  } else {
    const store = getInventoryStore();
    const inv = getExistingInventory(store, 'main');
    const jsonData = exportInventoryToJSON(inv);
    const dataString = JSON.stringify(jsonData, null, 4);
    downloadText(`satchel-client-data-${timestamp}.json`, dataString);
  }
}

async function onUploadClick() {
  let files = await uploadFile('.json');
  let file = files[0];

  let jsonData;
  try {
    jsonData = JSON.parse(await file.text());
  } catch {
    window.alert('Cannot load file with invalid json format.');
  }

  switch(jsonData._type) {
    case 'inv_v1': {
      const store = getInventoryStore();
      let inv = getExistingInventory(store, 'main');
      importInventoryFromJSON(jsonData, inv);
      dispatchInventoryChange(store, 'main');
    } break;
    case 'album_v1': {
      const store = getInventoryStore();
      let album = getExistingAlbum(store, 'main');
      importAlbumFromJSON(jsonData, album);
      dispatchAlbumChange(store, 'main');
    } break;
    case 'item_v1': {
      const store = getInventoryStore();
      let album = getExistingAlbum(store, 'main');
      let item = importItemFromJSON(jsonData);
      addItemToAlbum(store, album.albumId, item);
    } break;
    case 'client_v1':
      throw new Error('Not yet implemented.');
    case 'server_v1': {
      const data = jsonData._data;
      localStorage.setItem('server_data', JSON.stringify(data));
      const ctx = getCursorContext();
      if (ctx.server && ctx.server.instance) {
        ctx.server.instance.localData = data;
      }
    } break;
    default:
      window.alert('Cannot load json with unknown data type.');
  }
}

async function onCloudClick() {
  const ctx = getCursorContext();
  let peerId;
  if (ctx.server) {
    peerId = ctx.server.peerful.id;
  } else if (ctx.client) {
    peerId = ctx.client.peerful.remoteId;
  } else {
    peerId = ctx.sessionId;
    await connectAsServer(ctx, peerId);
  }
  const shareable = generateShareableLink(peerId);
  await copyToClipboard(shareable);
  window.alert(`Link copied!\n${shareable}`);
}

/**
 * @param {string} peerId
 * @returns {string}
 */
function generateShareableLink(peerId) {
  return `${location.origin}${location.pathname}?id=${peerId}`;
}

function onActionSendToPlayer() {
  /** @type {import('./inventory/element/ItemEditorElement.js').ItemEditorElement} */
  const itemEditor = document.querySelector('#editor');
  try {
    let item = itemEditor.getSocketedItem();
    if (item) {
      /** @type {HTMLSelectElement} */
      let giftTarget = document.querySelector('#giftTarget');
      let ctx = getCursorContext();
      if (ctx.server && ctx.server.instance) {
        let content = ctx.server.instance.getActiveClientNames().map(clientName => `<option>${clientName.toLowerCase()}</option>`).join('\n');
        giftTarget.innerHTML = content;
      } else if (ctx.client && ctx.client.instance) {
        let content = ctx.client.instance.getOtherClientNames().map(clientName => `<option>${clientName.toLowerCase()}</option>`).join('\n');
        giftTarget.innerHTML = content;
      } else {
        giftTarget.innerHTML = '';
      }
      let giftDialog = document.querySelector('#giftDialog');
      giftDialog.toggleAttribute('open', true);
    }
  } catch (e) {
    console.error('Failed to export item', e);
  }
}

function onGiftSubmit() {
  let giftDialog = document.querySelector('#giftDialog');
  /** @type {HTMLSelectElement} */
  let giftTarget = document.querySelector('#giftTarget');
  if (giftTarget.value) {
    /** @type {import('./inventory/element/ItemEditorElement.js').ItemEditorElement} */
    const itemEditor = document.querySelector('#editor');
    const item = itemEditor.getSocketedItem();
    const target = giftTarget.value;
    const ctx = getCursorContext();
    if (ctx.server && ctx.server.instance) {
      ctx.server.instance.sendItemTo(target, item);
    } else if (ctx.client && ctx.client.instance) {
      ctx.client.instance.sendItemTo(target, item);
    }
  }
  giftDialog.toggleAttribute('open', false);
}