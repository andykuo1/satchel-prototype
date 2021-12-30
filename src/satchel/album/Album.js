import { cloneItem, copyItem } from '../item/Item.js';
import { uuid } from '../../util/uuid.js';

import { dispatchAlbumChange } from './AlbumEvents.js';
import { getExistingAlbumInStore } from './AlbumStore.js';

/**
 * @typedef {import('../inv/Inv.js').InventoryId} InvId
 * @typedef {import('../item/Item.js').Item} Item
 * @typedef {import('../item/Item.js').ItemId} ItemId
 */

/**
 * @typedef {string} AlbumId
 * 
 * @typedef Album
 * @property {AlbumId} albumId
 * @property {Record<ItemId, Item>} items
 * @property {boolean} locked
 * @property {string} displayName
 */

/**
 * @param {AlbumId} albumId 
 * @returns {Album}
 */
export function createAlbum(albumId) {
  let album = {
    albumId,
    items: {},
    locked: false,
    displayName: 'Untitled',
  };
  return album;
}

/**
 * @param {Album} other 
 * @param {Album} dst 
 * @returns {Album}
 */
export function copyAlbum(other, dst = undefined) {
  let result = cloneAlbum(other, dst, { preserveItemId: false });
  if (result.albumId === other.albumId) {
    result.albumId = uuid();
  }
  return result;
}

/**
 * @param {Album} other 
 * @param {Album} dst 
 * @param {object} [opts]
 * @param {boolean} [opts.preserveItemId]
 * @returns {Album}
 */
export function cloneAlbum(other, dst = undefined, opts = {}) {
  const { preserveItemId = true } = opts;
  const albumId = other.albumId || uuid();
  if (!dst) {
    dst = createAlbum(albumId);
  } else {
    dst.albumId = albumId;
  }
  if (typeof other.items === 'object') {
    if (preserveItemId) {
      for (let item of Object.values(other.items)) {
        let newItem = cloneItem(item);
        dst.items[newItem.itemId] = item;
      }
    } else {
      for (let item of Object.values(other.items)) {
        let newItem = copyItem(item);
        dst.items[newItem.itemId] = item;
      }
    }
  }
  dst.displayName = String(other.displayName);
  dst.locked = Boolean(other.locked);
  return dst;
}

/**
 * @param {import('../../inventory/InventoryStore').InventoryStore} store
 * @param {AlbumId} albumId 
 * @param {boolean} locked 
 */
export function setAlbumLocked(store, albumId, locked) {
  let album = getExistingAlbumInStore(store, albumId);
  if (album.locked !== locked) {
    album.locked = locked;
    dispatchAlbumChange(store, albumId);
  }
}

/**
 * @param {import('../../inventory/InventoryStore').InventoryStore} store
 * @param {AlbumId} albumId 
 * @returns {boolean}
 */
export function isAlbumLocked(store, albumId) {
  let album = getExistingAlbumInStore(store, albumId);
  return album.locked;
}
