import { downloadText } from './util/downloader.js';
import { importInventoryFromJSON } from './satchel/inv/InvLoader.js';
import { addInventoryToStore, createGridInventoryInStore, deleteInventoryFromStore, getInventoryInStore, getInventoryStore } from './inventory/InventoryStore.js';
import { connectAsServer, isServerSide } from './app/PeerSatchelConnector.js';
import { getCursorContext } from './inventory/CursorHelper.js';
import { getExistingInventory } from './inventory/InventoryTransfer.js';
import { uploadFile } from './util/uploader.js';
import { copyToClipboard, pasteFromClipboard } from './util/clipboard.js';
import { ItemBuilder } from './satchel/item/Item.js';
import { uuid } from './util/uuid.js';
import { ItemAlbumElement } from './satchel/album/ItemAlbumElement.js';
import { exportDataToJSON } from './session/SatchelDataLoader.js';
import { exportItemToString, importItemFromJSON, importItemFromString } from './satchel/item/ItemLoader.js';
import { importAlbumFromJSON } from './satchel/album/AlbumLoader.js';
import { addAlbumInStore, createAlbumInStore } from './satchel/album/AlbumStore.js';
import { copyAlbum } from './satchel/album/Album.js';
import { dispatchAlbumChange } from './satchel/album/AlbumEvents.js';
import { dispatchInventoryChange } from './satchel/inv/InvEvents.js';
import { closeFoundry, copyFoundry, isFoundryOpen, openFoundry } from './inventory/FoundryHelper.js';
import { ActivityPlayerList } from './satchel/peer/ActivityPlayerList.js';
import { ActivityPlayerInventory } from './satchel/peer/ActivityPlayerInventory.js';
import { dropItemOnGround } from './satchel/GroundAlbum.js';
import { forceEmptyStorage, loadFromStorage, saveToStorage } from './Storage.js';
import { addProfileInStore, deleteProfileInStore, getActiveProfileInStore, getProfileIdsInStore, getProfileInStore, hasActiveProfileInStore, setActiveProfileInStore } from './satchel/profile/ProfileStore.js';
import { loadSatchelProfilesFromData, saveSatchelProfilesToData } from './session/SatchelLoader.js';
import { createProfile } from './satchel/profile/Profile.js';
import { createGridInventory } from './satchel/inv/Inv.js';
import { dispatchProfileChange } from './satchel/profile/ProfileEvents.js';

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
  elementEventListener('#actionNewItem', 'click', onActionNewItem);

  elementEventListener('#actionShareItem', 'click', onActionShareItem);
  elementEventListener('#actionSettings', 'click', onActionSettings);

  elementEventListener('#actionItemCodeImport', 'click', onActionItemCodeImport);
  elementEventListener('#actionItemCodeExport', 'click', onActionItemCodeExport);
  elementEventListener('#actionFoundryReset', 'click', onActionFoundryReset);
  elementEventListener('#giftCodeExport', 'click', onGiftCodeExport);

  elementEventListener('#actionProfileEdit', 'click', onActionProfileEdit);
  elementEventListener('#actionProfileNew', 'click', onActionProfileNew);
  elementEventListener('#actionProfileDelete', 'click', onActionProfileDelete);
  elementEventListener('#actionProfileChange', 'click', onActionProfileChange);
  elementEventListener('#actionProfileSelect', 'input', onActionProfileChangeSubmit);
  elementEventListener('#actionProfileName', 'input', onActionProfileName);
  elementEventListener('#actionProfileInvNew', 'click', onActionProfileInvNew);
  elementEventListener('#actionProfileInvSubmit', 'click', onActionProfileInvSubmit);

  elementEventListener('#giftSubmit', 'click', onGiftSubmit);

  document.addEventListener('itemcontext', onItemContext);
});

