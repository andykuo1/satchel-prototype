import { getExistingInvInStore } from '../../store/InvStore.js';
import { cloneInventory, createAlbumInventory, isInventoryFlagEnabled, toggleInventoryFlag } from '../inv/Inv.js';

/**
 * @typedef {import('../../store/SatchelStore').SatchelStore} Store
 * @typedef {import('../inv/Inv.js').InvId} InvId
 * @typedef {import('../item/Item.js').Item} Item
 * @typedef {import('../item/Item.js').ItemId} ItemId
 * @typedef {import('../inv/Inv.js').Inventory} Inventory
 */

/**
 * @typedef {InvId} AlbumId
 * @typedef {Inventory} Album
 */

export const ALBUM_FLAG_HIDDEN_BIT = 0x1;
export const ALBUM_FLAG_LOCKED_BIT = 0x2;
export const ALBUM_FLAG_EXPAND_BIT = 0x4;

/**
 * @param {AlbumId} albumId 
 * @returns {Album}
 */
export function createAlbum(albumId) {
  let album = createAlbumInventory(albumId);
  album.displayName = 'Untitled';
  album.flags |= ALBUM_FLAG_EXPAND_BIT;
  return album;
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId 
 * @param {boolean} locked 
 */
export function setAlbumLocked(store, albumId, locked) {
  toggleInventoryFlag(store, albumId, ALBUM_FLAG_LOCKED_BIT, locked);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId 
 * @returns {boolean}
 */
export function isAlbumLocked(store, albumId) {
  let album = getExistingInvInStore(store, albumId);
  return isInventoryFlagEnabled(album, ALBUM_FLAG_LOCKED_BIT);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId 
 * @param {boolean} hidden 
 */
 export function setAlbumHidden(store, albumId, hidden) {
  toggleInventoryFlag(store, albumId, ALBUM_FLAG_HIDDEN_BIT, hidden);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId 
 * @returns {boolean}
 */
 export function isAlbumHidden(store, albumId) {
  let album = getExistingInvInStore(store, albumId);
  return isInventoryFlagEnabled(album, ALBUM_FLAG_HIDDEN_BIT);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId 
 * @param {boolean} expand 
 */
 export function setAlbumExpanded(store, albumId, expand) {
  toggleInventoryFlag(store, albumId, ALBUM_FLAG_EXPAND_BIT, expand);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId 
 * @returns {boolean}
 */
export function isAlbumExpanded(store, albumId) {
  let album = getExistingInvInStore(store, albumId);
  return isInventoryFlagEnabled(album, ALBUM_FLAG_EXPAND_BIT);
}
