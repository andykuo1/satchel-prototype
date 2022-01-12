import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from '../store/EventStore.js';

/**
 * @typedef {import('../store/SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/album/Album.js').AlbumId} AlbumId
 */

/**
 * @callback OnAlbumChangeCallback
 * @param store
 * @param albumId
 */

/**
 * @param {Store} store 
 * @param {AlbumId} albumId 
 */
export function dispatchAlbumChange(store, albumId) {
  dispatchStoreEvent(store, 'album', albumId);
}

/**
 * @param {AlbumId} albumId 
 * @param {OnAlbumChangeCallback} callback 
 */
export function addAlbumChangeListener(albumId, callback) {
  addStoreEventListener('album', albumId, callback);
}

/**
 * @param {AlbumId} albumId 
 * @param {OnAlbumChangeCallback} callback 
 */
export function removeAlbumChangeListener(albumId, callback) {
  removeStoreEventListener('album', albumId, callback);
}
