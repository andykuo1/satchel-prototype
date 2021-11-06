import {
  deleteInventory,
  getInventory,
  getInventoryStore,
  isEmptyInventory,
} from './InventoryStore.js';

/**
 * @param store
 * @param inventoryName
 */
export function createInventoryView(store, inventoryName) {
  const inv = getInventory(store, inventoryName);
  const element = document.createElement('inventory-grid');
  element.name = inv.name;
  return element;
}

/**
 * @param store
 * @param inventoryName
 */
export function createTemporaryInventoryView(store, inventoryName) {
  const inv = getInventory(store, inventoryName);
  const element = document.createElement('inventory-grid');
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
  if (isEmptyInventory(store, inventoryName)) {
    target.removeEventListener('itemchange', onTemporaryInventoryItemChange);
    target.remove();
    deleteInventory(store, inventoryName);
  }
}
