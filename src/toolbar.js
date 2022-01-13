import { downloadText } from './util/downloader.js';
import { getSatchelStore } from './store/SatchelStore.js';
import { connectAsServer } from './satchel/app/PeerSatchelConnector.js';
import { getCursorContext } from './satchel/inv/CursorHelper.js';
import { uploadFile } from './util/uploader.js';
import { copyToClipboard, pasteFromClipboard } from './util/clipboard.js';
import { ItemBuilder } from './satchel/item/Item.js';
import { uuid } from './util/uuid.js';
import { ItemAlbumElement } from './components/album/ItemAlbumElement.js';
import { exportItemToString, importItemFromJSON, importItemFromString } from './loader/ItemLoader.js';
import { importAlbumFromJSON } from './loader/AlbumLoader.js';
import { addAlbumInStore, createAlbumInStore, getAlbumIdsInStore, getAlbumInStore } from './store/AlbumStore.js';
import { copyAlbum, isAlbumHidden } from './satchel/album/Album.js';
import { dispatchAlbumChange } from './events/AlbumEvents.js';
import { clearFoundry, closeFoundry, copyFoundry, isFoundryOpen, openFoundry } from './satchel/inv/FoundryHelper.js';
import { ActivityPlayerList } from './satchel/peer/ActivityPlayerList.js';
import { dropItemOnGround, isGroundAlbum } from './satchel/GroundAlbum.js';
import { forceEmptyStorage } from './Storage.js';
import { setActiveProfileInStore } from './store/ProfileStore.js';
import { loadSatchelFromData, loadSatchelProfilesFromData, saveSatchelToData } from './loader/SatchelLoader.js';
import { setupActionProfile } from './toolbar/profile.js';
import { dropFallingItem } from './components/cursor/FallingItemElement.js';

function elementEventListener(selector, event, callback) {
  document.querySelector(selector).addEventListener(event, callback);
}

window.addEventListener('DOMContentLoaded', () => {
  elementEventListener('#actionItemEdit', 'click', onActionItemEdit);
  elementEventListener('#downloadButton', 'click', onDownloadClick);
  elementEventListener('#uploadButton', 'click', onUploadClick);
  elementEventListener('#cloudButton', 'click', onCloudClick);
  elementEventListener('#actionEraseAll', 'click', onActionEraseAll);
  
  elementEventListener('#actionAlbumOpen', 'click', onActionAlbumOpen);
  elementEventListener('#actionAlbumImport', 'click', onActionAlbumImport);
  elementEventListener('#actionAlbumNew', 'click', onActionAlbumNew);

  elementEventListener('#actionShareItem', 'click', onActionShareItem);
  elementEventListener('#actionSettings', 'click', onActionSettings);

  elementEventListener('#actionItemCodeImport', 'click', onActionItemCodeImport);
  elementEventListener('#actionItemCodeExport', 'click', onActionItemCodeExport);
  elementEventListener('#actionItemDuplicate', 'click', onActionItemDuplicate);
  elementEventListener('#actionFoundryReset', 'click', onActionFoundryReset);
  elementEventListener('#actionFoundryNew', 'click', onActionFoundryNew);
  elementEventListener('#giftCodeExport', 'click', onGiftCodeExport);

  elementEventListener('#giftSubmit', 'click', onGiftSubmit);

  setupActionProfile();

  document.addEventListener('itemcontext', onItemContext);
});

