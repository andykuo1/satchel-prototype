import { createGridInventory, createSocketInventory } from '../satchel/inv/Inv.js';
import { dispatchInventoryChange } from '../events/InvEvents.js';

/**
 * @typedef {import('./SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/inv/Inv.js').Inventory} Inv
 * @typedef {import('../satchel/inv/Inv.js').InvId} InvId
 */

/**
 * @param {Store} store 
 * @param {InvId} invId 
 * @returns {Inv}
 */
export function getExistingInvInStore(store, invId) {
  if (isInvInStore(store, invId)) {
    return getInvInStore(store, invId);
  } else {
    throw new Error(`Cannot get non-existant inventory '${invId}'.`);
  }
}

/**
 * @param {Store} store 
 * @param {InvId} invId 
 * @returns {Inv}
 */
export function getInvInStore(store, invId) {
  return store.data.inventory[invId];
}

/**
 * @param {Store} store 
 * @returns {Array<Inv>}
 */
export function getInvsInStore(store) {
  return Object.values(store.data.inventory);
}

/**
 * @param {Store} store 
 * @returns {Array<InvId>}
 */
export function getInvIdsInStore(store) {
  return Object.keys(store.data.inventory);
}

/**
 * @param {Store} store 
 * @param {InvId} invId
 * @returns {boolean}
 */
export function isInvInStore(store, invId) {
  return invId in store.data.inventory;
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @param {number} width
 * @param {number} height
 * @returns {Inv}
 */
 export function createGridInvInStore(store, invId, width, height) {
  let inv = createGridInventory(invId, width, height);
  if (!addInvInStore(store, invId, inv)) {
    throw new Error('Failed to create grid inventory in store.');
  }
  return inv;
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @returns {Inv}
 */
export function createSocketInvInStore(store, invId) {
  let inv = createSocketInventory(invId);
  if (!addInvInStore(store, invId, inv)) {
    throw new Error('Failed to create socket inventory in store.');
  }
  return inv;
}

/**
 * @param {Store} store 
 * @param {InvId} invId 
 * @param {Inv} inv 
 * @returns {boolean}
 */
export function addInvInStore(store, invId, inv) {
  if (invId !== inv.invId) {
    throw new Error(`Cannot add inventory '${inv.invId}' for mismatched id '${invId}'.`);
  }
  if (invId in store.data.inventory) {
    return false;
  }
  store.data.inventory[invId] = inv;
  dispatchInventoryChange(store, invId);
  return true;
}

/**
 * @param {Store} store 
 * @param {InvId} invId 
 * @param {Inv} inv 
 * @returns {boolean}
 */
export function deleteInvInStore(store, invId, inv) {
  if (invId !== inv.invId) {
    throw new Error(`Cannot delete inv '${inv.invId}' for mismatched id '${invId}'.`);
  }
  if (!(invId in store.data.inventory)) {
    return false;
  }
  delete store.data.inventory[invId];
  dispatchInventoryChange(store, invId);
  return true;
}
