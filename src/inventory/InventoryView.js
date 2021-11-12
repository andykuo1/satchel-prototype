import {
  deleteInventory,
  getInventory,
  getInventoryStore,
} from './InventoryStore.js';
import { isInventoryEmpty } from './InventoryTransfer.js';

/** @typedef {import('./InventoryGrid.js').InventoryGridElement} InventoryGridElement */

/**
 * @param store
 * @param inventoryName
 */
export function createInventoryView(store, inventoryName) {
  const inv = getInventory(store, inventoryName);
  const element = /** @type {InventoryGridElement} */ (
    document.createElement('inventory-grid')
  );
  element.name = inv.name;
  return element;
}

/**
 * @param store
 * @param inventoryName
 */
export function createTemporaryInventoryView(store, inventoryName) {
  const inv = getInventory(store, inventoryName);
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
  const inventoryName = target.name;
  const store = getInventoryStore();
  if (isInventoryEmpty(store, inventoryName)) {
    target.removeEventListener('itemchange', onTemporaryInventoryItemChange);
    target.remove();
    deleteInventory(store, inventoryName);
  }
}
