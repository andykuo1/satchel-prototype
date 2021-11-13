import {
  deleteInventory,
  getInventory,
  getInventoryStore,
} from './InventoryStore.js';
import { isInventoryEmpty } from './InventoryTransfer.js';

/** @typedef {import('./InventoryGrid.js').InventoryGridElement} InventoryGridElement */

/**
 * @param store
 * @param inventoryId
 */
export function createInventoryView(store, inventoryId) {
  const inv = getInventory(store, inventoryId);
  const element = /** @type {InventoryGridElement} */ (
    document.createElement('inventory-grid')
  );
  element.name = inv.name;
  return element;
}

/**
 * @param store
 * @param inventoryId
 */
export function createTemporaryInventoryView(store, inventoryId) {
  const inv = getInventory(store, inventoryId);
  const element = /** @type {InventoryGridElement} */ (
    document.createElement('inventory-grid')
  );
  element.name = inv.name;
  element.addEventListener('itemchange', onTemporaryInventoryItemChange);
  return element;
}

/**
 * @param e
 */
function onTemporaryInventoryItemChange(e) {
  const { target } = e;
  const inventoryId = target.name;
  const store = getInventoryStore();
  if (isInventoryEmpty(store, inventoryId)) {
    target.removeEventListener('itemchange', onTemporaryInventoryItemChange);
    target.remove();
    deleteInventory(store, inventoryId);
  }
}
