import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from '../store/EventStore.js';

/**
 * @typedef {import('../store/SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/item/Item.js').ItemId} ItemId
 */

/**
 * @callback OnItemChangeCallback
 * @param {Store} store
 * @param {ItemId} itemId
 */

/**
 * @param {Store} store
 * @param {ItemId} itemId
 */
 export function dispatchItemChange(store, itemId) {
  dispatchStoreEvent(store, 'item', itemId);
}

/**
 * @param {ItemId} itemId
 * @param {OnItemChangeCallback} callback
 */
export function addItemChangeListener(itemId, callback) {
  addStoreEventListener('item', itemId, callback);
}

/**
 * @param {ItemId} itemId
 * @param {OnItemChangeCallback} callback
 */
export function removeItemChangeListener(itemId, callback) {
  removeStoreEventListener('item', itemId, callback);
}
