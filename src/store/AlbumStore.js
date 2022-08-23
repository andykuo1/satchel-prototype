import { createAlbum } from '../satchel/album/Album.js';
import { addInvInStore, deleteInvInStore, getInvsInStore } from './InvStore.js';

/**
 * @typedef {import('./SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/album/Album.js').Album} Album
 * @typedef {import('../satchel/album/Album.js').AlbumId} AlbumId
 */

/**
 * @param {Store} store
 * @returns {Array<Album>}
 */
export function getAlbumsInStore(store) {
  return getInvsInStore(store).filter((inv) => inv.type === 'album');
}

/**
 * @param {Store} store
 * @returns {Array<AlbumId>}
 */
export function getAlbumIdsInStore(store) {
  return getAlbumsInStore(store).map((album) => album.invId);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @returns {Album}
 */
export function createAlbumInStore(store, albumId) {
  let album = createAlbum(albumId);
  if (!addInvInStore(store, albumId, album)) {
    throw new Error('Failed to create album in store.');
  }
  return album;
}
