import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from './InventoryEventStore.js';

/**
 * @param store
 * @param itemId
 */
 export function dispatchItemChange(store, itemId) {
  dispatchStoreEvent(store, 'item', itemId);
}

/**
 * @param itemId
 * @param callback
 */
export function addItemChangeListener(itemId, callback) {
  addStoreEventListener('item', itemId, callback);
}

/**
 * @param itemId
 * @param callback
 */
export function removeItemChangeListener(itemId, callback) {
  removeStoreEventListener('item', itemId, callback);
}
