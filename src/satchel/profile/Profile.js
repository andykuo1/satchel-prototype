import { addInventoryToStore, getInventoryInStore } from '../../inventory/InventoryStore.js';
import { uuid } from '../../util/uuid.js';
import { copyInventory } from '../inv/Inv.js';

/**
 * @typedef {import('../inv/Inv.js').InventoryId} InvId
 * @typedef {import('../../inventory/InventoryStore').InventoryStore} Store
 */

/**
 * @typedef {string} ProfileId
 * 
 * @typedef Profile
 * @property {ProfileId} profileId
 * @property {Array<InvId>} invs
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
  if (Array.isArray(result.invs)) {
    // Copy all inventories
    let newInvIds = [];
    for(let invId of result.invs) {
      let inv = getInventoryInStore(store, invId);
      let newInv = copyInventory(inv);
      addInventoryToStore(store, newInv.invId, newInv);
      newInvIds.push(newInv.invId);
    }
    result.invs = newInvIds;
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
