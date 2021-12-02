import { createGridInventory, createSocketInventory } from '../inv/Inv.js';
import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from './InventoryEventStore.js';

/**
 * @typedef {import('../inv/Inv.js').InventoryId} InventoryId
 * @typedef {import('../inv/Inv.js').InventoryType} InventoryType
 * @typedef {import('../inv/Inv.js').Inventory} Inventory
 * @typedef {import('../item/Item.js').ItemId} ItemId
 * @typedef {import('../item/Item.js').Item} Item
 */

/************************************************** STORE */

/**
 * @typedef {object} InventoryStore
 */

let GLOBAL_STORE = createInventoryStore();

export function getInventoryStore() {
  return GLOBAL_STORE;
}

export function createInventoryStore() {
  return {
    data: {
      inventory: {},
      album: {},
    },
  };
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 */
export function isInventoryInStore(store, invId) {
  return invId in store.data.inventory;
}

/**
 *
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 */
export function getInventoryInStore(store, invId) {
  return store.data.inventory[invId];
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @param {Inventory} inventory
 */
export function addInventoryToStore(store, invId, inventory) {
  if (invId !== inventory.invId) {
    throw new Error(`Cannot add inventory '${inventory.invId}' for mismatched id '${invId}'.`);
  }
  if (invId in store.data.inventory) {
    return false;
  }
  store.data.inventory[invId] = inventory;
  dispatchInventoryChange(store, invId);
  return true;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @param {Inventory} inventory
 */
export function deleteInventoryFromStore(store, invId, inventory) {
  if (invId !== inventory.invId) {
    throw new Error(`Cannot delete inventory '${inventory.invId}' for mismatched id '${invId}'.`);
  }
  if (!(invId in store.data.inventory)) {
    return false;
  }
  delete store.data.inventory[invId];
  dispatchInventoryChange(store, invId);
  return true;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @param {number} width
 * @param {number} height
 * @returns {Inventory}
 */
export function createGridInventoryInStore(store, invId, width, height) {
  let inv = createGridInventory(invId, width, height);
  if (!addInventoryToStore(store, invId, inv)) {
    throw new Error('Failed to create socket inventory in store.');
  }
  return inv;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @returns {Inventory}
 */
export function createSocketInventoryInStore(store, invId) {
  let inv = createSocketInventory(invId);
  if (!addInventoryToStore(store, invId, inv)) {
    throw new Error('Failed to create socket inventory in store.');
  }
  return inv;
}

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

/**
 * @param store
 */
export function getInventoryList(store) {
  return Object.values(store.data.inventory);
}
