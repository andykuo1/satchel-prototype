import { addItemToAlbum, clearItemsInAlbum } from '../satchel/album/AlbumItems.js';
import { getInventoryStore } from '../store/InventoryStore.js';
import { createAlbum } from './album/Album.js';
import { addAlbumInStore, isAlbumInStore } from './album/AlbumStore.js';
import { dispatchAlbumChange } from './album/AlbumEvents.js';

const GROUND_ALBUM_DISPLAY_NAME = '[ Ground ]';

export function dropItemOnGround(freedItem) {
  const store = getInventoryStore();
  let groundAlbumId = getGroundAlbumId(store);
  if (!groundAlbumId || !isAlbumInStore(store, groundAlbumId)) {
    groundAlbumId = 'ground';
    let album = createAlbum(groundAlbumId);
    album.displayName = GROUND_ALBUM_DISPLAY_NAME;
    addAlbumInStore(store, album.albumId, album);
    dispatchAlbumChange(store, album.albumId);
  }
  addItemToAlbum(store, 'ground', freedItem);
  const groundElement = document.querySelector('#ground');
  groundElement.scrollTo(0, groundElement.scrollHeight);
}

export function clearItemsOnGround() {
  const store = getInventoryStore();
  clearItemsInAlbum(store, 'ground');
}

export function isGroundAlbum(album) {
  return album.albumId === 'ground';
}

export function getGroundAlbumId(store) {
  return 'ground';
}
