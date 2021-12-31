import { addInventoryToStore, getInventoryInStore, isInventoryInStore } from '../inventory/InventoryStore.js';
import { cloneAlbum } from '../satchel/album/Album.js';
import { dispatchAlbumChange } from '../satchel/album/AlbumEvents.js';
import { exportAlbumToJSON, importAlbumFromJSON } from '../satchel/album/AlbumLoader.js';
import { addAlbumInStore, getAlbumInStore, isAlbumInStore } from '../satchel/album/AlbumStore.js';
import { cloneInventory } from '../satchel/inv/Inv.js';
import { dispatchInventoryChange } from '../satchel/inv/InvEvents.js';
import { exportInventoryToJSON, importInventoryFromJSON } from '../satchel/inv/InvLoader.js';
import { cloneProfile } from '../satchel/profile/Profile.js';
import { dispatchProfileChange } from '../satchel/profile/ProfileEvents.js';
import { exportProfileToJSON, importProfileFromJSON } from '../satchel/profile/ProfileLoader.js';
import { addProfileInStore, getProfileInStore, isProfileInStore } from '../satchel/profile/ProfileStore.js';

export function loadSatchelProfilesFromData(store, jsonData) {
  let inProfiles = jsonData.profiles;
  let inInvs = jsonData.invs;
  for(let invId of Object.keys(inInvs)) {
    let invJson = inInvs[invId];
    if (invJson) {
      const inv = importInventoryFromJSON(invJson);
      if (isInventoryInStore(store, invId)) {
        const oldInv = getInventoryInStore(store, invId);
        cloneInventory(inv, oldInv);
        dispatchInventoryChange(store, invId);
      } else {
        addInventoryToStore(store, invId, inv);
      }
    }
  }
  for(let profileJson of inProfiles) {
    const profile = importProfileFromJSON(profileJson);
    const profileId = profile.profileId;
    // NOTE: Make sure we don't link inventories that cannot be loaded.
    profile.invs.filter(invId => isInventoryInStore(store, invId));
    if (isProfileInStore(store, profileId)) {
      const oldProfile = getProfileInStore(store, profileId);
      cloneProfile(profile, oldProfile);
      dispatchProfileChange(store, profileId);
    } else {
      addProfileInStore(store, profileId, profile);
    }
  }
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
  dst.profiles = outProfiles;
  dst.invs = outInvs;
  return dst;
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
