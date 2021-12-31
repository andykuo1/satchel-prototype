import { downloadText } from './util/downloader.js';
import { importInventoryFromJSON } from './satchel/inv/InvLoader.js';
import { addInventoryToStore, deleteInventoryFromStore, getInventoryInStore, getInventoryStore, isInventoryInStore } from './inventory/InventoryStore.js';
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
import { addProfileInStore, deleteProfileInStore, getActiveProfileInStore, getProfileIdsInStore, getProfileInStore, isProfileInStore, setActiveProfileInStore } from './satchel/profile/ProfileStore.js';
import { loadSatchelProfilesFromData, saveSatchelProfilesToData } from './session/SatchelLoader.js';
import { createProfile } from './satchel/profile/Profile.js';
import { dispatchProfileChange } from './satchel/profile/ProfileEvents.js';
import { resolveActiveProfile } from './satchel/ActiveProfile.js';
import { createGridInventory, createSocketInventory } from './satchel/inv/Inv.js';

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

  elementEventListener('#actionProfileEditName', 'input', onActionProfileEditName);

  elementEventListener('#actionProfile', 'click', onActionProfile);
  elementEventListener('#actionProfileNew', 'click', onActionProfileNew);

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

function onActionProfile() {
  const store = getInventoryStore();
  const profileIds = getProfileIdsInStore(store);
  const activeProfile = resolveActiveProfile(store);
  const rootContainerElement = document.querySelector('#activeProfileList');
  rootContainerElement.innerHTML = '';
  for(let profileId of profileIds) {
    let profile = getProfileInStore(store, profileId);
    let elementId = `activeProfile-${profileId}`;
    let element = document.createElement('input');
    element.type = 'radio';
    element.name = 'activeProfile';
    element.id = elementId;
    element.value = profileId;
    let isActive = profileId === activeProfile.profileId;
    if (isActive) {
      element.checked = true;
    }
    element.addEventListener('click', onActionProfileActive);
    let labelElement = document.createElement('label');
    labelElement.setAttribute('for', elementId);
    labelElement.textContent = profile.displayName;
    let editElement = document.createElement('icon-button');
    editElement.setAttribute('data-profile', profileId);
    editElement.setAttribute('icon', 'res/edit.svg');
    editElement.setAttribute('alt', 'edit');
    editElement.setAttribute('title', 'Edit Profile');
    editElement.addEventListener('click', onActionProfileEdit);
    let deleteElement = document.createElement('icon-button');
    deleteElement.setAttribute('data-profile', profileId);
    deleteElement.setAttribute('icon', 'res/delete.svg');
    deleteElement.setAttribute('alt', 'delete');
    deleteElement.setAttribute('title', 'Delete Profile');
    deleteElement.toggleAttribute('disabled', profileIds.length <= 1);
    deleteElement.addEventListener('click', onActionProfileDelete);
    let containerElement = document.createElement('div');
    containerElement.appendChild(element);
    containerElement.appendChild(labelElement);
    containerElement.appendChild(editElement);
    containerElement.appendChild(deleteElement);
    rootContainerElement.appendChild(containerElement);
  }
  /** @type {import('./app/DialogPromptElement.js').DialogPromptElement} */
  const profilesDialog = document.querySelector('#profilesDialog');
  profilesDialog.toggleAttribute('open', true);
}

function onActionProfileActive(e) {
  const store = getInventoryStore();
  let profileId = e.target.value;
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  let activeProfile = getActiveProfileInStore(store);
  if (activeProfile && activeProfile.profileId === profileId) {
    return;
  }
  setActiveProfileInStore(store, profileId);
  onActionProfile();
}

function onActionProfileNew() {
  const store = getInventoryStore();
  const profileIds = getProfileIdsInStore(store);
  const displayName = `Satchel ${profileIds.length + 1}`;
  let newProfile = createProfile(uuid());
  newProfile.displayName = displayName;
  addProfileInStore(store, newProfile.profileId, newProfile);
  setActiveProfileInStore(store, newProfile.profileId);
  onActionProfile();
}

function onActionProfileEdit(e) {
  const store = getInventoryStore();
  /** @type {HTMLButtonElement} */
  const target = e.target;
  const profileId = target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  const activeProfile = getActiveProfileInStore(store);
  if (activeProfile.profileId !== profileId) {
    setActiveProfileInStore(store, profileId);
  }
  /** @type {import('./app/DialogPromptElement.js').DialogPromptElement} */
  const profilesDialog = document.querySelector('#profilesDialog');
  profilesDialog.toggleAttribute('open', false);
  
  // Prepare edit dialog
  prepareEditProfileDialog(store, profileId);

  /** @type {import('./app/DialogPromptElement.js').DialogPromptElement} */
  const inventoriesDialog = document.querySelector('#inventoriesDialog');
  inventoriesDialog.toggleAttribute('open', true);
}

