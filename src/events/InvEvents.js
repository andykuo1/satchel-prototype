import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from '../store/EventStore.js';

/**
 * @typedef {import('../store/SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/inv/Inv.js').InvId} InvId
 */

/**
 * @callback OnInventoryChangeCallback
 * @param {Store} store
 * @param {InvId} invId
 * 
 * @callback OnInventoryListChangeCallback
 * @param {Store} store
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

/**
 * @param {Store} store
 */
export function dispatchInventoryListChange(store) {
  dispatchStoreEvent(store, 'inventoryList', 'all');
}

/**
 * @param {Store} store
 * @param {OnInventoryListChangeCallback} callback
 */
export function addInventoryListChangeListener(store, callback) {
  addStoreEventListener(store, 'inventoryList', 'all', callback);
}

/**
 * @param {Store} store
 * @param {OnInventoryListChangeCallback} callback
 */
export function removeInventoryListChangeListener(store, callback) {
  removeStoreEventListener(store, 'inventoryList', 'all', callback);
}
