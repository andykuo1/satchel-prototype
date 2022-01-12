import { addItemToAlbum, clearItemsInAlbum } from '../satchel/album/AlbumItems.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { createAlbum } from './album/Album.js';
import { addAlbumInStore, isAlbumInStore } from '../store/AlbumStore.js';
import { dispatchAlbumChange } from '../events/AlbumEvents.js';

const GROUND_ALBUM_DISPLAY_NAME = '[ Ground ]';

export function dropItemOnGround(freedItem) {
  const store = getSatchelStore();
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
  const store = getSatchelStore();
  clearItemsInAlbum(store, 'ground');
}

export function isGroundAlbum(album) {
  return album.albumId === 'ground';
}

export function getGroundAlbumId(store) {
  return 'ground';
}
