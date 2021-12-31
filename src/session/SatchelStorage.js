import {
  getAlbumIdsInStore,
} from '../satchel/album/AlbumStore.js';
import { exportInventoryToJSON, importInventoryFromJSON } from '../satchel/inv/InvLoader.js';
import {
  createGridInventoryInStore,
  getInventoryInStore,
  getInventoryStore,
  isInventoryInStore,
} from '../inventory/InventoryStore.js';
import { dispatchInventoryChange } from '../satchel/inv/InvEvents.js';
import { loadFromStorage, saveToStorage } from '../Storage.js';
import { getProfileIdsInStore } from '../satchel/profile/ProfileStore.js';
import { loadSatchelAlbumsFromData, loadSatchelProfilesFromData, saveSatchelAlbumsToData, saveSatchelProfilesToData } from './SatchelLoader.js';

export function loadSatchelFromStorage() {
  const store = getInventoryStore();

  // Resolve store data
  let mainInventory;
  if (isInventoryInStore(store, 'main')) {
    mainInventory = getInventoryInStore(store, 'main');
  } else {
    mainInventory = createGridInventoryInStore(store, 'main', 12, 7);
  }

  // Load from storage...
  let invData = loadFromStorage('satchel_data_v3');
  if (invData) {
    try {
      let jsonData = JSON.parse(invData);
      importInventoryFromJSON(jsonData, mainInventory);
      mainInventory.displayName = '';
      dispatchInventoryChange(store, mainInventory.invId);
    } catch (e) {
      console.error('Failed to load inventory from storage.');
      console.error(e);
    }
  }
  let albumData = loadFromStorage('satchel_album_v3');
  if (albumData) {
    try {
      let jsonData = JSON.parse(albumData);
      loadSatchelAlbumsFromData(store, jsonData);
    } catch (e) {
      console.error('Failed to load album from storage.');
      console.error(e);
    }
  }
  let profileData = loadFromStorage('satchel_profile_v1');
  if (profileData) {
    try {
      let jsonData = JSON.parse(profileData);
      loadSatchelProfilesFromData(store, jsonData);
    } catch (e) {
      console.error('Failed to load profile from storage.');
      console.error(e);
    }
  }
}

export function saveSatchelToStorage() {
  const store = getInventoryStore();
  if (isInventoryInStore(store, 'main')) {
    try {
      let mainInventory = getInventoryInStore(store, 'main');
      let invData = exportInventoryToJSON(mainInventory);
      saveToStorage('satchel_data_v3', JSON.stringify(invData));
    } catch (e) {
      console.error(e);
    }
  }

  let albumIds = getAlbumIdsInStore(store);
  let albumData = saveSatchelAlbumsToData(store, albumIds);
  saveToStorage('satchel_album_v3', JSON.stringify(albumData));

  let profileIds = getProfileIdsInStore(store);
  let profileData = saveSatchelProfilesToData(store, profileIds);
  saveToStorage('satchel_profile_v1', JSON.stringify(profileData));
}
