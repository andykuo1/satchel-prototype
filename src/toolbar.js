import { downloadText } from './util/downloader.js';
import { getSatchelStore } from './store/SatchelStore.js';
import { connectAsServer } from './satchel/app/PeerSatchelConnector.js';
import { getCursorContext } from './satchel/inv/CursorHelper.js';
import { uploadFile } from './util/uploader.js';
import { copyToClipboard, pasteFromClipboard } from './util/clipboard.js';
import { ItemBuilder } from './satchel/item/Item.js';
import { uuid } from './util/uuid.js';
import { AlbumPackElement } from './components/album/AlbumPackElement.js';
import { exportItemToString, importItemFromJSON, importItemFromString } from './loader/ItemLoader.js';
import { importAlbumFromJSON } from './loader/AlbumLoader.js';
import { addAlbumInStore, createAlbumInStore, getAlbumInStore, getAlbumsInStore, isAlbumInStore } from './store/AlbumStore.js';
import { cloneAlbum, isAlbumHidden } from './satchel/album/Album.js';
import { addAlbumListChangeListener, dispatchAlbumChange } from './events/AlbumEvents.js';
import { clearFoundry, closeFoundry, copyFoundry, isFoundryOpen, openFoundry } from './satchel/inv/FoundryHelper.js';
import { ActivityPlayerList } from './satchel/peer/ActivityPlayerList.js';
import { dropItemOnGround, isGroundAlbum } from './satchel/GroundAlbum.js';
import { forceEmptyStorage } from './Storage.js';
import { setActiveProfileInStore } from './store/ProfileStore.js';
import { loadSatchelFromData, loadSatchelProfilesFromData, saveSatchelToData } from './loader/SatchelLoader.js';
import { setupActionProfile } from './toolbar/profile.js';
import { dropFallingItem } from './components/cursor/FallingItemElement.js';
import { updateList } from './components/ElementListHelper.js';
import { getCursor } from './components/index.js';
import { playSound, toggleSound } from './sounds.js';
import { saveItemToTrashAlbum } from './satchel/TrashAlbum.js';

function el(selector, event, callback) {
  document.querySelector(selector).addEventListener(event, callback);
}

window.addEventListener('DOMContentLoaded', () => {
  el('#actionItemEdit', 'click', onActionItemEdit);
  el('#downloadButton', 'click', onDownloadClick);
  el('#uploadButton', 'click', onUploadClick);
  el('#actionSoundToggle', 'click', onActionSoundToggle);
  el('#cloudButton', 'click', onCloudClick);
  el('#actionEraseAll', 'click', onActionEraseAll);
  
  el('#actionAlbumOpen', 'click', onActionAlbumOpen);
  el('#actionAlbumNew', 'click', onActionAlbumNew);

  el('#actionShareItem', 'click', onActionShareItem);
  el('#actionSettings', 'click', onActionSettings);

  el('#actionItemCodeImport', 'click', onActionItemCodeImport);
  el('#actionItemCodeExport', 'click', onActionItemCodeExport);
  el('#actionItemDuplicate', 'click', onActionItemDuplicate);
  el('#actionFoundryReset', 'click', onActionFoundryReset);
  el('#actionFoundryNew', 'click', onActionFoundryNew);
  el('#giftCodeExport', 'click', onGiftCodeExport);
  el('#giftSubmit', 'click', onGiftSubmit);

  setupActionProfile();

  el('.albumContainer', 'mouseup', onAlbumItemDrop);
  addAlbumListChangeListener(getSatchelStore(), onAlbumListUpdate);

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
  const albumList = document.querySelector('#albumList');
  albumList.scrollTo(0, 0);
  return albumId;
}

function onActionAlbumOpen() {
  let albumContainer = document.querySelector('.albumContainer');
  albumContainer.classList.toggle('open');
  let isOpen = albumContainer.classList.contains('open');
  if (isOpen) {
    playSound('openBag');
  } else {
    playSound('closeBag');
  }
}

function onAlbumItemDrop(e) {
  const store = getSatchelStore();
  const albums = getAlbumsInStore(store)
    .filter(a => !a.locked)
    .filter(a => !isGroundAlbum(a))
    .filter(a => !isAlbumHidden(store, a.albumId));
  let cursor = getCursor();
  // HACK: This is so single clicks won't create albums
  // @ts-ignore
  if (cursor.hasHeldItem() && !cursor.ignoreFirstPutDown) {
    let albumId;
    if (albums.length > 0) {
      albumId = albums[0].albumId;
    } else {
      albumId = onActionAlbumNew();
    }
    let result = cursor.putDownInAlbum(albumId);
    if (result) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}

function onAlbumListUpdate() {
  const store = getSatchelStore();
  const list = getAlbumsInStore(store)
    .sort((a, b) => (a.displayName||'').localeCompare(b.displayName||''))
    .filter(a => !isGroundAlbum(a))
    .filter(a => !isAlbumHidden(store, a.albumId))
    .map(a => a.albumId)
    .reverse();
  const albumList = document.querySelector('#albumList');
  const factoryCreate = (key) => new AlbumPackElement(key);
  updateList(albumList, list, factoryCreate);
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
  playSound('spawnItem');
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
        if (isAlbumInStore(store, album.albumId)) {
          cloneAlbum(album, getAlbumInStore(store, album.albumId));
          dispatchAlbumChange(store, album.albumId);
        } else {
          addAlbumInStore(store, album.albumId, album);
        }
        
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
    window.alert(`Copied to clipboard! Share this with a friend, then paste the code in Foundry.\n\n${itemString}`);
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
  } else {
    saveItemToTrashAlbum(prevItem);
  }
}

function onActionSoundToggle() {
  toggleSound();
}
