import { downloadText } from './util/downloader.js';
import { addInventoryToStore, createGridInventoryInStore, deleteInventoryFromStore, getInventoryInStore, getInventoryStore, isInventoryInStore } from './store/SatchelStore.js';
import { connectAsServer } from './satchel/app/PeerSatchelConnector.js';
import { getCursorContext } from './satchel/inv/CursorHelper.js';
import { uploadFile } from './util/uploader.js';
import { copyToClipboard, pasteFromClipboard } from './util/clipboard.js';
import { ItemBuilder } from './satchel/item/Item.js';
import { uuid } from './util/uuid.js';
import { ItemAlbumElement } from './components/album/ItemAlbumElement.js';
import { exportItemToString, importItemFromJSON, importItemFromString } from './loader/ItemLoader.js';
import { importAlbumFromJSON } from './loader/AlbumLoader.js';
import { addAlbumInStore, createAlbumInStore, deleteAlbumInStore, getAlbumIdsInStore, getAlbumInStore, isAlbumInStore } from './store/AlbumStore.js';
import { copyAlbum, createAlbum, isAlbumHidden } from './satchel/album/Album.js';
import { dispatchAlbumChange } from './events/AlbumEvents.js';
import { clearFoundry, closeFoundry, copyFoundry, isFoundryOpen, openFoundry } from './satchel/inv/FoundryHelper.js';
import { ActivityPlayerList } from './satchel/peer/ActivityPlayerList.js';
import { dropItemOnGround, isGroundAlbum } from './satchel/GroundAlbum.js';
import { forceEmptyStorage } from './Storage.js';
import { addProfileInStore, deleteProfileInStore, getActiveProfileInStore, getProfileIdsInStore, getProfileInStore, isProfileInStore, setActiveProfileInStore } from './store/ProfileStore.js';
import { loadSatchelFromData, loadSatchelProfilesFromData, saveSatchelProfilesToData, saveSatchelToData } from './satchel/session/SatchelLoader.js';
import { createProfile } from './satchel/profile/Profile.js';
import { dispatchProfileChange } from './events/ProfileEvents.js';
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

  elementEventListener('#actionShareItem', 'click', onActionShareItem);
  elementEventListener('#actionSettings', 'click', onActionSettings);

  elementEventListener('#actionItemCodeImport', 'click', onActionItemCodeImport);
  elementEventListener('#actionItemCodeExport', 'click', onActionItemCodeExport);
  elementEventListener('#actionItemDuplicate', 'click', onActionItemDuplicate);
  elementEventListener('#actionFoundryReset', 'click', onActionFoundryReset);
  elementEventListener('#actionFoundryNew', 'click', onActionFoundryNew);
  elementEventListener('#giftCodeExport', 'click', onGiftCodeExport);

  elementEventListener('#actionProfileEditName', 'input', onActionProfileEditName);

  elementEventListener('#actionProfile', 'click', onActionProfile);
  elementEventListener('#actionProfileNew', 'click', onActionProfileNew);
  elementEventListener('#actionProfileImport', 'click', onActionProfileImport);

  elementEventListener('#actionProfileInvNew', 'click', onActionProfileInvNew);
  elementEventListener('#actionProfileInvSubmit', 'click', onActionProfileInvSubmit);

  elementEventListener('#giftSubmit', 'click', onGiftSubmit);

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
  const store = getInventoryStore();
  const albumId = uuid();
  createAlbumInStore(store, albumId);
  const albumContainer = document.querySelector('#albumList');
  const albumElement = new ItemAlbumElement();
  albumElement.albumId = albumId;
  albumContainer.appendChild(albumElement);
}

