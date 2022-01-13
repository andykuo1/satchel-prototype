import { dispatchProfileChange } from '../events/ProfileEvents.js';
import { loadSatchelProfilesFromData, saveSatchelProfilesToData } from '../loader/SatchelLoader.js';
import { resolveActiveProfile } from '../satchel/ActiveProfile.js';
import { createAlbum } from '../satchel/album/Album.js';
import { createGridInventory, createSocketInventory } from '../satchel/inv/Inv.js';
import { createProfile } from '../satchel/profile/Profile.js';
import { getAlbumInStore, isAlbumInStore, deleteAlbumInStore, addAlbumInStore } from '../store/AlbumStore.js';
import { createGridInvInStore, getInvInStore, deleteInvInStore, isInvInStore, addInvInStore } from '../store/InvStore.js';
import { addProfileInStore, deleteProfileInStore, getActiveProfileInStore, getProfileIdsInStore, getProfileInStore, isProfileInStore, setActiveProfileInStore } from '../store/ProfileStore.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { downloadText } from '../util/downloader.js';
import { uploadFile } from '../util/uploader.js';
import { uuid } from '../util/uuid.js';

/** @typedef {import('../components/lib/DialogPromptElement.js').DialogPromptElement} DialogPromptElement */

function el(selector, event, callback) {
  document.querySelector(selector).addEventListener(event, callback);
}

export function setupActionProfile() {
  el('#actionProfile', 'click', onActionProfile);
  el('#actionProfileNew', 'click', onActionProfileNew);
  el('#actionProfileImport', 'click', onActionProfileImport);
  el('#actionProfileInvNew', 'click', onActionProfileInvNew);
  el('#actionProfileInvSubmit', 'click', onActionProfileInvSubmit);
  el('#actionProfileEditName', 'input', onActionProfileEditName);
}

function onActionProfile() {
  const store = getSatchelStore();
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
  /** @type {DialogPromptElement} */
  const profilesDialog = document.querySelector('#profilesDialog');
  profilesDialog.toggleAttribute('open', true);
}

function onActionProfileActive(e) {
  const store = getSatchelStore();
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
  const store = getSatchelStore();
  const profileIds = getProfileIdsInStore(store);
  const displayName = `Satchel ${profileIds.length + 1}`;
  let newProfile = createProfile(uuid());
  newProfile.displayName = displayName;
  let newInv = createGridInvInStore(store, uuid(), 12, 9);
  newProfile.invs.push(newInv.invId);
  addProfileInStore(store, newProfile.profileId, newProfile);
  setActiveProfileInStore(store, newProfile.profileId);
  onActionProfile();
}

function onActionProfileEdit(e) {
  const store = getSatchelStore();
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
  /** @type {DialogPromptElement} */
  const profilesDialog = document.querySelector('#profilesDialog');
  profilesDialog.toggleAttribute('open', false);
  
  // Prepare edit dialog
  prepareEditProfileDialog(store, profileId);

  /** @type {DialogPromptElement} */
  const inventoriesDialog = document.querySelector('#inventoriesDialog');
  inventoriesDialog.toggleAttribute('open', true);
}

function onActionProfileEditName(e) {
  const store = getSatchelStore();
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
    let inv = getInvInStore(store, invId);
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
    default:
      window.alert('Cannot load json - this is not a profile.');
      return;
  }
  onActionProfile();
}

function onActionProfileExport(e) {
  const store = getSatchelStore();
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
  const store = getSatchelStore();
  /** @type {HTMLButtonElement} */
  const target = e.target;
  const profileId = target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  let profile = getProfileInStore(store, profileId);
  for(let invId of profile.invs) {
    let inv = getInvInStore(store, invId);
    deleteInvInStore(store, invId, inv);
  }
  deleteProfileInStore(store, profile.profileId, profile);
  onActionProfile();
}

function onActionProfileAlbumDelete(e) {
  if (!window.confirm('Are you sure you want to delete this inventory?')) {
    return;
  }
  const store = getSatchelStore();
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
  const store = getSatchelStore();
  const profileId = e.target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  const invId = e.target.getAttribute('data-inv');
  if (!isInvInStore(store, invId)) {
    return;
  }
  let profile = getProfileInStore(store, profileId);
  let i = profile.invs.indexOf(invId);
  if (i >= 0) {
    profile.invs.splice(i, 1);
    dispatchProfileChange(store, profileId);
  }
  let inv = getInvInStore(store, invId);
  deleteInvInStore(store, invId, inv);
  prepareEditProfileDialog(store, profileId);
}

function onActionProfileInvNew() {
  const store = getSatchelStore();
  const activeProfile = getActiveProfileInStore(store);
  if (!activeProfile) {
    return;
  }
  /** @type {DialogPromptElement} */
  const profileInventoryDialog = document.querySelector('#profileInventoryDialog');
  profileInventoryDialog.toggleAttribute('open', true);
}

function onActionProfileInvSubmit() {
  const store = getSatchelStore();
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
    addInvInStore(store, newInv.invId, newInv);
    activeProfile.invs.push(newInvId);
  }
  dispatchProfileChange(store, activeProfile.profileId);
  prepareEditProfileDialog(store, activeProfile.profileId);
  
  /** @type {DialogPromptElement} */
  const profileInventoryDialog = document.querySelector('#profileInventoryDialog');
  profileInventoryDialog.toggleAttribute('open', false);
}
