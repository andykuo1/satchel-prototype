import { getSatchelStore } from '../store/SatchelStore.js';
import { uuid } from '../util/uuid.js';
import { createAlbum, isAlbumLocked } from './album/Album.js';
import { addItemToAlbum, getItemsInAlbum } from './album/AlbumItems.js';
import { addAlbumInStore, getAlbumsInStore, isAlbumInStore } from '../store/AlbumStore.js';

const FOUNDRY_ALBUM_DISPLAY_NAME = '[ Foundry ]';

/**
 * @param {import('./item/Item.js').Item} freedItem
 */
export function saveItemToFoundryAlbum(freedItem) {
  const store = getSatchelStore();
  let foundryAlbumId = getFoundryAlbumId(store);
  if (!foundryAlbumId || !isAlbumInStore(store, foundryAlbumId)) {
    foundryAlbumId = uuid();
    let album = createAlbum(foundryAlbumId);
    album.displayName = FOUNDRY_ALBUM_DISPLAY_NAME;
    album.locked = true;
    addAlbumInStore(store, album.albumId, album);
  }
  addItemToAlbum(store, foundryAlbumId, freedItem);
}

/**
 * @param {import('./item/Item.js').Item} item
 * @returns {boolean}
 */
export function shouldSaveItemToFoundryAlbum(item) {
  const store = getSatchelStore();
  const foundryAlbumId = getFoundryAlbumId(store);
  if (!foundryAlbumId || !isAlbumInStore(store, foundryAlbumId)) {
    return true;
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

export function getFoundryAlbumId(store) {
  const albums = getAlbumsInStore(store);
  for (let album of albums) {
    if (isFoundryAlbum(album)) {
      return album.albumId;
    }
  }
  return null;
}