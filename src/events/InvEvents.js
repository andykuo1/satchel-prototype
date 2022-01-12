import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from '../store/InventoryEventStore.js';

/**
 * @callback OnInventoryChangeCallback
 * @param store
 * @param invId
 */

/**
 * @param store
 * @param invId
 */
 export function dispatchInventoryChange(store, invId) {
  dispatchStoreEvent(store, 'inventory', invId);
}

/**
 * @param invId
 * @param {OnInventoryChangeCallback} callback
 */
export function addInventoryChangeListener(invId, callback) {
  addStoreEventListener('inventory', invId, callback);
}

/**
 * @param invId
 * @param {OnInventoryChangeCallback} callback
 */
export function removeInventoryChangeListener(invId, callback) {
  removeStoreEventListener('inventory', invId, callback);
}