function onActionShareItem() {
  /** @type {import('./satchel/item/ItemDialogElement.js').ItemDialogElement} */
  const itemEditor = document.querySelector('#itemDialog');
  const socketedItem = itemEditor.copySocketedItem();
  try {
    if (socketedItem) {
      /** @type {HTMLSelectElement} */
      let giftTarget = document.querySelector('#giftTarget');
      let ctx = getCursorContext();
      if (ctx.server && ctx.server.instance) {
        const localServer = /** @type {import('./app/PeerSatchel.js').SatchelServer} */ (ctx.server.instance);
        const playerNames = ActivityPlayerList.getPlayerNameListOnServer(localServer);
        let content = playerNames.map(clientName => `<option>${clientName.toLowerCase()}</option>`).join('\n');
        giftTarget.innerHTML = content;
      } else if (ctx.client && ctx.client.instance) {
        const localClient = /** @type {import('./app/PeerSatchel.js').SatchelClient} */ (ctx.client.instance);
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
    /** @type {import('./satchel/item/ItemDialogElement.js').ItemDialogElement} */
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
  /** @type {import('./satchel/item/ItemDialogElement.js').ItemDialogElement} */
  const itemDialog = document.querySelector('#itemDialog');
  const socketedItem = itemDialog.copySocketedItem();
  const itemString = exportItemToString(socketedItem);
  copyToClipboard(itemString).then(() => {
    window.alert('Copied to clipboard!\n\nShare this code with a friend, then import item by pasting in Foundry.');
  });
}

function onActionEraseAll() {
  forceEmptyStorage();
  window.location.reload();
}

function onActionAlbumNew() {
  const store = getInventoryStore();
  const albumId = uuid();
  createAlbumInStore(store, albumId);
  const albumContainer = document.querySelector('#albumList');
  const albumElement = new ItemAlbumElement();
  albumElement.albumId = albumId;
  albumContainer.appendChild(albumElement);
}

function onActionAlbumOpen(e) {
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

function onActionNewItem() {
  if (isFoundryOpen()) {
    let item = copyFoundry();
    if (item) {
      dropItemOnGround(item);
    } else {
      let newItem = new ItemBuilder().fromDefault().width(2).height(2).build();
      openFoundry(newItem);
    }
  } else {
    let newItem = new ItemBuilder().fromDefault().width(2).height(2).build();
    openFoundry(newItem);
  }
}

function onDownloadClick() {
  const timestamp = Date.now();
  if (isServerSide()) {
    let serverData;
    try {
      let string = loadFromStorage('server_data');
      serverData = JSON.parse(string);
    } catch {
      serverData = {};
    }
    const jsonData = exportDataToJSON('server_v1', serverData, {});
    const dataString = JSON.stringify(jsonData, null, 4);
    downloadText(`satchel-server-data-${timestamp}.json`, dataString);
  } else {
    const store = getInventoryStore();
    const activeProfile = getActiveProfileInStore(store);
    if (activeProfile) {
      const profileData = saveSatchelProfilesToData(store, [activeProfile.profileId]);
      const jsonData = exportDataToJSON('client_v1', profileData, {});
      const dataString = JSON.stringify(jsonData, null, 4);
      downloadText(`satchel-client-data-${timestamp}.json`, dataString);
    }
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
    case 'inv_v2':
    case 'inv_v1': {
      const store = getInventoryStore();
      let inv = getExistingInventory(store, 'main');
      importInventoryFromJSON(jsonData, inv);
      dispatchInventoryChange(store, 'main');
    } break;
    case 'album_v1': {
      const store = getInventoryStore();
      const album = importAlbumFromJSON(jsonData);
      const newAlbum = copyAlbum(album);
      addAlbumInStore(store, newAlbum.albumId, newAlbum);
      const albumContainer = document.querySelector('#albumList');
      const albumElement = new ItemAlbumElement();
      albumElement.albumId = newAlbum.albumId;
      albumContainer.appendChild(albumElement);
      dispatchAlbumChange(store, newAlbum.albumId);
    } break;
    case 'item_v1': {
      let item = importItemFromJSON(jsonData);
      dropItemOnGround(item);
    } break;
    case 'client_v1': {
      const store = getInventoryStore();
      const data = jsonData._data;
      try {
        loadSatchelProfilesFromData(store, data);
      } catch (e) {
        console.error('Failed to load client profile from file.');
        console.error(e);
      }
    } break;
    case 'server_v1': {
      const data = jsonData._data;
      saveToStorage('server_data', JSON.stringify(data));
      const ctx = getCursorContext();
      if (ctx.server && ctx.server.instance) {
        ActivityPlayerInventory.resetLocalServerData(ctx.server.instance, data);
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

  /** @type {import('./satchel/item/ItemDialogElement.js').ItemDialogElement} */
  const itemDialog = document.querySelector('#itemDialog');
  // @ts-ignore
  const { container, invId, itemId, clientX, clientY } = e.detail;
  if (invId && itemId) {
    itemDialog.openDialog(container, invId, itemId, clientX, clientY);
  }
  return false;
}

function onActionItemCodeExport() {
  /** @type {import('./satchel/item/ItemEditorElement.js').ItemEditorElement} */
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
  /** @type {import('./satchel/item/ItemEditorElement.js').ItemEditorElement} */
  const itemEditor = document.querySelector('#itemEditor');
  let itemString = await pasteFromClipboard();
  let newItem = importItemFromString(itemString);
  itemEditor.clearSocketedItem();
  itemEditor.putSocketedItem(newItem, true);
  window.alert('Pasted from clipboard!');
}

function onActionFoundryReset() {
  /** @type {import('./satchel/item/ItemEditorElement.js').ItemEditorElement} */
  const itemEditor = document.querySelector('#itemEditor');
  itemEditor.clearSocketedItem();
}

function onActionProfileEdit() {
  const store = getInventoryStore();
  if (!hasActiveProfileInStore(store)) {
    const profileIds = getProfileIdsInStore(store);
    if (profileIds.length > 0) {
      changeActiveProfile(store, profileIds[0]);
    } else {
      onActionProfileNew();
    }
  } else {
    const activeProfile = getActiveProfileInStore(store);
    /** @type {HTMLInputElement} */
    const actionProfileName = document.querySelector('#actionProfileName');
    actionProfileName.value = activeProfile.displayName;
    const activeProfileInvList = document.querySelector('#activeProfileInvList');
    activeProfileInvList.innerHTML = '';
    for(let invId of activeProfile.invs) {
      let inv = getInventoryInStore(store, invId);
      let element = document.createElement('li');
      element.textContent = `${inv.displayName || 'Inventory'} | ${inv.width} x ${inv.height}`;
      activeProfileInvList.appendChild(element);
    }
    /** @type {import('./app/DialogPromptElement.js').DialogPromptElement} */
    const profilesDialog = document.querySelector('#profilesDialog');
    profilesDialog.toggleAttribute('open', true);
  }
  return false;
}


function onActionProfileNew() {
  const store = getInventoryStore();
  const profileIds = getProfileIdsInStore(store);
  const displayName = `Satchel ${profileIds.length + 1}`;
  let newProfile = createProfile(uuid());
  newProfile.displayName = displayName;
  let newInv = createGridInventory(uuid(), 3, 3);
  newProfile.invs.push(newInv.invId);
  addInventoryToStore(store, newInv.invId, newInv);
  addProfileInStore(store, newProfile.profileId, newProfile);
  changeActiveProfile(store, newProfile.profileId);
  const actionProfileChange = document.querySelector('#actionProfileChange');
  actionProfileChange.toggleAttribute('disabled', profileIds.length < 1);
  return false;
}

function onActionProfileDelete() {
  const store = getInventoryStore();
  const activeProfile = getActiveProfileInStore(store);
  let profileIds = getProfileIdsInStore(store);
  let index = profileIds.indexOf(activeProfile.profileId);
  if (index >= 0) {
    profileIds.splice(index, 1);
  }
  for(let invId of activeProfile.invs) {
    let inv = getInventoryInStore(store, invId);
    deleteInventoryFromStore(store, invId, inv);
  }
  deleteProfileInStore(store, activeProfile.profileId, activeProfile);
  if (profileIds.length > 0) {
    changeActiveProfile(store, profileIds.shift());
  } else {
    onActionProfileNew();
  }
  const actionProfileChange = document.querySelector('#actionProfileChange');
  actionProfileChange.toggleAttribute('disabled', profileIds.length <= 1);
  return false;
}

function onActionProfileChangeSubmit() {
  /** @type {HTMLSelectElement} */
  const actionProfileSelect = document.querySelector('#actionProfileSelect');
  let value = actionProfileSelect.value;
  if (value) {
    const store = getInventoryStore();
    changeActiveProfile(store, value);
  }
  /** @type {import('./app/DialogPromptElement.js').DialogPromptElement} */
  const profileSelectDialog = document.querySelector('#profileSelectDialog');
  profileSelectDialog.toggleAttribute('open', false);
  return false;
}

function onActionProfileChange() {
  const actionProfileSelect = document.querySelector('#actionProfileSelect');
  const store = getInventoryStore();
  const profileIds = getProfileIdsInStore(store);
  actionProfileSelect.innerHTML = '';
  const activeProfile = getActiveProfileInStore(store);
  for(let profileId of profileIds) {
    let option = document.createElement('option');
    option.value = profileId;
    if (profileId === activeProfile.profileId) {
      option.toggleAttribute('selected', true);
    }
    let profile = getProfileInStore(store, profileId);
    option.textContent = profile.displayName;
    actionProfileSelect.appendChild(option);
  }
  /** @type {import('./app/DialogPromptElement.js').DialogPromptElement} */
  const profileSelectDialog = document.querySelector('#profileSelectDialog');
  profileSelectDialog.toggleAttribute('open', true);
  return false;
}

function changeActiveProfile(store, profileId) {
  setActiveProfileInStore(store, profileId);
  // Re-open dialog
  /** @type {import('./app/DialogPromptElement.js').DialogPromptElement} */
  const profilesDialog = document.querySelector('#profilesDialog');
  profilesDialog.toggleAttribute('open', false);
  onActionProfileEdit();
}

function onActionProfileName(e) {
  const store = getInventoryStore();
  const activeProfile = getActiveProfileInStore(store);
  if (!activeProfile) {
    return;
  }
  activeProfile.displayName = e.target.value;
  dispatchProfileChange(store, activeProfile.profileId);
  return false;
}

function onActionProfileInvNew() {
  /** @type {import('./app/DialogPromptElement.js').DialogPromptElement} */
  const profileInventoryDialog = document.querySelector('#profileInventoryDialog');
  profileInventoryDialog.toggleAttribute('open', true);
}

function onActionProfileInvSubmit() {
  const store = getInventoryStore();
  let activeProfile = getActiveProfileInStore(store);
  if (!activeProfile) {
    return;
  }
  /** @type {HTMLInputElement} */
  const actionProfileInvWidth = document.querySelector('#actionProfileInvWidth');
  /** @type {HTMLInputElement} */
  const actionProfileInvHeight = document.querySelector('#actionProfileInvHeight');
  let width = Math.min(99, Math.max(1, Number(actionProfileInvWidth.value) || 0));
  let height = Math.min(99, Math.max(1, Number(actionProfileInvHeight.value) || 0));
  const newInvId = uuid();
  createGridInventoryInStore(store, newInvId, width, height);
  activeProfile.invs.push(newInvId);
  dispatchProfileChange(store, activeProfile.profileId);

  /** @type {import('./app/DialogPromptElement.js').DialogPromptElement} */
  const profileInventoryDialog = document.querySelector('#profileInventoryDialog');
  profileInventoryDialog.toggleAttribute('open', false);
}
