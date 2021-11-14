import {
  deleteInventoryFromStore,
  getInventory,
  getInventoryStore,
} from './InventoryStore.js';
import { isInventoryEmpty } from './InventoryTransfer.js';

/** @typedef {import('./element/InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

/**
 * @param store
 * @param inventoryId
 */
export function createInventoryView(store, inventoryId) {
  const inv = getInventory(store, inventoryId);
  const element = /** @type {InventoryGridElement} */ (
    document.createElement('inventory-grid')
  );
  element.title = inv.invId;
  element.name = inv.invId;
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
  element.name = inv.invId;
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
    const inventory = getInventory(store, inventoryId);
    deleteInventoryFromStore(store, inventoryId, inventory);
  }
}
