import { getSatchelStore } from '../store/SatchelStore.js';
import { uuid } from '../util/uuid.js';
import { createAlbum, isAlbumLocked } from './album/Album.js';
import { addItemToAlbum, getItemsInAlbum } from './album/AlbumItems.js';
import { addAlbumInStore, getAlbumsInStore } from '../store/AlbumStore.js';

const FOUNDRY_ALBUM_DISPLAY_NAME = '[ Recent ]';

/**
 * @param {import('./item/Item.js').Item} freedItem
 */
export function saveItemToFoundryAlbum(freedItem) {
  const store = getSatchelStore();
  let foundryAlbumId = getFoundryAlbumId(store);
  addItemToAlbum(store, foundryAlbumId, freedItem);
}

function resolveFoundryAlbumId(store) {
  let foundryAlbumId = uuid();
  let album = createAlbum(foundryAlbumId);
  album.displayName = FOUNDRY_ALBUM_DISPLAY_NAME;
  album.locked = true;
  album.expand = false;
  addAlbumInStore(store, album.albumId, album);
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
      foundryAlbumId = album.albumId;
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
  const items = getItemsInAlbum(store, foundryAlbumId);
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
      return album.albumId;
    }
  }
  return resolveFoundryAlbumId(store);
}
