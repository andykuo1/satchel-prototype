import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from '../../inventory/InventoryEventStore.js';

/**
 * @param store
 * @param inventoryId
 */
 export function dispatchInventoryChange(store, inventoryId) {
  dispatchStoreEvent(store, 'inventory', inventoryId);
}

/**
 * @param inventoryId
 * @param callback
 */
export function addInventoryChangeListener(inventoryId, callback) {
  addStoreEventListener('inventory', inventoryId, callback);
}

/**
 * @param inventoryId
 * @param callback
 */
export function removeInventoryChangeListener(inventoryId, callback) {
  removeStoreEventListener('inventory', inventoryId, callback);
}
