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
}

export function clearGround() {
  const store = getInventoryStore();
  clearItemsInAlbum(store, 'ground');
}