function onActionAlbumOpen() {
  const store = getInventoryStore();
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

function onActionItemDuplicate() {
  if (!isFoundryOpen()) {
    return;
  }
  const newItem = copyFoundry();
  if (newItem) {
    dropItemOnGround(newItem);
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
  const store = getInventoryStore();
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
      const store = getInventoryStore();
      try {
        loadSatchelFromData(store, jsonData, true);
      } catch (e) {
        console.error('Failed to load satchel from file.');
        console.error(e);
      }
    } break;
    case 'profile_v2': {
      const store = getInventoryStore();
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
      const store = getInventoryStore();
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
    let exportElement = document.createElement('icon-button');
    exportElement.setAttribute('data-profile', profileId);
    exportElement.setAttribute('icon', 'res/download.svg');
    exportElement.setAttribute('alt', 'export');
    exportElement.setAttribute('title', 'Export Profile');
    exportElement.addEventListener('click', onActionProfileExport);
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
    containerElement.appendChild(exportElement);
    containerElement.appendChild(deleteElement);
    rootContainerElement.appendChild(containerElement);
  }
  /** @type {import('./components/lib/DialogPromptElement.js').DialogPromptElement} */
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
  let newInv = createGridInventoryInStore(store, uuid(), 12, 9);
  newProfile.invs.push(newInv.invId);
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
  /** @type {import('./components/lib/DialogPromptElement.js').DialogPromptElement} */
  const profilesDialog = document.querySelector('#profilesDialog');
  profilesDialog.toggleAttribute('open', false);
  
  // Prepare edit dialog
  prepareEditProfileDialog(store, profileId);

  /** @type {import('./components/lib/DialogPromptElement.js').DialogPromptElement} */
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
  for(let albumId of profile.albums) {
    let album = getAlbumInStore(store, albumId);
    let labelElement = document.createElement('label');
    labelElement.textContent = `${album.displayName || 'Inventory'} | ∞`;
    let deleteElement = document.createElement('icon-button');
    deleteElement.setAttribute('data-profile', profileId);
    deleteElement.setAttribute('data-album', albumId);
    deleteElement.setAttribute('icon', 'res/delete.svg');
    deleteElement.setAttribute('alt', 'delete');
    deleteElement.setAttribute('title', 'Delete Inventory');
    deleteElement.addEventListener('click', onActionProfileAlbumDelete);
    let containerElement = document.createElement('div');
    containerElement.appendChild(labelElement);
    containerElement.appendChild(deleteElement);
    rootContainerElement.appendChild(containerElement);
  }
  /** @type {HTMLInputElement} */
  const titleElement = document.querySelector('#actionProfileEditName');
  titleElement.value = profile.displayName;
  /** @type {HTMLOutputElement} */
  const outputElement = document.querySelector('#outputProfileEditId');
  outputElement.textContent = profileId;
}

async function onActionProfileImport() {
  let files = await uploadFile('.json');
  let file = files[0];

  let jsonData;
  try {
    jsonData = JSON.parse(await file.text());
  } catch {
    window.alert('Cannot load file with invalid json format.');
  }

  switch(jsonData._type) {
    case 'profile_v2': {
      const store = getInventoryStore();
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
    default:
      window.alert('Cannot load json - this is not a profile.');
      return;
  }
  onActionProfile();
}

function onActionProfileExport(e) {
  const store = getInventoryStore();
  /** @type {HTMLButtonElement} */
  const target = e.target;
  const profileId = target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  const profile = getProfileInStore(store, profileId);
  const name = profile.displayName || 'Profile';
  const json = saveSatchelProfilesToData(store, [profile.profileId]);
  downloadText(`${name}-profile.json`, JSON.stringify(json, null, 4));
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

function onActionProfileAlbumDelete(e) {
  if (!window.confirm('Are you sure you want to delete this inventory?')) {
    return;
  }
  const store = getInventoryStore();
  const profileId = e.target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  const albumId = e.target.getAttribute('data-album');
  if (!isAlbumInStore(store, albumId)) {
    return;
  }
  let profile = getProfileInStore(store, profileId);
  let i = profile.albums.indexOf(albumId);
  if (i >= 0) {
    profile.albums.splice(i, 1);
    dispatchProfileChange(store, profileId);
  }
  let album = getAlbumInStore(store, albumId);
  deleteAlbumInStore(store, albumId, album);
  prepareEditProfileDialog(store, profileId);
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
  /** @type {import('./components/lib/DialogPromptElement.js').DialogPromptElement} */
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
  if (type === 'space') {
    const newAlbumId = uuid();
    const newAlbum = createAlbum(newAlbumId);
    newAlbum.displayName = title;
    newAlbum.hidden = true;
    addAlbumInStore(store, newAlbumId, newAlbum);
    activeProfile.albums.push(newAlbumId);
  } else {
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
  }
  dispatchProfileChange(store, activeProfile.profileId);
  prepareEditProfileDialog(store, activeProfile.profileId);
  
  /** @type {import('./components/lib/DialogPromptElement.js').DialogPromptElement} */
  const profileInventoryDialog = document.querySelector('#profileInventoryDialog');
  profileInventoryDialog.toggleAttribute('open', false);
}
