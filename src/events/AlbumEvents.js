import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from '../store/EventStore.js';

/**
 * @typedef {import('../store/SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/album/Album.js').AlbumId} AlbumId
 */

/**
 * @callback OnAlbumChangeCallback
 * @param {Store} store
 * @param {AlbumId} albumId
 */

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 */
export function dispatchAlbumChange(store, albumId) {
  dispatchStoreEvent(store, 'album', albumId);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @param {OnAlbumChangeCallback} callback
 */
export function addAlbumChangeListener(store, albumId, callback) {
  addStoreEventListener(store, 'album', albumId, callback);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @param {OnAlbumChangeCallback} callback
 */
export function removeAlbumChangeListener(store, albumId, callback) {
  removeStoreEventListener(store, 'album', albumId, callback);
}
