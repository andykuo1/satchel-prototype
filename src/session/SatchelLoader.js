import { addInventoryToStore, getInventoryInStore, isInventoryInStore } from '../inventory/InventoryStore.js';
import { cloneAlbum } from '../satchel/album/Album.js';
import { dispatchAlbumChange } from '../satchel/album/AlbumEvents.js';
import { exportAlbumToJSON, importAlbumFromJSON } from '../satchel/album/AlbumLoader.js';
import { addAlbumInStore, getAlbumInStore, isAlbumInStore } from '../satchel/album/AlbumStore.js';
import { cloneInventory, copyInventory } from '../satchel/inv/Inv.js';
import { dispatchInventoryChange } from '../satchel/inv/InvEvents.js';
import { exportInventoryToJSON, importInventoryFromJSON } from '../satchel/inv/InvLoader.js';
import { cloneProfile, copyProfile } from '../satchel/profile/Profile.js';
import { dispatchProfileChange } from '../satchel/profile/ProfileEvents.js';
import { exportProfileToJSON, importProfileFromJSON } from '../satchel/profile/ProfileLoader.js';
import { addProfileInStore, getProfileInStore, isProfileInStore } from '../satchel/profile/ProfileStore.js';
import { exportDataToJSON, importDataFromJSON } from './SatchelDataLoader.js';

export function loadSatchelProfilesFromData(store, jsonData, overrideData) {
  return importDataFromJSON(jsonData, 'satchel_v1', (data) => {
    let result = [];
    let inProfiles = data.profiles;
    let inInvs = data.invdata;
    let overrideInvIds = {};
    for(let invId of Object.keys(inInvs)) {
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
    for(let profileJson of inProfiles) {
      const profile = importProfileFromJSON(profileJson);
      const profileId = profile.profileId;
      // NOTE: Transform to use new inv ids and make sure we don't link inventories that cannot be loaded.
      profile.invs = profile.invs
        .map(invId => overrideInvIds[invId] || invId)
        .filter(invId => isInventoryInStore(store, invId));
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
  for(let profileId of profileIds) {
    let profile = getProfileInStore(store, profileId);
    try {
      for(let invId of profile.invs) {
        let inv = getInventoryInStore(store, invId);
        outInvs[invId] = exportInventoryToJSON(inv);
      }
      outProfiles.push(exportProfileToJSON(profile));
    } catch (e) {
      console.error(e);
    }
  }
  let result = {
    profiles: outProfiles,
    invdata: outInvs,
  };
  return exportDataToJSON('satchel_v1', result, {}, dst);
}

export function loadSatchelAlbumsFromData(store, jsonData) {
  let inAlbums = jsonData.albums;
  for (let albumJson of inAlbums) {
    const album = importAlbumFromJSON(albumJson);
    const albumId = album.albumId;
    if (isAlbumInStore(store, albumId)) {
      const oldAlbum = getAlbumInStore(store, albumId);
      cloneAlbum(album, oldAlbum);
      dispatchAlbumChange(store, albumId);
    } else {
      addAlbumInStore(store, albumId, album);
    }
  }
}

export function saveSatchelAlbumsToData(store, albumIds, dst = {}) {
  let outAlbums = [];
  for(let albumId of albumIds) {
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
