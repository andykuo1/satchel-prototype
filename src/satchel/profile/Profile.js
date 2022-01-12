import { uuid } from '../../util/uuid.js';

/**
 * @typedef {import('../inv/Inv.js').InventoryId} InvId
 * @typedef {import('../../store/InventoryStore').InventoryStore} Store
 * 
 * @typedef {import('../album/Album.js').AlbumId} AlbumId
 */

/**
 * @typedef {string} ProfileId
 * 
 * @typedef Profile
 * @property {ProfileId} profileId
 * @property {Array<InvId>} invs
 * @property {Array<AlbumId>} albums
 * @property {string} displayName
 */

/**
 * @param {ProfileId} profileId 
 * @returns {Profile}
 */
export function createProfile(profileId) {
  let profile = {
    profileId,
    invs: [],
    albums: [],
    displayName: 'Satchel',
  };
  return profile;
}

/**
 * @param {Store} store
 * @param {Profile} other 
 * @param {Profile} dst 
 * @returns {Profile}
 */
export function copyProfile(store, other, dst = undefined) {
  let result = cloneProfile(other, dst);
  if (result.profileId === other.profileId) {
    result.profileId = uuid();
  }
  return result;
}

/**
 * @param {Profile} other 
 * @param {Profile} dst 
 * @returns {Profile}
 */
export function cloneProfile(other, dst = undefined) {
  const profileId = other.profileId || uuid();
  if (!dst) {
    dst = createProfile(profileId);
  } else {
    dst.profileId = profileId;
  }
  if (Array.isArray(other.invs)) {
    dst.invs = [...other.invs];
  }
  if (Array.isArray(other.albums)) {
    dst.albums = [...other.albums];
  }
  dst.displayName = String(other.displayName);
  return dst;
}

/**
 * @param {Profile} profile 
 * @returns {Array<InvId>}
 */
export function getProfileInvIds(profile) {
  return profile.invs;
}

/**
 * @param {Profile} profile 
 * @returns {Array<AlbumId>}
 */
 export function getProfileAlbumIds(profile) {
  return profile.albums;
}