function onActionProfileEditName(e) {
  const store = getInventoryStore();
  const activeProfile = getActiveProfileInStore(store);
  if (!activeProfile) {
    return;
  }
  activeProfile.displayName = e.target.value;
  dispatchProfileChange(store, activeProfile.profileId);
}

function prepareEditProfileDialog(store, profileId) {
  const profile = getProfileInStore(store, profileId);
  const rootContainerElement = document.querySelector('#activeInventoryList');
  rootContainerElement.innerHTML = '';
  for(let invId of profile.invs) {
    let inv = getInventoryInStore(store, invId);
    let labelElement = document.createElement('label');
    labelElement.textContent = `${inv.displayName || 'Inventory'} | ${inv.width}⨯${inv.height}`;
    let deleteElement = document.createElement('icon-button');
    deleteElement.setAttribute('data-profile', profileId);
    deleteElement.setAttribute('data-inv', invId);
    deleteElement.setAttribute('icon', 'res/delete.svg');
    deleteElement.setAttribute('alt', 'delete');
    deleteElement.setAttribute('title', 'Delete Inventory');
    deleteElement.addEventListener('click', onActionProfileInvDelete);
    let containerElement = document.createElement('div');
    containerElement.appendChild(labelElement);
    containerElement.appendChild(deleteElement);
    rootContainerElement.appendChild(containerElement);
  }
  /** @type {HTMLInputElement} */
  const titleElement = document.querySelector('#actionProfileEditName');
  titleElement.value = profile.displayName;
}

function onActionProfileDelete(e) {
  if (!window.confirm('Are you sure you want to delete this profile?')) {
    return;
  }
  const store = getInventoryStore();
  /** @type {HTMLButtonElement} */
  const target = e.target;
  const profileId = target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  let profile = getProfileInStore(store, profileId);
  for(let invId of profile.invs) {
    let inv = getInventoryInStore(store, invId);
    deleteInventoryFromStore(store, invId, inv);
  }
  deleteProfileInStore(store, profile.profileId, profile);
  onActionProfile();
}

function onActionProfileInvDelete(e) {
  if (!window.confirm('Are you sure you want to delete this inventory?')) {
    return;
  }
  const store = getInventoryStore();
  const profileId = e.target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  const invId = e.target.getAttribute('data-inv');
  if (!isInventoryInStore(store, invId)) {
    return;
  }
  let profile = getProfileInStore(store, profileId);
  let i = profile.invs.indexOf(invId);
  if (i >= 0) {
    profile.invs.splice(i, 1);
    dispatchProfileChange(store, profileId);
  }
  let inv = getInventoryInStore(store, invId);
  deleteInventoryFromStore(store, invId, inv);
  prepareEditProfileDialog(store, profileId);
}

function onActionProfileInvNew() {
  const store = getInventoryStore();
  const activeProfile = getActiveProfileInStore(store);
  if (!activeProfile) {
    return;
  }
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
  const actionProfileInvType = document.querySelector('#actionProfileInvType');
  /** @type {HTMLInputElement} */
  const actionProfileInvTitle = document.querySelector('#actionProfileInvTitle');
  /** @type {HTMLInputElement} */
  const actionProfileInvWidth = document.querySelector('#actionProfileInvWidth');
  /** @type {HTMLInputElement} */
  const actionProfileInvHeight = document.querySelector('#actionProfileInvHeight');
  let type = actionProfileInvType.value;
  let title = actionProfileInvTitle.value.trim();
  let width = Math.min(99, Math.max(1, Number(actionProfileInvWidth.value) || 0));
  let height = Math.min(99, Math.max(1, Number(actionProfileInvHeight.value) || 0));
  const newInvId = uuid();
  let newInv;
  switch(type) {
    case 'grid':
      newInv = createGridInventory(newInvId, width, height);
      break;
    case 'socket':
      newInv = createSocketInventory(newInvId);
      break;
    default:
      throw new Error('Unknown inventory type.');
  }
  newInv.displayName = title;
  addInventoryToStore(store, newInv.invId, newInv);
  activeProfile.invs.push(newInvId);
  dispatchProfileChange(store, activeProfile.profileId);
  prepareEditProfileDialog(store, activeProfile.profileId);
  /** @type {import('./app/DialogPromptElement.js').DialogPromptElement} */
  const profileInventoryDialog = document.querySelector('#profileInventoryDialog');
  profileInventoryDialog.toggleAttribute('open', false);
}
