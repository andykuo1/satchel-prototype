import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from '../../inventory/InventoryEventStore.js';

/**
 * @callback OnAlbumChangeCallback
 * @param store
 * @param albumId
 */

/**
 * 
 * @param {*} store 
 * @param {*} albumId 
 */
export function dispatchAlbumChange(store, albumId) {
  dispatchStoreEvent(store, 'album', albumId);
}

/**
 * 
 * @param {*} albumId 
 * @param {OnAlbumChangeCallback} callback 
 */
export function addAlbumChangeListener(albumId, callback) {
  addStoreEventListener('album', albumId, callback);
}

/**
 * 
 * @param {*} albumId 
 * @param {OnAlbumChangeCallback} callback 
 */
export function removeAlbumChangeListener(albumId, callback) {
  removeStoreEventListener('album', albumId, callback);
}
