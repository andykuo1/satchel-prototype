import { addInventoryToStore, getInventoryInStore, isInventoryInStore } from '../../store/SatchelStore.js';
import { cloneAlbum, copyAlbum, isAlbumHidden } from '../album/Album.js';
import { dispatchAlbumChange } from '../../events/AlbumEvents.js';
import { exportAlbumToJSON, importAlbumFromJSON } from '../../loader/AlbumLoader.js';
import {
  addAlbumInStore,
  getAlbumIdsInStore,
  getAlbumInStore,
  isAlbumInStore,
} from '../../store/AlbumStore.js';
import { cloneInventory, copyInventory } from '../inv/Inv.js';
import { dispatchInventoryChange } from '../../events/InvEvents.js';
import { exportInventoryToJSON, importInventoryFromJSON } from '../../loader/InvLoader.js';
import { cloneProfile, copyProfile } from '../profile/Profile.js';
import { dispatchProfileChange } from '../../events/ProfileEvents.js';
import { exportProfileToJSON, importProfileFromJSON } from '../../loader/ProfileLoader.js';
import {
  addProfileInStore,
  getProfileIdsInStore,
  getProfileInStore,
  isProfileInStore,
} from '../../store/ProfileStore.js';
import { exportDataToJSON, importDataFromJSON } from './SatchelDataLoader.js';

export function loadSatchelFromData(store, jsonData, overrideData) {
  return importDataFromJSON(jsonData, 'satchel_v2', (data) => {
    const { profiles, albums } = data;
    try {
      loadSatchelProfilesFromData(store, profiles, overrideData);
    } catch (e) {
      console.error('Failed to load satchel from data.');
      console.error(e);
    }
    try {
      loadSatchelAlbumsFromData(store, albums, overrideData);
    } catch (e) {
      console.error('Failed to load album from data.');
      console.error(e);
    }
  });
}

export function saveSatchelToData(store, dst = {}) {
  const profileIds = getProfileIdsInStore(store);
  const albumIds = getAlbumIdsInStore(store);
  // Do not save hidden albums
  albumIds.filter(albumId => !isAlbumHidden(store, albumId));
  const profilesData = saveSatchelProfilesToData(store, profileIds);
  const albumsData = saveSatchelAlbumsToData(store, albumIds);
  const data = {
    profiles: profilesData,
    albums: albumsData,
  };
  return exportDataToJSON('satchel_v2', data, {}, dst);
}

export function loadSatchelProfilesFromData(store, jsonData, overrideData) {
  return importDataFromJSON(jsonData, 'profile_v2', (data) => {
    let result = [];
    let inProfiles = data.profdata;
    let inInvs = data.invdata;
    let inAlbums = data.albdata;
    let overrideInvIds = {};
    let overrideAlbumIds = {};
    for (let invId of Object.keys(inInvs)) {
      let invJson = inInvs[invId];
      if (invJson) {
        const inv = importInventoryFromJSON(invJson);
        if (!overrideData) {
          const newInv = copyInventory(inv);
          overrideInvIds[invId] = newInv.invId;
          addInventoryToStore(store, newInv.invId, newInv);
        } else {
          if (isInventoryInStore(store, invId)) {
            const oldInv = getInventoryInStore(store, invId);
            cloneInventory(inv, oldInv);
            dispatchInventoryChange(store, invId);
          } else {
            addInventoryToStore(store, invId, inv);
          }
        }
      }
    }
    for(let albumId of Object.keys(inAlbums)) {
      let albumJson = inAlbums[albumId];
      if (albumJson) {
        const album = importAlbumFromJSON(albumJson);
        if (!overrideData) {
          const newAlbum = copyAlbum(album);
          overrideAlbumIds[albumId] = newAlbum.albumId;
          addAlbumInStore(store, newAlbum.albumId, newAlbum);
        } else {
          if (isAlbumInStore(store, albumId)) {
            const oldAlbum = getAlbumInStore(store, albumId);
            cloneAlbum(album, oldAlbum);
            dispatchAlbumChange(store, albumId);
          } else {
            addAlbumInStore(store, albumId, album);
          }
        }
      }
    }
    for (let profileJson of inProfiles) {
      const profile = importProfileFromJSON(profileJson);
      const profileId = profile.profileId;
      // NOTE: Transform to use new inv ids and make sure we don't link inventories that cannot be loaded.
      profile.invs = profile.invs
        .map((invId) => overrideInvIds[invId] || invId)
        .filter((invId) => isInventoryInStore(store, invId));
      // NOTE: Same with albums
      profile.albums = profile.albums
        .map((albumId) => overrideAlbumIds[albumId] || albumId)
        .filter((albumId) => isAlbumInStore(store, albumId));
      if (!overrideData) {
        const newProfile = copyProfile(store, profile);
        addProfileInStore(store, newProfile.profileId, newProfile);
        result.push(newProfile.profileId);
      } else {
        if (isProfileInStore(store, profileId)) {
          const oldProfile = getProfileInStore(store, profileId);
          cloneProfile(profile, oldProfile);
          dispatchProfileChange(store, profileId);
        } else {
          addProfileInStore(store, profileId, profile);
        }
        result.push(profileId);
      }
    }
    return result;
  });
}

export function saveSatchelProfilesToData(store, profileIds, dst = {}) {
  let outProfiles = [];
  let outInvs = {};
  let outAlbums = {};
  for (let profileId of profileIds) {
    let profile = getProfileInStore(store, profileId);
    try {
      for (let invId of profile.invs) {
        let inv = getInventoryInStore(store, invId);
        outInvs[invId] = exportInventoryToJSON(inv);
      }
      for(let albumId of profile.albums) {
        let album = getAlbumInStore(store, albumId);
        outAlbums[albumId] = exportAlbumToJSON(album);
      }
      outProfiles.push(exportProfileToJSON(profile));
    } catch (e) {
      console.error(e);
    }
  }
  let result = {
    profdata: outProfiles,
    invdata: outInvs,
    albdata: outAlbums,
  };
  return exportDataToJSON('profile_v2', result, {}, dst);
}

export function loadSatchelAlbumsFromData(store, jsonData, overrideData) {
  let inAlbums = jsonData.albums;
  for (let albumJson of inAlbums) {
    const album = importAlbumFromJSON(albumJson);
    const albumId = album.albumId;
    if (!overrideData) {
      const newAlbum = copyAlbum(album);
      addAlbumInStore(store, newAlbum.albumId, newAlbum);
    } else {
      if (isAlbumInStore(store, albumId)) {
        const oldAlbum = getAlbumInStore(store, albumId);
        cloneAlbum(album, oldAlbum);
        dispatchAlbumChange(store, albumId);
      } else {
        addAlbumInStore(store, albumId, album);
      }
    }
  }
}

export function saveSatchelAlbumsToData(store, albumIds, dst = {}) {
  let outAlbums = [];
  for (let albumId of albumIds) {
    let album = getAlbumInStore(store, albumId);
    try {
      outAlbums.push(exportAlbumToJSON(album));
    } catch (e) {
      console.error(e);
    }
  }
  dst.albums = outAlbums;
  return dst;
}
