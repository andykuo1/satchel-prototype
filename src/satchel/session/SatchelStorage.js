import { getAlbumIdsInStore } from '../../store/AlbumStore.js';
import { getSatchelStore } from '../../store/SatchelStore.js';
import { loadFromStorage, saveToStorage } from '../../Storage.js';
import { getProfileIdsInStore } from '../../store/ProfileStore.js';
import {
  loadSatchelAlbumsFromData,
  loadSatchelProfilesFromData,
  saveSatchelAlbumsToData,
  saveSatchelProfilesToData,
} from '../../loader/SatchelLoader.js';
import { isAlbumHidden } from '../album/Album.js';
import { isProfileRemote } from '../RemoteProfile.js';

export function loadSatchelFromStorage() {
  const store = getSatchelStore();

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
      loadSatchelAlbumsFromData(store, jsonData, true);
    } catch (e) {
      console.error('Failed to load album from storage.');
      console.error(e);
    }
  }
}

export function saveSatchelToStorage() {
  const store = getSatchelStore();
  try {
    let profileIds = getProfileIdsInStore(store);
    // Do not save remote profiles
    profileIds.filter(profileId => !isProfileRemote(store, profileId));
    let profileData = saveSatchelProfilesToData(store, profileIds);
    saveToStorage('satchel_data_v4', JSON.stringify(profileData));
  } catch (e) {
    console.error(e);
  }
  try {
    let albumIds = getAlbumIdsInStore(store);
    // Do not save hidden albums
    albumIds.filter(albumId => !isAlbumHidden(store, albumId));
    let albumData = saveSatchelAlbumsToData(store, albumIds);
    saveToStorage('satchel_album_v3', JSON.stringify(albumData));
  } catch (e) {
    console.error(e);
  }
}
