import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from '../store/EventStore.js';

/**
 * @typedef {import('../store/SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/inv/Inv.js').InvId} InvId
 */

/**
 * @callback OnInventoryChangeCallback
 * @param {Store} store
 * @param {InvId} invId
 */

/**
 * @param {Store} store
 * @param {InvId} invId
 */
 export function dispatchInventoryChange(store, invId) {
  dispatchStoreEvent(store, 'inventory', invId);
}

/**
 * @param {InvId} invId
 * @param {OnInventoryChangeCallback} callback
 */
export function addInventoryChangeListener(invId, callback) {
  addStoreEventListener('inventory', invId, callback);
}

/**
 * @param {InvId} invId
 * @param {OnInventoryChangeCallback} callback
 */
export function removeInventoryChangeListener(invId, callback) {
  removeStoreEventListener('inventory', invId, callback);
}
