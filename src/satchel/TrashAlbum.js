import { playSound } from '../sounds.js';
import { getAlbumsInStore } from '../store/AlbumStore.js';
import { addInvInStore } from '../store/InvStore.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { uuid } from '../util/uuid.js';
import { ALBUM_FLAG_EXPAND_BIT, ALBUM_FLAG_LOCKED_BIT, createAlbum } from './album/Album.js';
import { getItemIdsInInv } from './inv/InventoryItems.js';
import { addItemToInventory, removeItemFromInventory } from './inv/InventoryTransfer.js';

const TRASH_ALBUM_DISPLAY_NAME = '[ Trash ]';
const MAX_ITEMS_IN_TRASH = 30;

/**
 * @param {import('./item/Item.js').Item} freedItem
 */
export function saveItemToTrashAlbum(freedItem) {
  const store = getSatchelStore();
  let trashAlbumId = getTrashAlbumId(store);
  addItemToInventory(store, trashAlbumId, freedItem, 0, 0);
  let itemIds = getItemIdsInInv(store, trashAlbumId);
  if (itemIds.length > MAX_ITEMS_IN_TRASH) {
    let firstItemId = itemIds[0];
    removeItemFromInventory(store, trashAlbumId, firstItemId);
  }
  playSound('clearItem');
}

function resolveTrashAlbumId(store) {
  let trashAlbumId = uuid();
  let album = createAlbum(trashAlbumId);
  album.displayName = TRASH_ALBUM_DISPLAY_NAME;
  album.flags &= ~ALBUM_FLAG_LOCKED_BIT & ~ALBUM_FLAG_EXPAND_BIT;
  addInvInStore(store, album.invId, album);
  return trashAlbumId;
}

/**
 * @param {import('./album/Album.js').Album} album
 * @returns {boolean}
 */
export function isTrashAlbum(album) {
  return album.displayName === TRASH_ALBUM_DISPLAY_NAME;
}

export function hasTrashAlbum(store) {
  const albums = getAlbumsInStore(store);
  for (let album of albums) {
    if (isTrashAlbum(album)) {
      return true;
    }
  }
  return false;
}

export function getTrashAlbumId(store) {
  const albums = getAlbumsInStore(store);
  for (let album of albums) {
    if (isTrashAlbum(album)) {
      return album.invId;
    }
  }
  return resolveTrashAlbumId(store);
}
