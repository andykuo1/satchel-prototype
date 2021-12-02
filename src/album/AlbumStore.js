import { dispatchAlbumChange } from '../inventory/InventoryStore.js';
import { createAlbum } from './Album.js';

export function getExistingAlbumInStore(store, albumId) {
  if (isAlbumInStore(store, albumId)) {
    return getAlbumInStore(store, albumId);
  } else {
    throw new Error(`Cannot get non-existant album '${albumId}'.`);
  }
}

export function getAlbumInStore(store, albumId) {
  return store.data.album[albumId];
}

export function getAlbumsInStore(store) {
  return Object.values(store.data.album);
}

export function isAlbumInStore(store, albumId) {
  return albumId in store.data.album;
}

export function  createAlbumInStore(store, albumId) {
  let album = createAlbum(albumId);
  if (!addAlbumInStore(store, albumId, album)) {
    throw new Error('Failed to create album in store.');
  }
  return album;
}

export function addAlbumInStore(store, albumId, album) {
  if (albumId !== album.albumId) {
    throw new Error(`Cannot add album '${album.albumId}' for mismatched id '${albumId}'.`);
  }
  if (albumId in store.data.album) {
    return false;
  }
  store.data.album[albumId] = album;
  dispatchAlbumChange(store, albumId);
  return true;
}

export function deleteAlbumInStore(store, albumId, album) {
  if (albumId !== album.albumId) {
    throw new Error(`Cannot delete album '${album.albumId}' for mismatched id '${albumId}'.`);
  }
  if (!(albumId in store.data.album)) {
    return false;
  }
  delete store.data.album[albumId];
  dispatchAlbumChange(store, albumId);
  return true;
}
