import { cloneItem } from '../item/Item.js';
import { uuid } from '../../util/uuid.js';
import { dispatchAlbumChange } from './AlbumEvents.js';
import { getExistingAlbumInStore } from './AlbumStore.js';

export function createAlbum(albumId) {
  let album = {
    albumId,
    items: {},
    locked: false,
    displayName: 'Untitled',
  };
  return album;
}

export function setAlbumLocked(store, albumId, locked) {
  let album = getExistingAlbumInStore(store, albumId);
  if (album.locked !== locked) {
    album.locked = locked;
    dispatchAlbumChange(store, albumId);
  }
}

export function isAlbumLocked(store, albumId) {
  let album = getExistingAlbumInStore(store, albumId);
  return album.locked;
}

export function copyAlbum(other, dst = undefined) {
  const albumId = other.albumId || uuid();
  if (!dst) {
    dst = createAlbum(albumId);
  } else {
    dst.albumId = albumId;
  }
  if (typeof other.items === 'object') {
    for (let item of Object.values(other.items)) {
      let newItem = cloneItem(item);
      dst.items[newItem.itemId] = item;
    }
  }
  dst.displayName = String(other.displayName);
  dst.locked = Boolean(other.locked);
  return dst;
}

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

export function getItemsInAlbum(store, albumId) {
  let album = getExistingAlbumInStore(store, albumId);
  return Object.keys(album.items);
}

export function clearAlbum(album) {
  album.items = {};
}

export function clearItemsInAlbum(store, albumId) {
  let album = getExistingAlbumInStore(store, albumId);
  clearAlbum(album);
  dispatchAlbumChange(store, albumId);
}
