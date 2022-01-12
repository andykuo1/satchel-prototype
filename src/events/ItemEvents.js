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
 * @param {Store} store
 * @param {ItemId} itemId
 * @param {OnItemChangeCallback} callback
 */
export function addItemChangeListener(store, itemId, callback) {
  addStoreEventListener(store, 'item', itemId, callback);
}

/**
 * @param {Store} store
 * @param {ItemId} itemId
 * @param {OnItemChangeCallback} callback
 */
export function removeItemChangeListener(store, itemId, callback) {
  removeStoreEventListener(store, 'item', itemId, callback);
}
