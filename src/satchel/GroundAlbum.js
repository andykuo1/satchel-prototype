import { addItemToAlbum, clearItemsInAlbum } from '../satchel/album/AlbumItems.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { createAlbum } from './album/Album.js';
import { addAlbumInStore, isAlbumInStore } from '../store/AlbumStore.js';
import { dispatchAlbumChange } from '../events/AlbumEvents.js';

const GROUND_ALBUM_DISPLAY_NAME = '[ Ground ]';

export function dropItemOnGround(freedItem) {
  const store = getSatchelStore();
  const groundAlbumId = getGroundAlbumId(store);
  addItemToAlbum(store, groundAlbumId, freedItem);
}

function resolveGroundAlbumId(store) {
  const groundAlbumId = 'ground';
  let album = createAlbum(groundAlbumId);
  album.displayName = GROUND_ALBUM_DISPLAY_NAME;
  addAlbumInStore(store, album.albumId, album);
  dispatchAlbumChange(store, album.albumId);
  return groundAlbumId;
}

export function clearItemsOnGround() {
  const store = getSatchelStore();
  const groundAlbumId = getGroundAlbumId(store);
  clearItemsInAlbum(store, groundAlbumId);
}

export function isGroundAlbum(album) {
  return album.albumId === 'ground';
}

export function hasGroundAlbum(store) {
  let groundAlbumId = 'ground';
  if (!isAlbumInStore(store, groundAlbumId)) {
    return false;
  } else {
    return true;
  }
}

export function getGroundAlbumId(store) {
  let groundAlbumId = 'ground';
  if (!isAlbumInStore(store, groundAlbumId)) {
    return resolveGroundAlbumId(store);
  } else {
    return groundAlbumId;
  }
}
