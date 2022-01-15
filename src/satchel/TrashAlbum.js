import { getSatchelStore } from '../store/SatchelStore.js';
import { uuid } from '../util/uuid.js';
import { createAlbum } from './album/Album.js';
import { addItemToAlbum, getItemIdsInAlbum, removeItemFromAlbum } from './album/AlbumItems.js';
import { addAlbumInStore, getAlbumsInStore } from '../store/AlbumStore.js';
import { playSound } from '../sounds.js';

const TRASH_ALBUM_DISPLAY_NAME = '[ Trash ]';
const MAX_ITEMS_IN_TRASH = 30;

/**
 * @param {import('./item/Item.js').Item} freedItem
 */
export function saveItemToTrashAlbum(freedItem) {
  const store = getSatchelStore();
  let trashAlbumId = getTrashAlbumId(store);
  addItemToAlbum(store, trashAlbumId, freedItem);
  let itemIds = getItemIdsInAlbum(store, trashAlbumId);
  if (itemIds.length > MAX_ITEMS_IN_TRASH) {
    let firstItemId = itemIds[0];
    removeItemFromAlbum(store, trashAlbumId, firstItemId);
  }
  playSound('clearItem');
}

function resolveTrashAlbumId(store) {
  let trashAlbumId = uuid();
  let album = createAlbum(trashAlbumId);
  album.displayName = TRASH_ALBUM_DISPLAY_NAME;
  album.locked = true;
  album.expand = false;
  addAlbumInStore(store, album.albumId, album);
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
      return album.albumId;
    }
  }
  return resolveTrashAlbumId(store);
}
