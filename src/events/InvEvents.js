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
 * @param {Store} store
 * @param {InvId} invId
 * @param {OnInventoryChangeCallback} callback
 */
export function addInventoryChangeListener(store, invId, callback) {
  addStoreEventListener(store, 'inventory', invId, callback);
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @param {OnInventoryChangeCallback} callback
 */
export function removeInventoryChangeListener(store, invId, callback) {
  removeStoreEventListener(store, 'inventory', invId, callback);
}
