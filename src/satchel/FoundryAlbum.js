import { getSatchelStore } from '../store/SatchelStore.js';
import { uuid } from '../util/uuid.js';
import { ALBUM_FLAG_EXPAND_BIT, ALBUM_FLAG_LOCKED_BIT, createAlbum, isAlbumLocked } from './album/Album.js';
import { getAlbumsInStore } from '../store/AlbumStore.js';
import { addItemToInventory } from './inv/InventoryTransfer.js';
import { getItemsInInv } from './inv/InventoryItems.js';
import { addInvInStore } from '../store/InvStore.js';

const FOUNDRY_ALBUM_DISPLAY_NAME = '[ Recent ]';

/**
 * @param {import('./item/Item.js').Item} freedItem
 */
export function saveItemToFoundryAlbum(freedItem) {
  const store = getSatchelStore();
  let foundryAlbumId = getFoundryAlbumId(store);
  addItemToInventory(store, foundryAlbumId, freedItem, 0, 0);
}

function resolveFoundryAlbumId(store) {
  let foundryAlbumId = uuid();
  let album = createAlbum(foundryAlbumId);
  album.displayName = FOUNDRY_ALBUM_DISPLAY_NAME;
  album.flags &= ~ALBUM_FLAG_EXPAND_BIT;
  album.flags |= ALBUM_FLAG_LOCKED_BIT;
  addInvInStore(store, album.invId, album);
  return foundryAlbumId;
}

/**
 * @param {import('./item/Item.js').Item} item
 * @returns {boolean}
 */
export function shouldSaveItemToFoundryAlbum(item) {
  const store = getSatchelStore();
  const albums = getAlbumsInStore(store);
  let foundryAlbumId = null;
  for (let album of albums) {
    if (isFoundryAlbum(album)) {
      foundryAlbumId = album.invId;
      break;
    }
  }
  if (!foundryAlbumId) {
    return false;
  }
  if (!isAlbumLocked(store, foundryAlbumId)) {
    return false;
  }
  // Save it as long as the image is different.
  const imgSrc = item.imgSrc;
  const items = getItemsInInv(store, foundryAlbumId);
  for (let albumItem of items) {
    if (albumItem.imgSrc === imgSrc) {
      return false;
    }
  }
  return true;
}

/**
 * @param {import('./album/Album.js').Album} album
 * @returns {boolean}
 */
export function isFoundryAlbum(album) {
  return album.displayName === FOUNDRY_ALBUM_DISPLAY_NAME;
}

export function hasFoundryAlbum(store) {
  const albums = getAlbumsInStore(store);
  for (let album of albums) {
    if (isFoundryAlbum(album)) {
      return true;
    }
  }
  return false;
}

export function getFoundryAlbumId(store) {
  const albums = getAlbumsInStore(store);
  for (let album of albums) {
    if (isFoundryAlbum(album)) {
      return album.invId;
    }
  }
  return resolveFoundryAlbumId(store);
}
