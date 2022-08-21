import { isAlbumHidden } from '../satchel/album/Album.js';
import { exportAlbumToJSON, importAlbumFromJSON } from './AlbumLoader.js';
import { getAlbumIdsInStore } from '../store/AlbumStore.js';
import { cloneInventory, copyInventory } from '../satchel/inv/Inv.js';
import { dispatchInventoryChange } from '../events/InvEvents.js';
import { exportInventoryToJSON, importInventoryFromJSON } from './InvLoader.js';
import { cloneProfile, copyProfile } from '../satchel/profile/Profile.js';
import { dispatchProfileChange } from '../events/ProfileEvents.js';
import { exportProfileToJSON, importProfileFromJSON } from './ProfileLoader.js';
import {
  addProfileInStore,
  getProfileIdsInStore,
  getProfileInStore,
  isProfileInStore,
  setActiveProfileInStore,
} from '../store/ProfileStore.js';
import { exportDataToJSON, importDataFromJSON } from './DataLoader.js';
import { isInvInStore, getInvInStore, addInvInStore } from '../store/InvStore.js';
import { getFoundryAlbumId, isFoundryAlbum } from '../satchel/FoundryAlbum.js';
import { getGroundAlbumId, isGroundAlbum } from '../satchel/GroundAlbum.js';
import { getTrashAlbumId, isTrashAlbum } from '../satchel/TrashAlbum.js';
import { Logger } from '../util/Logger.js';

const LOGGER = new Logger('SatchelLoader');

export function loadSatchelFromData(store, jsonData, overrideData) {
  return importDataFromJSON(jsonData, 'satchel_v2', (data) => {
    const { profiles, albums } = data;
    try {
      loadSatchelProfilesFromData(store, profiles, overrideData);
    } catch (e) {
      LOGGER.error('Failed to load satchel from data', e);
    }
    try {
      loadSatchelAlbumsFromData(store, albums, overrideData);
    } catch (e) {
      LOGGER.error('Failed to load album from data', e);
    }
  });
}

export function saveSatchelToData(store, dst = {}) {
  const profileIds = getProfileIdsInStore(store);
  const albumIds = getAlbumIdsInStore(store);
  // Do not save hidden albums
  albumIds.filter((albumId) => !isAlbumHidden(store, albumId));
  const profilesData = saveSatchelProfilesToData(store, profileIds);
  const albumsData = saveSatchelAlbumsToData(store, albumIds);
  const data = {
    profiles: profilesData,
    albums: albumsData,
  };
  return exportDataToJSON('satchel_v2', data, {}, dst);
}

export function loadSatchelProfilesFromData(store, jsonData, overrideData, changeActive = true) {
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
          addInvInStore(store, newInv.invId, newInv);
        } else {
          if (isInvInStore(store, invId)) {
            const oldInv = getInvInStore(store, invId);
            cloneInventory(inv, oldInv);
            dispatchInventoryChange(store, invId);
          } else {
            addInvInStore(store, invId, inv);
          }
        }
      }
    }
    for (let albumId of Object.keys(inAlbums)) {
      let albumJson = inAlbums[albumId];
      if (albumJson) {
        const album = importAlbumFromJSON(albumJson);
        if (!overrideData) {
          const newAlbum = copyInventory(album);
          overrideAlbumIds[albumId] = newAlbum.invId;
          addInvInStore(store, newAlbum.invId, newAlbum);
        } else {
          if (isInvInStore(store, albumId)) {
            const oldAlbum = getInvInStore(store, albumId);
            cloneInventory(album, oldAlbum);
            dispatchInventoryChange(store, albumId);
          } else {
            addInvInStore(store, albumId, album);
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
        .filter((invId) => isInvInStore(store, invId));
      // NOTE: Same with albums
      profile.albums = profile.albums
        .map((albumId) => overrideAlbumIds[albumId] || albumId)
        .filter((albumId) => isInvInStore(store, albumId));
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
    // Change profile to the newly loaded one.
    if (result.length > 0 && changeActive) {
      setActiveProfileInStore(store, result[0]);
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
        let inv = getInvInStore(store, invId);
        outInvs[invId] = exportInventoryToJSON(inv);
      }
      for (let albumId of profile.albums) {
        let album = getInvInStore(store, albumId);
        outAlbums[albumId] = exportAlbumToJSON(album);
      }
      outProfiles.push(exportProfileToJSON(profile));
    } catch (e) {
      LOGGER.error('Failed to save satchel profiles to data', e);
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
  let result = [];
  let inAlbums = jsonData.albums;
  for (let albumJson of inAlbums) {
    const album = importAlbumFromJSON(albumJson);
    const albumId = album.invId;
    if (!overrideData) {
      const newAlbum = copyInventory(album);
      addInvInStore(store, newAlbum.invId, newAlbum);
      result.push(newAlbum.invId);
    } else {
      // HACK: Named albums are hacky. There's gotta be a better way to manage them.
      if (isFoundryAlbum(album)) {
        let internalAlbumId = getFoundryAlbumId(store);
        let internalAlbum = cloneInventory(album, getInvInStore(store, internalAlbumId));
        internalAlbum.invId = internalAlbumId;
        dispatchInventoryChange(store, internalAlbumId);
        result.push(internalAlbumId);
      } else if (isGroundAlbum(album)) {
        let internalAlbumId = getGroundAlbumId(store);
        let internalAlbum = cloneInventory(album, getInvInStore(store, internalAlbumId));
        internalAlbum.invId = internalAlbumId;
        dispatchInventoryChange(store, internalAlbumId);
        result.push(internalAlbumId);
      } else if (isTrashAlbum(album)) {
        let internalAlbumId = getTrashAlbumId(store);
        let internalAlbum = cloneInventory(album, getInvInStore(store, internalAlbumId));
        internalAlbum.invId = internalAlbumId;
        dispatchInventoryChange(store, internalAlbumId);
        result.push(internalAlbumId);
      } else if (isInvInStore(store, albumId)) {
        const oldAlbum = getInvInStore(store, albumId);
        cloneInventory(album, oldAlbum);
        dispatchInventoryChange(store, albumId);
        result.push(albumId);
      } else {
        addInvInStore(store, albumId, album);
        result.push(albumId);
      }
    }
  }
  return result;
}

export function saveSatchelAlbumsToData(store, albumIds, dst = {}) {
  let outAlbums = [];
  for (let albumId of albumIds) {
    let album = getInvInStore(store, albumId);
    try {
      outAlbums.push(exportAlbumToJSON(album));
    } catch (e) {
      LOGGER.error('Failed to save satchel albums to data', e);
    }
  }
  dst.albums = outAlbums;
  return dst;
}
