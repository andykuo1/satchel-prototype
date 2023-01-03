import { addInvInStore, isInvInStore } from '../store/InvStore.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { createAlbum } from './album/Album.js';
import { addItemToInventory, clearItemsInInventory } from './inv/InventoryTransfer.js';

const GROUND_ALBUM_DISPLAY_NAME = '[ Ground ]';

export function dropItemOnGround(freedItem) {
  const store = getSatchelStore();
  const groundAlbumId = getGroundAlbumId(store);
  addItemToInventory(store, groundAlbumId, freedItem, 0, 0);
}

function resolveGroundAlbumId(store) {
  const groundAlbumId = 'ground';
  let album = createAlbum(groundAlbumId);
  album.displayName = GROUND_ALBUM_DISPLAY_NAME;
  addInvInStore(store, album.invId, album);
  return groundAlbumId;
}

export function clearItemsOnGround() {
  const store = getSatchelStore();
  const groundAlbumId = getGroundAlbumId(store);
  clearItemsInInventory(store, groundAlbumId);
}

export function isGroundAlbum(album) {
  return album.invId === 'ground';
}

export function hasGroundAlbum(store) {
  let groundAlbumId = 'ground';
  if (!isInvInStore(store, groundAlbumId)) {
    return false;
  } else {
    return true;
  }
}

export function getGroundAlbumId(store) {
  let groundAlbumId = 'ground';
  if (!isInvInStore(store, groundAlbumId)) {
    return resolveGroundAlbumId(store);
  } else {
    return groundAlbumId;
  }
}
