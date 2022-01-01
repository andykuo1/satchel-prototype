import {
  getAlbumIdsInStore,
} from '../satchel/album/AlbumStore.js';
import {
  getInventoryStore,
} from '../inventory/InventoryStore.js';
import { loadFromStorage, saveToStorage } from '../Storage.js';
import { getProfileIdsInStore } from '../satchel/profile/ProfileStore.js';
import { loadSatchelAlbumsFromData, loadSatchelProfilesFromData, saveSatchelAlbumsToData, saveSatchelProfilesToData } from './SatchelLoader.js';

export function loadSatchelFromStorage() {
  const store = getInventoryStore();

  // Load from storage...
  let satchelData = loadFromStorage('satchel_data_v4');
  if (satchelData) {
    try {
      let jsonData = JSON.parse(satchelData);
      loadSatchelProfilesFromData(store, jsonData, true);
    } catch (e) {
      console.error('Failed to load satchel from storage.');
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
}

export function saveSatchelToStorage() {
  const store = getInventoryStore();
  try {
    let profileIds = getProfileIdsInStore(store);
    let profileData = saveSatchelProfilesToData(store, profileIds);
    saveToStorage('satchel_data_v4', JSON.stringify(profileData));
  } catch (e) {
    console.error(e);
  }
  try {
    let albumIds = getAlbumIdsInStore(store);
    let albumData = saveSatchelAlbumsToData(store, albumIds);
    saveToStorage('satchel_album_v3', JSON.stringify(albumData));
  } catch (e) {
    console.error(e);
  }
}
