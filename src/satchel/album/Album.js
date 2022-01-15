import { cloneItem, copyItem } from '../item/Item.js';
import { uuid } from '../../util/uuid.js';

import { dispatchAlbumChange } from '../../events/AlbumEvents.js';
import { getExistingAlbumInStore } from '../../store/AlbumStore.js';

/**
 * @typedef {import('../../store/SatchelStore').SatchelStore} Store
 * @typedef {import('../inv/Inv.js').InvId} InvId
 * @typedef {import('../item/Item.js').Item} Item
 * @typedef {import('../item/Item.js').ItemId} ItemId
 */

/**
 * @typedef {string} AlbumId
 * 
 * @typedef Album
 * @property {AlbumId} albumId
 * @property {Record<ItemId, Item>} items
 * @property {string} displayName
 * @property {boolean} locked
 * @property {boolean} hidden
 * @property {boolean} expand
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
    hidden: false,
    expand: true,
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
  dst.hidden = Boolean(other.hidden);
  dst.expand = typeof other.expand === 'boolean' ? other.expand : true;
  return dst;
}

/**
 * @param {Store} store
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
 * @param {Store} store
 * @param {AlbumId} albumId 
 * @returns {boolean}
 */
export function isAlbumLocked(store, albumId) {
  let album = getExistingAlbumInStore(store, albumId);
  return album.locked;
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId 
 * @param {boolean} hidden 
 */
 export function setAlbumHidden(store, albumId, hidden) {
  let album = getExistingAlbumInStore(store, albumId);
  if (album.hidden !== hidden) {
    album.hidden = hidden;
    dispatchAlbumChange(store, albumId);
  }
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId 
 * @returns {boolean}
 */
 export function isAlbumHidden(store, albumId) {
  let album = getExistingAlbumInStore(store, albumId);
  return album.hidden;
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId 
 * @param {boolean} expand 
 */
 export function setAlbumExpanded(store, albumId, expand) {
  let album = getExistingAlbumInStore(store, albumId);
  if (album.expand !== expand) {
    album.expand = expand;
    dispatchAlbumChange(store, albumId);
  }
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId 
 * @returns {boolean}
 */
export function isAlbumExpanded(store, albumId) {
  let album = getExistingAlbumInStore(store, albumId);
  return album.expand;
}
