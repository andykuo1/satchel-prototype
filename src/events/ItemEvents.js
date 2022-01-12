import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from '../store/InventoryEventStore.js';

/**
 * @callback OnItemChangeCallback
 * @param store
 * @param itemId
 */

/**
 * @param store
 * @param itemId
 */
 export function dispatchItemChange(store, itemId) {
  dispatchStoreEvent(store, 'item', itemId);
}

/**
 * @param itemId
 * @param {OnItemChangeCallback} callback
 */
export function addItemChangeListener(itemId, callback) {
  addStoreEventListener('item', itemId, callback);
}

/**
 * @param itemId
 * @param {OnItemChangeCallback} callback
 */
export function removeItemChangeListener(itemId, callback) {
  removeStoreEventListener('item', itemId, callback);
}
