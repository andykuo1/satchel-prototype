import { getExistingInventory } from './InventoryTransfer.js';

/** @typedef {import('../components/invgrid/InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

/**
 * @param store
 * @param inventoryId
 */
export function createInventoryView(store, inventoryId) {
  const inv = getExistingInventory(store, inventoryId);
  const element = /** @type {InventoryGridElement} */ (document.createElement('inventory-grid'));
  element.invId = inv.invId;
  return element;
}

/**
 * @param store
 * @param inventoryId
 */
export function createTemporaryInventoryView(store, inventoryId) {
  const inv = getExistingInventory(store, inventoryId);
  const element = /** @type {InventoryGridElement} */ (document.createElement('inventory-grid'));
  element.invId = inv.invId;
  element.toggleAttribute('noinput', true); // Checked by cursor whether the inventory can input items.
  element.toggleAttribute('temp', true);
  return element;
}
