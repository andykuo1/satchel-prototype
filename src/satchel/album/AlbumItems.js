import { dispatchAlbumChange } from '../../events/AlbumEvents.js';
import { getExistingAlbumInStore } from '../../store/AlbumStore.js';

export function addItemToAlbum(store, albumId, item) {
  let album = getExistingAlbumInStore(store, albumId);
  const itemId = item.itemId;
  album.items[itemId] = item;
  dispatchAlbumChange(store, albumId);
}

export function removeItemFromAlbum(store, albumId, itemId) {
  let album = getExistingAlbumInStore(store, albumId);
  if (hasItemInAlbum(store, albumId, itemId)) {
    delete album.items[itemId];
    dispatchAlbumChange(store, albumId);
  }
}

export function hasItemInAlbum(store, albumId, itemId) {
  let album = getExistingAlbumInStore(store, albumId);
  return itemId in album.items;
}

export function getItemInAlbum(store, albumId, itemId) {
  let album = getExistingAlbumInStore(store, albumId);
  return album.items[itemId];
}

export function getItemIdsInAlbum(store, albumId) {
  let album = getExistingAlbumInStore(store, albumId);
  return Object.keys(album.items);
}

/**
 * @param {import('../../store/SatchelStore.js').SatchelStore} store 
 * @param {string} albumId 
 * @returns {Array<import('../item/Item.js').Item>}
 */
export function getItemsInAlbum(store, albumId) {
  let album = getExistingAlbumInStore(store, albumId);
  return Object.values(album.items);
}

export function clearItemsInAlbum(store, albumId) {
  let album = getExistingAlbumInStore(store, albumId);
  album.items = {};
  dispatchAlbumChange(store, albumId);
}