function onActionShareItem() {
  /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
  const itemEditor = document.querySelector('#itemDialog');
  const socketedItem = itemEditor.copySocketedItem();
  try {
    if (socketedItem) {
      /** @type {HTMLSelectElement} */
      let giftTarget = document.querySelector('#giftTarget');
      let ctx = getCursorContext();
      if (ctx.server && ctx.server.instance) {
        const localServer = /** @type {import('./satchel/app/PeerSatchel.js').SatchelServer} */ (ctx.server.instance);
        const playerNames = ActivityPlayerList.getPlayerNameListOnServer(localServer);
        let content = playerNames.map(clientName => `<option>${clientName.toLowerCase()}</option>`).join('\n');
        giftTarget.innerHTML = content;
      } else if (ctx.client && ctx.client.instance) {
        const localClient = /** @type {import('./satchel/app/PeerSatchel.js').SatchelClient} */ (ctx.client.instance);
        const playerNames = ActivityPlayerList.getPlayerNameListOnClient(localClient);
        let content = playerNames.map(clientName => `<option>${clientName.toLowerCase()}</option>`).join('\n');
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
  /** @type {HTMLSelectElement} */
  let giftTarget = document.querySelector('#giftTarget');
  if (giftTarget.value) {
    /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
    const itemDialog = document.querySelector('#itemDialog');
    const socketedItem = itemDialog.copySocketedItem();
    const target = giftTarget.value;
    const ctx = getCursorContext();
    if (ctx.server && ctx.server.instance) {
      ctx.server.instance.sendItemTo(target, socketedItem);
    } else if (ctx.client && ctx.client.instance) {
      ctx.client.instance.sendItemTo(target, socketedItem);
    }
  }
  let giftDialog = document.querySelector('#giftDialog');
  giftDialog.toggleAttribute('open', false);
}

function onGiftCodeExport() {
  /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
  const itemDialog = document.querySelector('#itemDialog');
  const socketedItem = itemDialog.copySocketedItem();
  const itemString = exportItemToString(socketedItem);
  copyToClipboard(itemString).then(() => {
    window.alert('Copied to clipboard!\n\nShare this code with a friend, then import item by pasting in Foundry.');
  });
}

function onActionEraseAll() {
  if (!window.confirm('This will erase all content. Are you sure?')) {
    return;
  }
  forceEmptyStorage();
  window.location.reload();
}

function onActionAlbumNew() {
  const store = getSatchelStore();
  const albumId = uuid();
  createAlbumInStore(store, albumId);
  const albumContainer = document.querySelector('#albumList');
  const albumElement = new ItemAlbumElement();
  albumElement.albumId = albumId;
  albumContainer.appendChild(albumElement);
}

function onActionAlbumOpen() {
  const store = getSatchelStore();
  const albumIds = getAlbumIdsInStore(store);
  const albumElementList = document.querySelector('#albumList');
  /** @type {NodeListOf<ItemAlbumElement>} */
  const albumElementChildren = albumElementList.querySelectorAll('item-album');
  for(let album of albumElementChildren) {
    let i = albumIds.indexOf(album.albumId);
    if (i >= 0) {
      // Ignore this element as it is already created and in store.
      albumIds.splice(i, 1);
    } else {
      // Delete this element as it no longer exists in store.
      album.remove();
    }
  }
  // Create any albums not matched with one in store
  for(let albumId of albumIds) {
    const album = getAlbumInStore(store, albumId);
    if (isGroundAlbum(album)) {
      // Ground album is always displayed in a separate sidebar
      continue;
    }
    // Hidden albums are not shown, so don't create it.
    if (isAlbumHidden(store, albumId)) {
      continue;
    }
    const albumElement = new ItemAlbumElement();
    albumElement.albumId = albumId;
    albumElementList.appendChild(albumElement);
  }
  // Actually open the container
  let albumContainer = document.querySelector('.albumContainer');
  albumContainer.classList.toggle('open');
}

async function onActionAlbumImport() {
  await onUploadClick();
}

function onActionItemEdit() {
  if (isFoundryOpen()) {
    closeFoundry();
  } else {
    openFoundry(null);
  }
}

function onActionItemDuplicate(e) {
  if (!isFoundryOpen()) {
    return;
  }
  const newItem = copyFoundry();
  if (newItem) {
    const clientRect = e.target.getBoundingClientRect();
    dropFallingItem(newItem, clientRect.x, clientRect.y);
  }
}

function onActionFoundryNew() {
  if (!isFoundryOpen()) {
    return;
  }
  clearFoundry();
  const newItem = new ItemBuilder().fromDefault().width(2).height(2).build();
  openFoundry(newItem);
}

function onDownloadClick() {
  const timestamp = Date.now();
  const store = getSatchelStore();
  const json = saveSatchelToData(store);
  downloadText(`satchel-data-${timestamp}.json`, JSON.stringify(json, null, 4));
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
    case 'satchel_v2': {
      if (!window.confirm('This may overwrite data. Do you want to continue?')) {
        return;
      }
      const store = getSatchelStore();
      try {
        loadSatchelFromData(store, jsonData, true);
      } catch (e) {
        console.error('Failed to load satchel from file.');
        console.error(e);
      }
    } break;
    case 'profile_v2': {
      const store = getSatchelStore();
      try {
        let loadedProfileIds = loadSatchelProfilesFromData(store, jsonData, false);
        if (loadedProfileIds) {
          let profileId = loadedProfileIds[0];
          if (profileId) {
            setActiveProfileInStore(store, profileId);
          }
        }
      } catch (e) {
        console.error('Failed to load satchel from file.');
        console.error(e);
      }
    } break;
    case 'album_v1': {
      const store = getSatchelStore();
      try {
        const album = importAlbumFromJSON(jsonData);
        const newAlbum = copyAlbum(album);
        addAlbumInStore(store, newAlbum.albumId, newAlbum);
        const albumList = document.querySelector('#albumList');
        const albumElement = new ItemAlbumElement();
        albumElement.albumId = newAlbum.albumId;
        albumList.appendChild(albumElement);
        dispatchAlbumChange(store, newAlbum.albumId);

        // Make sure to open the container
        let albumContainer = document.querySelector('.albumContainer');
        if (!albumContainer.classList.contains('open')) {
          onActionAlbumOpen();
        }
      } catch (e) {
        console.error('Failed to load album from file.');
        console.error(e);
      }
    } break;
    case 'item_v1': {
      try {
        let item = importItemFromJSON(jsonData);
        dropItemOnGround(item);
      } catch (e) {
        console.error('Failed to load item from file.');
        console.error(e);
      }
    } break;
    default:
      window.alert('Cannot load json - this is not a known format.');
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

function onActionSettings() {
  let settingsDialog = document.querySelector('#settingsDialog');
  settingsDialog.toggleAttribute('open', true);
}

/**
 * @param {string} peerId
 * @returns {string}
 */
function generateShareableLink(peerId) {
  return `${location.origin}${location.pathname}?id=${peerId}`;
}

function onItemContext(e) {
  e.preventDefault();
  e.stopPropagation();

  /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
  const itemDialog = document.querySelector('#itemDialog');
  // @ts-ignore
  const { container, invId, itemId, clientX, clientY } = e.detail;
  if (invId && itemId) {
    itemDialog.openDialog(container, invId, itemId, clientX, clientY);
  }
  return false;
}

function onActionItemCodeExport() {
  /** @type {import('./components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
  const itemEditor = document.querySelector('#itemEditor');
  let item = itemEditor.getSocketedItem();
  if (!item) {
    window.alert('No item to copy :(\n\nPut an item in Foundry to copy item code.');
    return;
  }
  let itemString = exportItemToString(item);
  copyToClipboard(itemString).then(() => {
    window.alert('Copied to clipboard!\n\nShare with a friend, then paste the code in Foundry.');
  });
}

async function onActionItemCodeImport() {
  /** @type {import('./components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
  const itemEditor = document.querySelector('#itemEditor');
  let itemString = await pasteFromClipboard();
  let newItem = importItemFromString(itemString);
  itemEditor.clearSocketedItem();
  itemEditor.putSocketedItem(newItem, true);
}

function onActionFoundryReset() {
  if (!isFoundryOpen()) {
    return;
  }
  const prevItem = clearFoundry();
  if (!prevItem) {
    closeFoundry();
  }
}
