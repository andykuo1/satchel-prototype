import { addItemToAlbum, clearItemsInAlbum } from '../satchel/album/AlbumItems.js';
import { getInventoryStore } from './InventoryStore.js';

/**
 * Assumes the given item is not part of any inventory and that the itemId is unique!
 *
 * @param freedItem
 */
export function dropOnGround(freedItem) {
  const store = getInventoryStore();
  addItemToAlbum(store, 'ground', freedItem);
  const groundElement = document.querySelector('#ground');
  groundElement.scrollTo(0, groundElement.scrollHeight);
}

export function clearGround() {
  const store = getInventoryStore();
  clearItemsInAlbum(store, 'ground');
}
