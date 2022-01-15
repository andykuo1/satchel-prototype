import { createAlbum } from '../satchel/album/Album.js';
import { dispatchAlbumChange, dispatchAlbumListChange } from '../events/AlbumEvents.js';

/**
 * @typedef {import('./SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/album/Album.js').Album} Album
 * @typedef {import('../satchel/album/Album.js').AlbumId} AlbumId
 */

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @returns {Album}
 */
export function getExistingAlbumInStore(store, albumId) {
  if (isAlbumInStore(store, albumId)) {
    return getAlbumInStore(store, albumId);
  } else {
    throw new Error(`Cannot get non-existant album '${albumId}'.`);
  }
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @returns {Album}
 */
export function getAlbumInStore(store, albumId) {
  return store.data.album[albumId];
}

/**
 * @param {Store} store
 * @returns {Array<Album>}
 */
export function getAlbumsInStore(store) {
  return Object.values(store.data.album);
}

/**
 * @param {Store} store
 * @returns {Array<AlbumId>}
 */
export function getAlbumIdsInStore(store) {
  return Object.keys(store.data.album);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @returns {boolean}
 */
export function isAlbumInStore(store, albumId) {
  return albumId in store.data.album;
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @returns {Album}
 */
export function createAlbumInStore(store, albumId) {
  let album = createAlbum(albumId);
  if (!addAlbumInStore(store, albumId, album)) {
    throw new Error('Failed to create album in store.');
  }
  return album;
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @param {Album} album
 * @returns {boolean}
 */
export function addAlbumInStore(store, albumId, album) {
  if (albumId !== album.albumId) {
    throw new Error(`Cannot add album '${album.albumId}' for mismatched id '${albumId}'.`);
  }
  if (albumId in store.data.album) {
    return false;
  }
  store.data.album[albumId] = album;
  dispatchAlbumChange(store, albumId);
  dispatchAlbumListChange(store);
  return true;
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @param {Album} album
 * @returns {boolean}
 */
export function deleteAlbumInStore(store, albumId, album) {
  if (albumId !== album.albumId) {
    throw new Error(`Cannot delete album '${album.albumId}' for mismatched id '${albumId}'.`);
  }
  if (!(albumId in store.data.album)) {
    return false;
  }
  delete store.data.album[albumId];
  dispatchAlbumChange(store, albumId);
  dispatchAlbumListChange(store);
  return true;
}
